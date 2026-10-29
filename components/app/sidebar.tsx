"use client";

import { Building2, ChevronDown, CircleHelp, Layers, Search, SquarePen, Users } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useApp, type View } from "./app-context";
import { LabelDot } from "./icons";
import { Shortcut } from "./shortcut";

function NavItem({
  icon: Icon,
  label,
  count,
  active,
  disabled,
  onClick,
  hotkey,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count?: number;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  hotkey?: string;
}) {
  const button = (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-7 w-full items-center gap-2 rounded-md px-2 text-[13px] text-sidebar-foreground transition-colors",
        "hover:bg-sidebar-accent disabled:pointer-events-none disabled:opacity-40",
        active && "bg-sidebar-accent text-foreground",
      )}
    >
      <Icon className="size-4 text-muted-foreground" />
      <span className="flex-1 truncate text-left">{label}</span>
      {count !== undefined && count > 0 && <span className="text-[12px] text-tertiary-foreground">{count}</span>}
    </button>
  );
  if (!hotkey) return button;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right" className="flex items-center gap-2">
        {label} <Shortcut keys={hotkey} />
      </TooltipContent>
    </Tooltip>
  );
}

export function Sidebar() {
  const app = useApp();
  const { profile, categories, partners, view, setView, categoryColor, categoryFilter } = app;
  const go = (v: View) => {
    setView(v);
    app.setPartnerOpen(false);
    app.setCategoryOpen(false);
  };
  const initials = (profile?.company_name || "Partner Finder")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="flex w-[244px] shrink-0 flex-col gap-4 px-3 py-2.5">
      <div className="flex items-center gap-1">
        <button
          onClick={() => app.setCommandOpen(true)}
          className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 hover:bg-sidebar-accent"
        >
          <span className="grid size-5 shrink-0 place-items-center rounded-[5px] bg-primary text-[10px] font-semibold text-white">
            {initials}
          </span>
          <span className="truncate text-[13px] font-medium text-foreground">
            {profile?.company_name || "Partner Finder"}
          </span>
          <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
        </button>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => app.setCommandOpen(true)}
              className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              aria-label="Search"
            >
              <Search className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="flex items-center gap-2">
            Command menu <Shortcut keys="mod+k" />
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={app.newAnalysis}
              className="grid size-7 place-items-center rounded-md border border-sidebar-border bg-[#141517] text-muted-foreground shadow-sm hover:text-foreground"
              aria-label="New analysis"
            >
              <SquarePen className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="flex items-center gap-2">
            New analysis <Shortcut keys="n" />
          </TooltipContent>
        </Tooltip>
      </div>

      <nav className="flex flex-col gap-px">
        <NavItem icon={Building2} label="Company profile" active={view === "profile"} disabled={!profile} onClick={() => go("profile")} hotkey="g o" />
        <NavItem icon={Layers} label="Categories" count={categories.length} active={view === "categories"} disabled={!profile} onClick={() => go("categories")} hotkey="g c" />
        <NavItem icon={Users} label="Partners" count={partners.length} active={view === "partners" && !categoryFilter} disabled={!partners.length && app.busy !== "partners"} onClick={() => { app.setCategoryFilter(null); go("partners"); }} hotkey="g p" />
      </nav>

      {partners.length > 0 && (
        <div className="flex flex-col gap-px">
          <div className="px-2 pb-1 text-[12px] font-medium text-tertiary-foreground">Categories</div>
          {[...new Set(partners.map((p) => p.category))].map((name) => (
            <button
              key={name}
              onClick={() => {
                app.setCategoryFilter(name);
                go("partners");
              }}
              className={cn(
                "flex h-7 items-center gap-2 rounded-md px-2 text-[13px] text-sidebar-foreground hover:bg-sidebar-accent",
                view === "partners" && categoryFilter === name && "bg-sidebar-accent text-foreground",
              )}
            >
              <span className="grid size-4 place-items-center">
                <LabelDot color={categoryColor(name)} />
              </span>
              <span className="flex-1 truncate text-left">{name}</span>
              <span className="text-[12px] text-tertiary-foreground">
                {partners.filter((p) => p.category === name).length}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-auto">
        <button
          onClick={() => app.setShortcutsOpen(true)}
          className="flex h-7 w-full items-center gap-2 rounded-md px-2 text-[13px] text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
        >
          <CircleHelp className="size-4" />
          <span className="flex-1 text-left">Keyboard shortcuts</span>
          <Shortcut keys="?" />
        </button>
      </div>
    </aside>
  );
}
