import { z } from "zod";
import { errorResponse, structured } from "@/lib/llm";
import type { Profile } from "@/lib/types";

export const maxDuration = 120;

const CategoriesSchema = z.object({
  categories: z.array(
    z.object({
      name: z.string().describe("Short category label, e.g. 'GLP-1 telehealth providers'."),
      rationale: z
        .string()
        .describe("One sentence: why companies in this category would want this startup."),
      contact_role: z
        .string()
        .describe("Most likely job title to contact at such a company, e.g. 'Head of Partnerships'."),
      queries: z
        .array(z.string())
        .describe(
          "2 web search queries that return the homepages of real companies in this category. Describe the company, not the partnership: 'telehealth company prescribing GLP-1 weight loss medication', not 'GLP-1 partners'.",
        ),
    }),
  ),
});

const SYSTEM = `You are a partnerships strategist. Given a startup profile, you propose the categories of companies that would make the best distribution or channel partners.

The core question for each category: who already has this startup's customers, and would benefit from offering this product to them? Favor categories where the partner gains something concrete (revenue, retention, outcomes, differentiation) and where the startup's gaps get filled. Exclude direct competitors. Be specific enough that a web search on the category returns real companies.`;

export async function POST(req: Request) {
  try {
    const { profile } = (await req.json()) as { profile: Profile };

    const { categories } = await structured({
      schema: CategoriesSchema,
      system: SYSTEM,
      user: `<startup_profile>\n${JSON.stringify(profile, null, 2)}\n</startup_profile>\n\nPropose 4-6 partner categories, best first.`,
      effort: "medium",
    });

    return Response.json({ categories: categories.slice(0, 6) });
  } catch (err) {
    return errorResponse(err);
  }
}
