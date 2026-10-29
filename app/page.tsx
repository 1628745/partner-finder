"use client";

import { AppProvider, useApp } from "@/components/app/app-context";
import { CategoriesView } from "@/components/app/categories-view";
import { CommandMenu } from "@/components/app/command-menu";
import { PartnersView } from "@/components/app/partners-view";
import { ProfileView } from "@/components/app/profile-view";
import { ShortcutsDialog } from "@/components/app/shortcuts-dialog";
import { Sidebar } from "@/components/app/sidebar";
import { StartView } from "@/components/app/start-view";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { cn } from "@/lib/utils";

function useAppHotkeys() {
  const app = useApp();
  const { view, profile, partners, categories } = app;
  const dialogOpen = app.commandOpen || app.shortcutsOpen;
  const inList = view === "partners" || view === "categories";
  const selected = partners.find((p) => p.id === app.selectedPartner);

  function move(delta: number) {
    if (view === "partners") {
      const list = app.visiblePartners;
      if (!list.length) return;
      const i = list.findIndex((p) => p.id === app.selectedPartner);
      const next = list[i < 0 ? 0 : Math.max(0, Math.min(list.length - 1, i + delta))];
      app.setSelectedPartner(next.id);
    } else if (view === "categories") {
      app.setSelectedCategory((i) => Math.max(0, Math.min(categories.length - 1, i + delta)));
    }
  }

  function openSelected() {
    if (view === "partners" && selected) app.openPartner(selected.id);
    if (view === "categories" && categories.length) app.setCategoryOpen(true);
  }

  function go(v: "profile" | "categories" | "partners") {
    if (!profile || (v === "partners" && !partners.length)) return;
    if (v === "partners") app.setCategoryFilter(null);
    app.setView(v);
  }

  useHotkeys([
    { keys: "mod+k", allowInInput: true, handler: () => app.setCommandOpen(!app.commandOpen) },
    { keys: ["?", "shift+/"], enabled: !dialogOpen, handler: () => app.setShortcutsOpen(true) },
    { keys: "n", enabled: !dialogOpen, handler: app.newAnalysis },
    { keys: "[", enabled: !dialogOpen, handler: () => app.setSidebarOpen(!app.sidebarOpen) },
    {
      keys: "mod+enter",
      allowInInput: true,
      enabled: !dialogOpen,
      handler: () => {
        if (view === "start") app.analyze();
        else if (view === "profile") app.suggestCategories();
        else if (view === "categories") app.findPartners();
        else openSelected();
      },
    },
    { keys: "g o", enabled: !dialogOpen, handler: () => go("profile") },
    { keys: "g c", enabled: !dialogOpen, handler: () => go("categories") },
    { keys: "g p", enabled: !dialogOpen, handler: () => go("partners") },
    { keys: ["j", "arrowdown"], enabled: !dialogOpen && inList, handler: () => move(1) },
    { keys: ["k", "arrowup"], enabled: !dialogOpen && inList, handler: () => move(-1) },
    { keys: ["enter", "o", "space"], enabled: !dialogOpen && inList, handler: openSelected },
    {
      keys: "escape",
      allowInInput: true,
      enabled: !dialogOpen,
      handler: (e) => {
        const el = e.target as HTMLElement;
        if (view === "start" && profile) app.setView("profile");
        else if (["INPUT", "TEXTAREA"].includes(el.tagName)) el.blur();
        else if (app.partnerOpen) app.setPartnerOpen(false);
        else if (app.categoryOpen) app.setCategoryOpen(false);
        else if (view === "partners" && app.categoryFilter) app.setCategoryFilter(null);
      },
    },
    // Partners
    {
      keys: "e",
      enabled: !dialogOpen && view === "partners" && !!selected,
      handler: () => {
        app.openPartner(selected!.id);
        if (selected!.email) app.draftEmail(selected!.id);
      },
    },
    {
      keys: "r",
      enabled: !dialogOpen && view === "partners" && !!selected?.email,
      handler: () => app.draftEmail(selected!.id),
    },
    {
      keys: "c",
      enabled: !dialogOpen && view === "partners" && !!selected,
      handler: () => app.copyEmail(selected!.id),
    },
    { keys: "shift+e", enabled: !dialogOpen && partners.length > 0, handler: app.exportCsv },
    { keys: "shift+g", enabled: !dialogOpen && view === "partners", handler: () => app.setGrouped(!app.grouped) },
    // Categories
    { keys: "c", enabled: !dialogOpen && view === "categories", handler: app.addCategory },
    {
      keys: "mod+backspace",
      enabled: !dialogOpen && view === "categories" && categories.length > 0,
      handler: () => app.removeCategory(app.selectedCategory),
    },
  ]);
}

function Shell() {
  const app = useApp();
  useAppHotkeys();

  return (
    <div className="flex h-screen overflow-hidden bg-sidebar">
      {app.sidebarOpen && <Sidebar />}
      <main
        className={cn(
          "my-2 mr-2 flex min-w-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-border bg-background shadow-[0_2px_8px_rgba(0,0,0,0.35)]",
          !app.sidebarOpen && "ml-2",
        )}
      >
        {app.view === "start" && <StartView />}
        {app.view === "profile" && <ProfileView />}
        {app.view === "categories" && <CategoriesView />}
        {app.view === "partners" && <PartnersView />}
      </main>
      <CommandMenu />
      <ShortcutsDialog />
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
