import { z } from "zod";
import { errorResponse, structured } from "@/lib/llm";
import type { Partner, Profile } from "@/lib/types";

export const maxDuration = 60;

const EmailSchema = z.object({
  subject: z.string(),
  body: z.string(),
});

const SYSTEM = `You write short, specific first-touch partnership emails from a startup founder. They get replies because they are about the recipient, not the sender.

Rules:
- Under 130 words in the body. No preamble like "I hope this finds you well".
- Open with something specific about the recipient's company, taken only from the evidence given. Never invent facts, numbers, customers or news about them.
- One or two sentences on what the startup does, framed as what it gives the recipient's customers or business.
- Propose one concrete partnership shape (referral, co-marketing, integration, bundled offering, pilot).
- End with a low-friction ask (a 20-minute call). Sign off with "[Your name]".
- Plain text. Address the recipient by role if no name is known ("Hi there" is fine).`;

export async function POST(req: Request) {
  try {
    const { profile, partner } = (await req.json()) as { profile: Profile; partner: Partner };

    const email = await structured({
      schema: EmailSchema,
      system: SYSTEM,
      user: `<startup_profile>
${JSON.stringify(profile, null, 2)}
</startup_profile>

<recipient>
Company: ${partner.name}
Category: ${partner.category}
Role we're writing to: ${partner.contact_role}
Why they'd care (our analysis): ${partner.why}
Evidence from the web (${partner.source_url}):
${partner.evidence}
</recipient>

Write the email.`,
      effort: "low",
    });

    return Response.json({ email });
  } catch (err) {
    return errorResponse(err);
  }
}
