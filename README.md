# Partner Finder

Paste a startup's URL, get a ranked list of real partner companies, each with a reason and an outreach draft.

1. **Profile**: fetches the site and has Claude write a structured profile (product, customers, value prop, gaps). Editable.
2. **Categories**: Claude proposes 4–6 partner categories ("who already has these customers?"), each with a contact role and two search queries. Editable.
3. **Partners**: runs every query through a search API, dedupes the results, and has Claude pick and score 15–30 companies **only from those results**. The server then drops any pick whose name doesn't appear in the search result it cites, so a partner can't be invented.
4. **Email**: drafted on demand when you open a row.
5. **Export CSV**: includes any emails drafted so far.

No database. State lives in the browser (localStorage).

## Run it

```bash
cp .env.example .env.local   # add ANTHROPIC_API_KEY and one search key
npm install
npm run dev
```

Search provider: set one of `EXA_API_KEY` (best: it can restrict results to company homepages), `TAVILY_API_KEY` or `SERPER_API_KEY`. If several are set, Exa wins, then Tavily.

## Keyboard

| Keys | Action |
| --- | --- |
| `⌘K` | Command menu (actions, navigation, jump to any partner) |
| `?` | All shortcuts |
| `N` | New analysis |
| `⌘↵` | Run the next step |
| `G` `O` / `G` `C` / `G` `P` | Go to profile / categories / partners |
| `J` `K`, `↵`, `Esc` | Move, open, close |
| `E` / `R` / `C` | Draft / regenerate / copy email |
| `⇧G` / `⇧E` | Group by category / export CSV |
| `[` | Toggle sidebar |

## Files

- `app/page.tsx`: app shell and keyboard shortcuts
- `components/app/`: sidebar, views, detail panels, command menu (built on shadcn/ui in `components/ui/`)
- `app/api/{profile,categories,partners,email}/route.ts`: one route per step, prompts inline
- `lib/llm.ts`: Claude structured-output call (`claude-opus-5-5`)
- `lib/search.ts`: Exa / Tavily / Serper adapters
- `lib/site.ts`: homepage fetch and text extraction, with search snippets as a fallback for JS-heavy sites
