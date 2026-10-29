import { UserFacingError } from "./llm";

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

const TIMEOUT_MS = 20_000;

// Uses whichever provider has a key: Exa, then Tavily, then Serper.
export function searchProvider(): "exa" | "tavily" | "serper" {
  if (process.env.EXA_API_KEY) return "exa";
  if (process.env.TAVILY_API_KEY) return "tavily";
  if (process.env.SERPER_API_KEY) return "serper";
  throw new UserFacingError(
    "No search API key set. Add EXA_API_KEY, TAVILY_API_KEY or SERPER_API_KEY to .env.local and restart.",
  );
}

export async function search(
  query: string,
  opts: { num?: number; companiesOnly?: boolean } = {},
): Promise<SearchResult[]> {
  const num = opts.num ?? 8;
  switch (searchProvider()) {
    case "exa":
      return exa(query, num, opts.companiesOnly ?? false);
    case "tavily":
      return tavily(query, num);
    case "serper":
      return serper(query, num);
  }
}

async function postJson(url: string, headers: Record<string, string>, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Search failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function exa(query: string, num: number, companiesOnly: boolean): Promise<SearchResult[]> {
  const data = await postJson(
    "https://api.exa.ai/search",
    { "x-api-key": process.env.EXA_API_KEY! },
    {
      query,
      type: "auto",
      numResults: num,
      ...(companiesOnly ? { category: "company" } : {}),
      contents: { text: { maxCharacters: 800 } },
    },
  );
  return (data.results ?? []).map((r: { title?: string; url: string; text?: string }) => ({
    title: r.title ?? "",
    url: r.url,
    snippet: r.text ?? "",
  }));
}

async function tavily(query: string, num: number): Promise<SearchResult[]> {
  const data = await postJson(
    "https://api.tavily.com/search",
    { Authorization: `Bearer ${process.env.TAVILY_API_KEY}` },
    { query, max_results: num, search_depth: "basic" },
  );
  return (data.results ?? []).map((r: { title?: string; url: string; content?: string }) => ({
    title: r.title ?? "",
    url: r.url,
    snippet: r.content ?? "",
  }));
}

async function serper(query: string, num: number): Promise<SearchResult[]> {
  const data = await postJson(
    "https://google.serper.dev/search",
    { "X-API-KEY": process.env.SERPER_API_KEY! },
    { q: query, num },
  );
  return (data.organic ?? []).map((r: { title?: string; link: string; snippet?: string }) => ({
    title: r.title ?? "",
    url: r.link,
    snippet: r.snippet ?? "",
  }));
}

export function domainOf(url: string): string {
  try {
    const u = new URL(url.includes("://") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}
