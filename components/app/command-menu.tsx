"use client";

import {
  Building2,
  Copy,
  Download,
  Keyboard,
  Layers,
  PanelLeft,
  Plus,
  RefreshCw,
  Rows3,
  Search,
  Sparkles,
  SquarePen,
  Trash2,
  Users,
} from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useApp } from "./app-context";
import { LabelDot, ScoreBars } from "./icons";
import { Shortcut } from "./shortcut";

export function CommandMenu() {
  const app = useApp();
  const { profile, categories, partners, commandOpen, setCommandOpen } = app;
  const selected = partners.find((p) => p.id === app.selectedPartner);

  const run = (fn: () => void) => () => {
    setCommandOpen(false);
    fn();
  };

  const item = "h-9 gap-2.5 px-3 text-[13px] text-[#d0d6e0] [&_svg]:text-muted-foreground";

  return (
    <CommandDialog
      open={commandOpen}
      onOpenChange={setCommandOpen}
      className="max-w-[640px]! border border-border bg-popover shadow-[0_16px_70px_rgba(0,0,0,0.6)]"
    >
      <Command className="bg-popover">
        <CommandInput placeholder="Type a command or search…" className="h-12 text-[14px]" />
        <CommandList className="max-h-[420px] pb-1">
          <CommandEmpty className="py-8 text-center text-[13px] text-muted-foreground">No results.</CommandEmpty>

          <CommandGroup heading="Actions">
            <CommandItem className={item} onSelect={run(app.newAnalysis)}>
              <SquarePen /> New analysis <Shortcut keys="n" className="ml-auto" />
            </CommandItem>
            {profile && (
              <CommandItem className={item} onSelect={run(app.suggestCategories)}>
                <Sparkles /> {categories.length ? "Regenerate categories" : "Suggest categories"}
              </CommandItem>
            )}
            {profile && (
              <CommandItem className={item} onSelect={run(app.addCategory)}>
                <Plus /> New category
              </CommandItem>
            )}
            {categories.length > 0 && (
              <CommandItem className={item} onSelect={run(app.findPartners)}>
                <Search /> {partners.length ? "Search for partners again" : "Find partners"}
              </CommandItem>
            )}
            {selected && (
              <>
                <CommandItem
                  className={item}
                  onSelect={run(() => {
                    app.openPartner(selected.id);
                    if (selected.email) app.draftEmail(selected.id);
                  })}
                >
                  <RefreshCw /> {selected.email ? "Regenerate" : "Draft"} email to {selected.name}
                  <Shortcut keys={selected.email ? "r" : "e"} className="ml-auto" />
                </CommandItem>
                {selected.email && (
                  <CommandItem className={item} onSelect={run(() => app.copyEmail(selected.id))}>
                    <Copy /> Copy email to {selected.name} <Shortcut keys="c" className="ml-auto" />
                  </CommandItem>
                )}
              </>
            )}
            {partners.length > 0 && (
              <>
                <CommandItem className={item} onSelect={run(app.exportCsv)}>
                  <Download /> Export CSV <Shortcut keys="shift+e" className="ml-auto" />
                </CommandItem>
                <CommandItem className={item} onSelect={run(() => app.setGrouped(!app.grouped))}>
                  <Rows3 /> {app.grouped ? "Ungroup partners" : "Group partners by category"}
                  <Shortcut keys="shift+g" className="ml-auto" />
                </CommandItem>
              </>
            )}
            {profile && (
              <CommandItem className={item} onSelect={run(app.reset)}>
                <Trash2 /> Clear everything and start over
              </CommandItem>
            )}
          </CommandGroup>

          <CommandSeparator />
          <CommandGroup heading="Navigation">
            {profile && (
              <>
                <CommandItem className={item} onSelect={run(() => app.setView("profile"))}>
                  <Building2 /> Go to profile <Shortcut keys="g o" className="ml-auto" />
                </CommandItem>
                <CommandItem className={item} onSelect={run(() => app.setView("categories"))}>
                  <Layers /> Go to categories <Shortcut keys="g c" className="ml-auto" />
                </CommandItem>
              </>
            )}
            {partners.length > 0 && (
              <CommandItem
                className={item}
                onSelect={run(() => {
                  app.setCategoryFilter(null);
                  app.setView("partners");
                })}
              >
                <Users /> Go to partners <Shortcut keys="g p" className="ml-auto" />
              </CommandItem>
            )}
            <CommandItem className={item} onSelect={run(() => app.setSidebarOpen(!app.sidebarOpen))}>
              <PanelLeft /> Toggle sidebar <Shortcut keys="[" className="ml-auto" />
            </CommandItem>
            <CommandItem className={item} onSelect={run(() => app.setShortcutsOpen(true))}>
              <Keyboard /> Keyboard shortcuts <Shortcut keys="?" className="ml-auto" />
            </CommandItem>
          </CommandGroup>

          {partners.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Partners">
                {partners.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={`${p.name} ${p.category} ${p.contact_role}`}
                    className={item}
                    onSelect={run(() => {
                      app.setCategoryFilter(null);
                      app.setView("partners");
                      app.openPartner(p.id);
                    })}
                  >
                    <ScoreBars score={p.fit_score} />
                    <span className="text-foreground">{p.name}</span>
                    <span className="ml-auto flex items-center gap-1.5 truncate text-[12px] text-muted-foreground">
                      <LabelDot color={app.categoryColor(p.category)} className="size-1.5" />
                      {p.category}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
