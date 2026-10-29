import { ChevronRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Shortcut } from "./shortcut";

export function Header({
  crumbs,
  children,
  className,
}: {
  crumbs: React.ReactNode[];
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex h-11 shrink-0 items-center gap-2 border-b border-border pr-3 pl-5", className)}>
      <div className="flex min-w-0 flex-1 items-center gap-1.5 text-[13px]">
        {crumbs.map((c, i) => (
          <span key={i} className="flex min-w-0 items-center gap-1.5">
            {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-tertiary-foreground" />}
            <span className={cn("truncate", i === crumbs.length - 1 ? "text-foreground" : "text-muted-foreground")}>
              {c}
            </span>
          </span>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">{children}</div>
    </header>
  );
}

// Small Linear-style header button with an optional shortcut tooltip.
export function HeaderButton({
  children,
  onClick,
  hotkey,
  tooltip,
  primary,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  hotkey?: string;
  tooltip?: string;
  primary?: boolean;
  disabled?: boolean;
}) {
  const button = (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-3.5",
        primary
          ? "bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] hover:bg-[#6b77e0]"
          : "border border-border bg-[#17181a] text-[#d0d6e0] hover:bg-[#1e1f22] hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
  if (!hotkey && !tooltip) return button;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent className="flex items-center gap-2">
        {tooltip}
        {hotkey && <Shortcut keys={hotkey} />}
      </TooltipContent>
    </Tooltip>
  );
}
