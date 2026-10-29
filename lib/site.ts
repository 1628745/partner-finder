import { UserFacingError } from "./llm";
import { domainOf, search } from "./search";

const MAX_CHARS = 15_000;

export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new UserFacingError("Enter a company URL.");
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withScheme).toString();
  } catch {
    throw new UserFacingError(`"${input}" doesn't look like a URL.`);
  }
}

function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

function meta(html: string, name: string): string {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']*)["']`,
    "i",
  );
  return html.match(re)?.[1] ?? "";
}

// Returns readable text about the company: the homepage, plus search
// snippets when the page is thin (JS-rendered sites often are).
export async function readSite(url: string): Promise<string> {
  const domain = domainOf(url);
  const parts: string[] = [];

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36",
        Accept: "text/html",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    if (res.ok) {
      const html = await res.text();
      const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "";
      const description = meta(html, "description") || meta(html, "og:description");
      parts.push(`Title: ${title}`, `Meta description: ${description}`, htmlToText(html));
    }
  } catch {
    // Fall through to search snippets.
  }

  const text = parts.join("\n");
  if (text.length < 1500) {
    const results = await search(`${domain} company`, { num: 6 }).catch(() => []);
    const snippets = results
      .filter((r) => domainOf(r.url).endsWith(domain) || r.snippet.toLowerCase().includes(domain))
      .map((r) => `[${r.url}] ${r.title}\n${r.snippet}`);
    if (snippets.length) parts.push("Search results about the company:", ...snippets);
  }

  const combined = parts.join("\n").slice(0, MAX_CHARS);
  if (combined.replace(/\s/g, "").length < 100) {
    throw new UserFacingError(`Couldn't read anything useful from ${domain}. Check the URL.`);
  }
  return combined;
}
