"use client";

import { Loader2, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useApp } from "./app-context";
import { DetailPanel, Property } from "./detail-panel";
import { Header, HeaderButton } from "./header";
import { LabelDot } from "./icons";
import { Shortcut } from "./shortcut";

function CategoryDetail({ index }: { index: number }) {
  const app = useApp();
  const c = app.categories[index];
  if (!c) return null;
  const move = (d: number) =>
    app.setSelectedCategory((i) => Math.max(0, Math.min(app.categories.length - 1, i + d)));

  return (
    <DetailPanel
      title={`Category ${index + 1} of ${app.categories.length}`}
      onClose={() => app.setCategoryOpen(false)}
      onPrev={() => move(-1)}
      onNext={() => move(1)}
    >
      <div className="px-5 pt-5 pb-10">
        <input
          value={c.name}
          onChange={(e) => app.updateCategory(index, { name: e.target.value })}
          className="w-full bg-transparent text-[18px] font-semibold tracking-[-0.01em] text-foreground outline-none"
        />
        <textarea
          value={c.rationale}
          onChange={(e) => app.updateCategory(index, { rationale: e.target.value })}
          placeholder="Why would these companies want this startup?"
          rows={1}
          className="field-sizing-content mt-1 w-full resize-none bg-transparent text-[14px] leading-[1.6] text-muted-foreground outline-none placeholder:text-tertiary-foreground"
        />

        <div className="mt-5 flex flex-col">
          <Property label="Contact">
            <input
              value={c.contact_role}
              onChange={(e) => app.updateCategory(index, { contact_role: e.target.value })}
              className="h-7 w-full rounded-md bg-transparent px-2 -mx-2 outline-none hover:bg-accent focus:bg-accent"
            />
          </Property>
          <Property label="Label">
            <span className="flex items-center gap-2">
              <LabelDot color={app.categoryColor(c.name)} /> {c.name}
            </span>
          </Property>
        </div>

        <div className="my-5 h-px bg-border" />

        <h3 className="mb-2 text-[12px] font-medium text-muted-foreground">Search queries</h3>
        <div className="flex flex-col gap-1.5">
          {c.queries.map((q, qi) => (
            <div
              key={qi}
              className="group flex items-center gap-2 rounded-md border border-border bg-card px-2.5 focus-within:border-[#3b3e45]"
            >
              <Search className="size-3.5 shrink-0 text-tertiary-foreground" />
              <input
                value={q}
                onChange={(e) =>
                  app.updateCategory(index, { queries: c.queries.map((x, j) => (j === qi ? e.target.value : x)) })
                }
                placeholder="Describe the kind of company to find"
                className="h-8 min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-tertiary-foreground"
              />
              <button
                onClick={() => app.updateCategory(index, { queries: c.queries.filter((_, j) => j !== qi) })}
                className="text-tertiary-foreground opacity-0 group-hover:opacity-100 hover:text-foreground"
                aria-label="Remove query"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => app.updateCategory(index, { queries: [...c.queries, ""] })}
          className="mt-2 inline-flex h-7 items-center gap-1.5 rounded-md px-1 text-[13px] text-tertiary-foreground hover:text-muted-foreground"
        >
          <Plus className="size-3.5" /> Add query
        </button>

        <div className="mt-8">
          <button
            onClick={() => app.removeCategory(index)}
            className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] text-muted-foreground hover:bg-accent hover:text-destructive"
          >
            <Trash2 className="size-3.5" /> Delete category <Shortcut keys="mod+backspace" className="ml-1" />
          </button>
        </div>
      </div>
    </DetailPanel>
  );
}

export function CategoriesView() {
  const app = useApp();
  const { profile, categories, selectedCategory, categoryOpen, busy } = app;
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    rowRefs.current[selectedCategory]?.scrollIntoView({ block: "nearest" });
  }, [selectedCategory]);

  if (!profile) return null;

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <Header crumbs={[profile.company_name, "Categories"]}>
          <HeaderButton onClick={app.addCategory} hotkey="c" tooltip="New category" disabled={busy !== null}>
            <Plus /> New category
          </HeaderButton>
          <HeaderButton
            primary
            onClick={app.findPartners}
            disabled={busy !== null || !categories.length}
            hotkey="mod+enter"
            tooltip="Search the web for partners"
          >
            <Search /> {app.partners.length ? "Search again" : "Find partners"}
          </HeaderButton>
        </Header>

        <div className="flex-1 overflow-y-auto">
          {busy === "categories" && (
            <div className="flex h-10 items-center gap-2 border-b border-border px-5 text-[13px] text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Working out who already has {profile.company_name}&apos;s
              customers…
            </div>
          )}
          {busy === "partners" && (
            <div className="flex h-10 items-center gap-2 border-b border-border px-5 text-[13px] text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Searching…
            </div>
          )}
          {!categories.length && busy !== "categories" && (
            <div className="grid h-full place-items-center text-center">
              <div>
                <p className="text-[14px] text-foreground">No categories yet</p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  Suggest them from the profile, or add your own.
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  <HeaderButton onClick={app.addCategory} hotkey="c" tooltip="New category">
                    <Plus /> New category
                  </HeaderButton>
                  <HeaderButton primary onClick={app.suggestCategories} hotkey="mod+enter" tooltip="Suggest categories">
                    Suggest categories
                  </HeaderButton>
                </div>
              </div>
            </div>
          )}
          {categories.map((c, i) => (
            <div
              key={i}
              ref={(el) => {
                rowRefs.current[i] = el;
              }}
              onClick={() => {
                app.setSelectedCategory(i);
                app.setCategoryOpen(true);
              }}
              className={cn(
                "flex h-11 cursor-default items-center gap-3 border-b border-border/60 pr-5 pl-5 text-[13px] hover:bg-row-hover",
                i === selectedCategory && "bg-row-selected hover:bg-row-selected",
              )}
            >
              <span className="w-6 shrink-0 text-[12px] text-tertiary-foreground tabular-nums">{i + 1}</span>
              <LabelDot color={app.categoryColor(c.name)} />
              <span className="shrink-0 font-medium text-foreground">{c.name}</span>
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{c.rationale}</span>
              <span className="shrink-0 text-[12px] text-muted-foreground">{c.contact_role}</span>
              <span className="inline-flex h-6 shrink-0 items-center gap-1 rounded-full border border-border px-2 text-[12px] text-muted-foreground">
                <Search className="size-3" /> {c.queries.filter((q) => q.trim()).length}
              </span>
            </div>
          ))}
        </div>
      </div>
      {categoryOpen && categories[selectedCategory] && <CategoryDetail index={selectedCategory} />}
    </div>
  );
}
