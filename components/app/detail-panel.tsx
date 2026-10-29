"use client";

import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Shortcut } from "./shortcut";

function IconButton({
  label,
  hotkey,
  onClick,
  children,
}: {
  label: string;
  hotkey?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          aria-label={label}
          className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground [&_svg]:size-4"
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent className="flex items-center gap-2">
        {label} {hotkey && <Shortcut keys={hotkey} />}
      </TooltipContent>
    </Tooltip>
  );
}

// Right-hand panel for the selected row, like an issue peek.
export function DetailPanel({
  title,
  onClose,
  onPrev,
  onNext,
  children,
}: {
  title: React.ReactNode;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  children: React.ReactNode;
}) {
  return (
    <aside className="flex w-[460px] shrink-0 flex-col border-l border-border bg-background animate-in slide-in-from-right-4 fade-in-0 duration-150">
      <div className="flex h-11 shrink-0 items-center gap-1 border-b border-border pr-2 pl-5">
        <div className="min-w-0 flex-1 truncate text-[12px] text-muted-foreground">{title}</div>
        <IconButton label="Previous" hotkey="k" onClick={onPrev}>
          <ChevronUp />
        </IconButton>
        <IconButton label="Next" hotkey="j" onClick={onNext}>
          <ChevronDown />
        </IconButton>
        <IconButton label="Close" hotkey="escape" onClick={onClose}>
          <X />
        </IconButton>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </aside>
  );
}

export function Property({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-8 items-center gap-3 text-[13px]">
      <div className="w-[88px] shrink-0 text-muted-foreground">{label}</div>
      <div className="min-w-0 flex-1 text-[#d0d6e0]">{children}</div>
    </div>
  );
}
