"use client";

import { Copy, Download, ExternalLink, Globe, Link2, Loader2, RefreshCw, Rows3, Search } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Partner } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useApp } from "./app-context";
import { DetailPanel, Property } from "./detail-panel";
import { Header, HeaderButton } from "./header";
import { DraftStatus, Label, LabelDot, ScoreBars } from "./icons";
import { Shortcut } from "./shortcut";

function domain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function Elapsed({ since }: { since: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return <span className="tabular-nums">{Math.max(0, Math.round((now - since) / 1000))}s</span>;
}

function PartnerDetail({ partner, rank }: { partner: Partner; rank: number }) {
  const app = useApp();
  const drafting = !!app.drafting[partner.id];
  const move = (d: number) => {
    const list = app.visiblePartners;
    const i = list.findIndex((p) => p.id === partner.id);
    const next = list[Math.max(0, Math.min(list.length - 1, i + d))];
    if (next) app.setSelectedPartner(next.id);
  };

  return (
    <DetailPanel
      title={`${app.issuePrefix}-${rank}`}
      onClose={() => app.setPartnerOpen(false)}
      onPrev={() => move(-1)}
      onNext={() => move(1)}
    >
      <div className="px-5 pt-5 pb-10">
        <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-foreground">{partner.name}</h2>
        <p className="mt-1.5 text-[14px] leading-[1.6] text-muted-foreground">{partner.why}</p>

        <div className="mt-5 flex flex-col">
          <Property label="Fit">
            <span className="flex items-center gap-2">
              <ScoreBars score={partner.fit_score} /> {partner.fit_score} / 10
            </span>
          </Property>
          <Property label="Category">
            <Label name={partner.category} color={app.categoryColor(partner.category)} />
          </Property>
          <Property label="Contact">{partner.contact_role}</Property>
          {partner.website && (
            <Property label="Website">
              <a href={partner.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-foreground">
                <Globe className="size-3.5 text-muted-foreground" /> {domain(partner.website)}
              </a>
            </Property>
          )}
          <Property label="Source">
            <a
              href={partner.source_url}
              target="_blank"
              rel="noreferrer"
              title={partner.source_title}
              className="inline-flex max-w-full items-center gap-1.5 hover:text-foreground"
            >
              <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{domain(partner.source_url)}</span>
              <ExternalLink className="size-3 shrink-0 text-tertiary-foreground" />
            </a>
          </Property>
        </div>

        <div className="my-5 h-px bg-border" />

        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[12px] font-medium text-muted-foreground">Outreach draft</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => app.draftEmail(partner.id)}
              disabled={drafting}
              className="inline-flex h-6 items-center gap-1.5 rounded-md px-1.5 text-[12px] text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw className={cn("size-3", drafting && "animate-spin")} />
              {partner.email ? "Regenerate" : "Draft"} <Shortcut keys={partner.email ? "r" : "e"} />
            </button>
            <button
              onClick={() => app.copyEmail(partner.id)}
              disabled={!partner.email || drafting}
              className="inline-flex h-6 items-center gap-1.5 rounded-md px-1.5 text-[12px] text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
            >
              <Copy className="size-3" /> Copy <Shortcut keys="c" />
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {drafting || !partner.email ? (
            <div className="flex flex-col gap-2.5 p-4">
              {drafting ? (
                <>
                  <div className="h-3 w-1/2 animate-pulse rounded bg-[#222327]" />
                  <div className="mt-2 h-3 w-full animate-pulse rounded bg-[#1d1e21]" />
                  <div className="h-3 w-11/12 animate-pulse rounded bg-[#1d1e21]" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-[#1d1e21]" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-[#1d1e21]" />
                </>
              ) : (
                <p className="text-[13px] text-muted-foreground">
                  No draft yet. Press <Shortcut keys="e" /> to write one.
                </p>
              )}
            </div>
          ) : (
            <>
              <input
                value={partner.email.subject}
                onChange={(e) => app.updateEmail(partner.id, { subject: e.target.value })}
                className="h-10 w-full border-b border-border bg-transparent px-4 text-[13px] font-medium text-foreground outline-none"
              />
              <textarea
                value={partner.email.body}
                onChange={(e) => app.updateEmail(partner.id, { body: e.target.value })}
                className="field-sizing-content min-h-[240px] w-full resize-none bg-transparent px-4 py-3 text-[13px] leading-[1.65] text-[#d0d6e0] outline-none"
              />
            </>
          )}
        </div>

        {partner.evidence && (
          <>
            <h3 className="mt-6 mb-2 text-[12px] font-medium text-muted-foreground">From the search result</h3>
            <p className="line-clamp-6 border-l-2 border-border pl-3 text-[12px] leading-[1.6] text-tertiary-foreground">
              {partner.evidence}
            </p>
          </>
        )}
      </div>
    </DetailPanel>
  );
}

export function PartnersView() {
  const app = useApp();
  const { profile, partners, visiblePartners, selectedPartner, partnerOpen, busy, grouped, categoryFilter } = app;
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const rank = new Map(partners.map((p, i) => [p.id, i + 1]));

  useEffect(() => {
    if (selectedPartner) rowRefs.current[selectedPartner]?.scrollIntoView({ block: "nearest" });
  }, [selectedPartner]);

  if (!profile) return null;
  const open = partnerOpen ? partners.find((p) => p.id === selectedPartner) : undefined;
  const categoryNames = [...new Set(partners.map((p) => p.category))];

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <Header crumbs={[profile.company_name, "Partners", ...(categoryFilter ? [categoryFilter] : [])]}>
          <HeaderButton onClick={app.exportCsv} hotkey="shift+e" tooltip="Export CSV" disabled={!partners.length}>
            <Download /> Export
          </HeaderButton>
        </Header>

        <div className="flex h-10 shrink-0 items-center gap-1.5 border-b border-border px-3">
          <button
            onClick={() => app.setCategoryFilter(null)}
            className={cn(
              "inline-flex h-7 items-center rounded-md border px-2.5 text-[12px]",
              !categoryFilter
                ? "border-border bg-[#1e1f22] text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            All partners
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none]">
            {categoryNames.map((name) => (
              <button
                key={name}
                onClick={() => app.setCategoryFilter(categoryFilter === name ? null : name)}
                className={cn(
                  "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-[12px]",
                  categoryFilter === name
                    ? "border-border bg-[#1e1f22] text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <LabelDot color={app.categoryColor(name)} className="size-1.5" />
                <span className="max-w-[160px] truncate">{name}</span>
              </button>
            ))}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-border bg-[#17181a] px-2.5 text-[12px] text-[#d0d6e0] hover:bg-[#1e1f22]">
                <Rows3 className="size-3.5" /> Display
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-[12px] text-muted-foreground">Display</DropdownMenuLabel>
              <DropdownMenuCheckboxItem checked={grouped} onCheckedChange={(v) => app.setGrouped(!!v)} className="text-[13px]">
                Group by category
                <Shortcut keys="shift+g" className="ml-auto" />
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          {busy === "partners" ? (
            <div>
              <div className="flex h-10 items-center gap-2 border-b border-border px-5 text-[13px] text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Searching the web, then checking and scoring real companies
                <span className="ml-auto text-tertiary-foreground">
                  <Elapsed since={app.busySince} />
                </span>
              </div>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex h-11 items-center gap-3 border-b border-border/60 px-5">
                  <div className="h-3 w-10 animate-pulse rounded bg-[#1b1c1f]" />
                  <div className="h-3 animate-pulse rounded bg-[#1b1c1f]" style={{ width: `${120 + ((i * 37) % 90)}px` }} />
                  <div className="h-3 flex-1 animate-pulse rounded bg-[#17181a]" />
                  <div className="h-5 w-28 animate-pulse rounded-full bg-[#1b1c1f]" />
                </div>
              ))}
            </div>
          ) : !partners.length ? (
            <div className="grid h-full place-items-center text-center">
              <div>
                <p className="text-[14px] text-foreground">No partners yet</p>
                <p className="mt-1 text-[13px] text-muted-foreground">Run a search from your categories.</p>
                <div className="mt-4 flex justify-center">
                  <HeaderButton primary onClick={app.findPartners} hotkey="mod+enter" tooltip="Find partners">
                    <Search /> Find partners
                  </HeaderButton>
                </div>
              </div>
            </div>
          ) : (
            <>
              {visiblePartners.map((p, i) => {
                const groupStart = grouped && (i === 0 || visiblePartners[i - 1].category !== p.category);
                const state = app.drafting[p.id] ? "drafting" : p.email ? "done" : "none";
                return (
                  <Fragment key={p.id}>
                    {groupStart && (
                      <div className="sticky top-0 z-10 flex h-9 items-center gap-2 border-b border-border bg-[#141516] px-5 text-[13px]">
                        <LabelDot color={app.categoryColor(p.category)} />
                        <span className="font-medium text-foreground">{p.category}</span>
                        <span className="text-tertiary-foreground">
                          {visiblePartners.filter((x) => x.category === p.category).length}
                        </span>
                      </div>
                    )}
                    <div
                      ref={(el) => {
                        rowRefs.current[p.id] = el;
                      }}
                      onClick={() => app.openPartner(p.id)}
                      className={cn(
                        "group flex h-11 cursor-default items-center gap-3 border-b border-border/60 pr-5 pl-5 text-[13px] hover:bg-row-hover",
                        p.id === selectedPartner && "bg-row-selected hover:bg-row-selected",
                      )}
                    >
                      <span className="flex w-10 shrink-0 items-center gap-1.5">
                        <ScoreBars score={p.fit_score} />
                        <span className="text-[12px] text-muted-foreground tabular-nums">{p.fit_score}</span>
                      </span>
                      <span className="w-[52px] shrink-0 text-[12px] text-tertiary-foreground tabular-nums">
                        {app.issuePrefix}-{rank.get(p.id)}
                      </span>
                      <DraftStatus state={state} />
                      <span className="max-w-[220px] shrink-0 truncate font-medium text-foreground">{p.name}</span>
                      <span className="min-w-0 flex-1 truncate text-muted-foreground">{p.why}</span>
                      {!open && (
                        <>
                          <span className="hidden shrink-0 xl:inline">
                            <Label name={p.category} color={app.categoryColor(p.category)} />
                          </span>
                          <span className="hidden w-[150px] shrink-0 truncate text-right text-[12px] text-muted-foreground lg:inline">
                            {p.contact_role}
                          </span>
                        </>
                      )}
                    </div>
                  </Fragment>
                );
              })}
              {app.searchNote && (
                <p className="px-5 py-4 text-[12px] text-tertiary-foreground">{app.searchNote}</p>
              )}
            </>
          )}
        </div>
      </div>
      {open && <PartnerDetail partner={open} rank={rank.get(open.id) ?? 0} />}
    </div>
  );
}
