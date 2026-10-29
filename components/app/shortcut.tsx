import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

// Renders "mod+enter" as ⌘ ↵, "g p" as G then P.
const SYMBOLS: Record<string, string> = {
  mod: "⌘",
  shift: "⇧",
  alt: "⌥",
  enter: "↵",
  escape: "Esc",
  backspace: "⌫",
  arrowup: "↑",
  arrowdown: "↓",
};

export function Shortcut({ keys, className }: { keys: string; className?: string }) {
  const steps = keys.split(" ");
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {steps.map((step, i) => (
        <span key={i} className="inline-flex items-center gap-0.5">
          {i > 0 && <span className="px-0.5 text-[11px] text-tertiary-foreground">then</span>}
          {step.split("+").map((k) => (
            <Kbd key={k} className="h-[18px] min-w-[18px] rounded-[4px] border border-border bg-transparent px-1 text-[11px] font-normal text-muted-foreground">
              {SYMBOLS[k.toLowerCase()] ?? k.toUpperCase()}
            </Kbd>
          ))}
        </span>
      ))}
    </span>
  );
}
