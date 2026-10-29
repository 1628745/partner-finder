import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

const MODEL = "claude-opus-5-5";

let client: Anthropic | null = null;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new UserFacingError("ANTHROPIC_API_KEY is not set. Add it to .env.local and restart.");
  }
  client ??= new Anthropic();
  return client;
}

export class UserFacingError extends Error {}

type Effort = "low" | "medium" | "high";

// One structured-output call: returns the parsed object or throws.
export async function structured<S extends z.ZodType>(opts: {
  schema: S;
  system: string;
  user: string;
  effort?: Effort;
}): Promise<z.infer<S>> {
  const res = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    // On a safety decline, the API re-runs the request on a fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
    output_config: {
      effort: opts.effort ?? "medium",
      format: betaZodOutputFormat(opts.schema),
    },
  });

  if (res.stop_reason === "refusal") {
    throw new UserFacingError("The model declined this request.");
  }
  if (res.stop_reason === "max_tokens") {
    throw new UserFacingError("The model ran out of output tokens. Try again.");
  }
  if (!res.parsed_output) {
    throw new UserFacingError("The model returned output that didn't match the expected format.");
  }
  return res.parsed_output as z.infer<S>;
}

// Turns any thrown error into a JSON response the page can show.
export function errorResponse(err: unknown) {
  console.error(err);
  let message = "Something went wrong.";
  let status = 500;
  if (err instanceof UserFacingError) {
    message = err.message;
    status = 400;
  } else if (err instanceof Anthropic.AuthenticationError) {
    message = "ANTHROPIC_API_KEY was rejected.";
  } else if (err instanceof Anthropic.RateLimitError) {
    message = "Claude rate limit hit. Wait a moment and retry.";
    status = 429;
  } else if (err instanceof Anthropic.APIError) {
    message = `Claude API error: ${err.message}`;
  } else if (err instanceof Error) {
    message = err.message;
  }
  return Response.json({ error: message }, { status });
}
