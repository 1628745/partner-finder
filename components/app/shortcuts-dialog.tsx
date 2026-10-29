"use client";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useApp } from "./app-context";
import { Shortcut } from "./shortcut";

const GROUPS: { title: string; items: [string, string][] }[] = [
  {
    title: "General",
    items: [
      ["Open command menu", "mod+k"],
      ["Show keyboard shortcuts", "?"],
      ["New analysis", "n"],
      ["Run the next step", "mod+enter"],
      ["Toggle sidebar", "["],
    ],
  },
  {
    title: "Navigation",
    items: [
      ["Go to profile", "g o"],
      ["Go to categories", "g c"],
      ["Go to partners", "g p"],
    ],
  },
  {
    title: "Lists",
    items: [
      ["Move down", "j"],
      ["Move up", "k"],
      ["Open selected", "enter"],
      ["Close panel", "escape"],
    ],
  },
  {
    title: "Partners",
    items: [
      ["Draft email", "e"],
      ["Regenerate email", "r"],
      ["Copy email", "c"],
      ["Group by category", "shift+g"],
      ["Export CSV", "shift+e"],
    ],
  },
  {
    title: "Categories",
    items: [
      ["New category", "c"],
      ["Delete category", "mod+backspace"],
    ],
  },
];

export function ShortcutsDialog() {
  const { shortcutsOpen, setShortcutsOpen } = useApp();
  return (
    <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
      <DialogContent className="max-w-[440px]! gap-0 border border-border bg-popover p-0">
        <div className="border-b border-border px-5 py-4">
          <DialogTitle className="text-[14px] font-medium">Keyboard shortcuts</DialogTitle>
          <DialogDescription className="sr-only">Every keyboard shortcut in Partner Finder</DialogDescription>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-3">
          {GROUPS.map((g) => (
            <div key={g.title} className="py-2">
              <h4 className="mb-1 text-[12px] font-medium text-tertiary-foreground">{g.title}</h4>
              {g.items.map(([label, keys]) => (
                <div key={label} className="flex h-8 items-center justify-between text-[13px] text-[#d0d6e0]">
                  {label}
                  <Shortcut keys={keys} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
