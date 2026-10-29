import { z } from "zod";
import { errorResponse, structured } from "@/lib/llm";
import { domainOf } from "@/lib/search";
import { normalizeUrl, readSite } from "@/lib/site";
import type { Profile } from "@/lib/types";

export const maxDuration = 120;

const ProfileSchema = z.object({
  company_name: z.string(),
  one_liner: z.string().describe("One sentence: what the company does, for whom."),
  product: z.string().describe("What they sell, concretely. 1-3 sentences."),
  customers: z
    .string()
    .describe("Who buys and who uses it (if different). Name segments, not 'businesses'."),
  value_prop: z.string().describe("Why customers choose it. 1-2 sentences."),
  gaps: z
    .array(z.string())
    .describe(
      "3-5 things this company lacks that a partner could supply: distribution channels, clinical services, data, trust, integrations, geographic reach, etc. Each a short phrase.",
    ),
  geography: z.string().describe("Where they operate or sell, or 'Unclear' if not stated."),
});

const SYSTEM = `You are a partnerships analyst at a venture studio. You read a startup's website and write a crisp, factual profile used to find distribution and channel partners.

Stick to what the page supports. Where you infer (gaps especially), infer from the business model, not from imagination. Be specific: "women 35-55 in perimenopause" beats "women"; "needs a clinical partner to prescribe" beats "needs partners".`;

export async function POST(req: Request) {
  try {
    const { url } = (await req.json()) as { url: string };
    const normalized = normalizeUrl(url);
    const siteText = await readSite(normalized);

    const result = await structured({
      schema: ProfileSchema,
      system: SYSTEM,
      user: `Company URL: ${normalized}\n\n<website_content>\n${siteText}\n</website_content>\n\nWrite the profile.`,
      effort: "low",
    });

    const profile: Profile = { ...result, domain: domainOf(normalized) };
    return Response.json({ profile });
  } catch (err) {
    return errorResponse(err);
  }
}
