import { z } from "zod";
import { errorResponse, structured, UserFacingError } from "@/lib/llm";
import { domainOf, search, type SearchResult } from "@/lib/search";
import type { Category, Partner, Profile } from "@/lib/types";

export const maxDuration = 300;

const MAX_CANDIDATES = 90;
const SNIPPET_CHARS = 450;

const PartnersSchema = z.object({
  partners: z.array(
    z.object({
      candidate_id: z
        .string()
        .describe("ID of the search result (e.g. 'C12') that names this company."),
      name: z
        .string()
        .describe(
          "The company's common name as written in that search result, without legal suffixes (Inc., LLC) or page-title fragments.",
        ),
      category: z.string().describe("One of the given category names."),
      fit_score: z.number().int().describe("1-10. 9-10: obvious, high-value fit. 5-6: plausible."),
      why: z
        .string()
        .describe("One line, under 25 words: what this company gains by partnering. Specific to them."),
      contact_role: z.string().describe("Job title to contact at this company."),
    }),
  ),
});

const SYSTEM = `You are a partnerships analyst. You get a startup profile, the partner categories we're targeting, and numbered web search results. You pick the real companies in those results that would make good partners and score them.

Hard rules:
- Only pick companies that are named in the search results. Every pick cites the candidate_id of a result that names it, and uses the name as written there. Never add companies from your own knowledge, even well-known ones. If a result is a list article, you may pick companies the snippet names, citing that result.
- One entry per company. Skip the startup itself, its direct competitors, publishers, directories, job boards, investors, government bodies and generic news.
- Score fit against the profile: does this company already serve the startup's customers, would offering the startup's product help them, does it fill one of the startup's gaps, is it a plausible size and stage to partner?
- The "why" must be about that specific company, grounded in its snippet. No generic lines that would fit any company in the category.`;

interface Candidate extends SearchResult {
  id: string;
  categories: Set<string>;
}

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const GENERIC = new Set([
  "the", "inc", "llc", "ltd", "gmbh", "corp", "company", "co", "group", "health", "healthcare",
  "medical", "clinic", "clinics", "care", "center", "centre", "labs", "technologies", "tech", "app",
]);

function distinctiveToken(name: string): string | undefined {
  return norm(name)
    .split(" ")
    .find((t) => t.length >= 3 && !GENERIC.has(t));
}

// The guard against invented partners: the name must appear in the cited result.
function nameAppearsIn(name: string, c: Candidate): boolean {
  const hay = norm(`${c.title} ${c.snippet} ${c.url}`);
  const full = norm(name);
  if (full && hay.includes(full)) return true;
  const token = distinctiveToken(name);
  return !!token && hay.split(" ").includes(token);
}

function isOwnSite(name: string, url: string): boolean {
  const token = distinctiveToken(name);
  const compactName = norm(name).replace(/ /g, "");
  const host = domainOf(url).replace(/[^a-z0-9]/g, "");
  return (!!token && host.includes(token)) || (compactName.length >= 4 && host.includes(compactName));
}

async function gatherCandidates(profile: Profile, categories: Category[]) {
  const jobs = categories.flatMap((cat) =>
    cat.queries.slice(0, 2).map(async (q) => {
      const results = await search(q, { num: 8, companiesOnly: true }).catch((e) => {
        console.error(`search failed for "${q}":`, e);
        return [] as SearchResult[];
      });
      return { cat: cat.name, results };
    }),
  );
  const batches = await Promise.all(jobs);

  const ownDomain = profile.domain;
  const byDomain = new Map<string, Candidate>();
  for (const { cat, results } of batches) {
    for (const r of results) {
      const d = domainOf(r.url);
      if (!d || (ownDomain && d.endsWith(ownDomain))) continue;
      // Dedupe company homepages by domain; keep distinct articles by full URL.
      const key = r.url.replace(/[?#].*$/, "").replace(/\/$/, "").split("/").length <= 3 ? d : r.url;
      const existing = byDomain.get(key);
      if (existing) {
        existing.categories.add(cat);
      } else {
        byDomain.set(key, { ...r, id: "", categories: new Set([cat]) });
      }
    }
  }

  const candidates = [...byDomain.values()].slice(0, MAX_CANDIDATES);
  candidates.forEach((c, i) => (c.id = `C${i + 1}`));
  return candidates;
}

export async function POST(req: Request) {
  try {
    const { profile, categories } = (await req.json()) as {
      profile: Profile;
      categories: Category[];
    };
    if (!categories?.length) throw new UserFacingError("Add at least one category.");

    const candidates = await gatherCandidates(profile, categories);
    if (!candidates.length) {
      throw new UserFacingError("Search returned no results. Try editing the category queries.");
    }

    const resultsText = candidates
      .map(
        (c) =>
          `[${c.id}] ${c.title}\nURL: ${c.url}\nFound via: ${[...c.categories].join(", ")}\n${c.snippet
            .replace(/\s+/g, " ")
            .slice(0, SNIPPET_CHARS)}`,
      )
      .join("\n\n");

    const categoryText = categories
      .map((c) => `- ${c.name}: ${c.rationale} (default contact: ${c.contact_role})`)
      .join("\n");

    const { partners: picks } = await structured({
      schema: PartnersSchema,
      system: SYSTEM,
      user: `<startup_profile>
${JSON.stringify(profile, null, 2)}
</startup_profile>

<categories>
${categoryText}
</categories>

<search_results>
${resultsText}
</search_results>

Pick 15-30 partner companies from these results (fewer if the results don't support that many good ones), best fit first.`,
      effort: "medium",
    });

    const byId = new Map(candidates.map((c) => [c.id, c]));
    const seen = new Set<string>();
    const partners: Partner[] = [];
    let dropped = 0;

    for (const p of picks) {
      const c = byId.get(p.candidate_id);
      const key = norm(p.name);
      if (!c || !nameAppearsIn(p.name, c) || seen.has(key)) {
        dropped++;
        continue;
      }
      seen.add(key);
      partners.push({
        id: `${key.replace(/ /g, "-")}-${partners.length}`,
        name: p.name,
        category: p.category,
        fit_score: Math.max(1, Math.min(10, p.fit_score)),
        why: p.why,
        contact_role: p.contact_role,
        website: isOwnSite(p.name, c.url) ? `https://${domainOf(c.url)}` : null,
        source_url: c.url,
        source_title: c.title,
        evidence: c.snippet.replace(/\s+/g, " ").slice(0, 1200),
      });
    }

    partners.sort((a, b) => b.fit_score - a.fit_score);
    return Response.json({ partners, candidateCount: candidates.length, dropped });
  } catch (err) {
    return errorResponse(err);
  }
}
