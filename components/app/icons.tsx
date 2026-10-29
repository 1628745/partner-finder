import { cn } from "@/lib/utils";

// Three bars, filled by fit score, in the style of a priority icon.
export function ScoreBars({ score, className }: { score: number; className?: string }) {
  const filled = score >= 8 ? 3 : score >= 6 ? 2 : 1;
  return (
    <svg viewBox="0 0 16 16" className={cn("size-4 shrink-0", className)} aria-hidden>
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={1.5 + i * 5}
          y={10 - i * 3.5}
          width={3}
          height={4.5 + i * 3.5}
          rx={1}
          className={i < filled ? "fill-[#d0d6e0]" : "fill-[#3a3d44]"}
        />
      ))}
    </svg>
  );
}

// Outreach state, drawn like a status icon: none, drafting, drafted.
export function DraftStatus({ state, className }: { state: "none" | "drafting" | "done"; className?: string }) {
  if (state === "done") {
    return (
      <svg viewBox="0 0 14 14" className={cn("size-3.5 shrink-0", className)} aria-hidden>
        <circle cx="7" cy="7" r="6" fill="#5e6ad2" stroke="#5e6ad2" strokeWidth="1.5" />
        <path d="M4.3 7.2 6.2 9l3.5-3.8" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (state === "drafting") {
    return (
      <svg viewBox="0 0 14 14" className={cn("size-3.5 shrink-0 animate-spin [animation-duration:2s]", className)} aria-hidden>
        <circle cx="7" cy="7" r="6" fill="none" stroke="#f2c94c" strokeWidth="1.5" />
        <path d="M7 3.5a3.5 3.5 0 0 1 0 7z" fill="#f2c94c" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 14 14" className={cn("size-3.5 shrink-0", className)} aria-hidden>
      <circle cx="7" cy="7" r="6" fill="none" stroke="#62666d" strokeWidth="1.5" strokeDasharray="1.4 1.85" />
    </svg>
  );
}

export function LabelDot({ color, className }: { color: string; className?: string }) {
  return <span className={cn("inline-block size-2 shrink-0 rounded-full", className)} style={{ background: color }} />;
}

export function Label({ name, color }: { name: string; color: string }) {
  return (
    <span className="inline-flex items-start gap-1.5 rounded-xl border border-border px-2 py-[3px] text-[12px] leading-4 text-muted-foreground">
      <LabelDot color={color} className="mt-1" />
      <span>{name}</span>
    </span>
  );
}
