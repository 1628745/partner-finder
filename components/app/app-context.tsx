"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api, downloadCsv } from "@/lib/client";
import type { Category, Email, Partner, Profile } from "@/lib/types";

const STORAGE_KEY = "partner-finder-v1";

export type View = "start" | "profile" | "categories" | "partners";
export type Busy = null | "profile" | "categories" | "partners";

export const LABEL_COLORS = [
  "#5e6ad2",
  "#26b5ce",
  "#4cb782",
  "#f2c94c",
  "#f2994a",
  "#eb5757",
  "#bb87fc",
  "#95a2b3",
];

interface Saved {
  url: string;
  profile: Profile | null;
  categories: Category[];
  partners: Partner[];
  view: View;
}

function useAppState() {
  const [url, setUrl] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [view, setView] = useState<View>("start");
  const [busy, setBusy] = useState<Busy>(null);
  const [busySince, setBusySince] = useState(0);
  const [drafting, setDrafting] = useState<Record<string, boolean>>({});
  const [searchNote, setSearchNote] = useState("");

  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [grouped, setGrouped] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [commandOpen, setCommandOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Restore the last session from this browser.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as Partial<Saved>;
        setUrl(s.url ?? "");
        setProfile(s.profile ?? null);
        setCategories(s.categories ?? []);
        setPartners(s.partners ?? []);
        setView(s.profile ? (s.view ?? "profile") : "start");
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      const s: Saved = { url, profile, categories, partners, view };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {}
  }, [loaded, url, profile, categories, partners, view]);

  const categoryColor = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c, i) => map.set(c.name, LABEL_COLORS[i % LABEL_COLORS.length]));
    partners.forEach((p) => {
      if (!map.has(p.category)) map.set(p.category, LABEL_COLORS[map.size % LABEL_COLORS.length]);
    });
    return (name: string) => map.get(name) ?? LABEL_COLORS[7];
  }, [categories, partners]);

  // Partners in the order the list shows them.
  const visiblePartners = useMemo(() => {
    const list = categoryFilter ? partners.filter((p) => p.category === categoryFilter) : partners;
    if (!grouped) return list;
    const order = [...new Set(list.map((p) => p.category))];
    return [...list].sort(
      (a, b) => order.indexOf(a.category) - order.indexOf(b.category) || b.fit_score - a.fit_score,
    );
  }, [partners, categoryFilter, grouped]);

  const issuePrefix = (profile?.company_name || "PAR").replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase() || "PAR";

  async function run(step: NonNullable<Busy>, fn: () => Promise<void>) {
    setBusy(step);
    setBusySince(Date.now());
    try {
      await fn();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  function analyze() {
    if (!url.trim() || busy) return;
    run("profile", async () => {
      const res = await api<{ profile: Profile }>("/api/profile", { url });
      setProfile(res.profile);
      setCategories([]);
      setPartners([]);
      setSelectedPartner(null);
      setPartnerOpen(false);
      setCategoryFilter(null);
      setView("profile");
    });
  }

  function suggestCategories() {
    if (!profile || busy) return;
    setView("categories");
    run("categories", async () => {
      const res = await api<{ categories: Category[] }>("/api/categories", { profile });
      setCategories(res.categories);
      setSelectedCategory(0);
      setCategoryOpen(false);
    });
  }

  function findPartners() {
    if (!profile || busy) return;
    const cats = categories.filter((c) => c.name.trim() && c.queries.some((q) => q.trim()));
    if (!cats.length) {
      toast.error("Add at least one category with a search query.");
      return;
    }
    setView("partners");
    setPartnerOpen(false);
    run("partners", async () => {
      const res = await api<{ partners: Partner[]; candidateCount: number; dropped: number }>(
        "/api/partners",
        { profile, categories: cats },
      );
      setPartners(res.partners);
      setCategoryFilter(null);
      setSelectedPartner(res.partners[0]?.id ?? null);
      setSearchNote(
        `${res.partners.length} partners from ${res.candidateCount} search results` +
          (res.dropped ? ` · ${res.dropped} unverified picks dropped` : ""),
      );
    });
  }

  async function draftEmail(id: string) {
    const partner = partners.find((p) => p.id === id);
    if (!profile || !partner || drafting[id]) return;
    setDrafting((d) => ({ ...d, [id]: true }));
    try {
      const { email } = await api<{ email: Email }>("/api/email", { profile, partner });
      setPartners((ps) => ps.map((p) => (p.id === id ? { ...p, email } : p)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setDrafting((d) => ({ ...d, [id]: false }));
    }
  }

  function openPartner(id: string) {
    setSelectedPartner(id);
    setPartnerOpen(true);
    const p = partners.find((x) => x.id === id);
    if (p && !p.email) draftEmail(id);
  }

  async function copyEmail(id: string) {
    const p = partners.find((x) => x.id === id);
    if (!p?.email) {
      toast("No draft yet. Press E to draft one.");
      return;
    }
    try {
      await navigator.clipboard.writeText(`Subject: ${p.email.subject}\n\n${p.email.body}`);
      toast.success(`Copied email to ${p.name}`);
    } catch {
      toast.error("Couldn't access the clipboard.");
    }
  }

  function exportCsv() {
    if (!partners.length) {
      toast("Nothing to export yet.");
      return;
    }
    downloadCsv(profile, partners);
    toast.success(`Exported ${partners.length} partners`);
  }

  function updateProfile<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => (p ? { ...p, [key]: value } : p));
  }

  function updateCategory(i: number, patch: Partial<Category>) {
    setCategories((cs) => cs.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  }

  function addCategory() {
    setCategories((cs) => [
      ...cs,
      { name: "New category", rationale: "", contact_role: "Head of Partnerships", queries: [""] },
    ]);
    setSelectedCategory(categories.length);
    setCategoryOpen(true);
    setView("categories");
  }

  function removeCategory(i: number) {
    const name = categories[i]?.name;
    setCategories((cs) => cs.filter((_, j) => j !== i));
    setSelectedCategory((s) => Math.max(0, Math.min(s, categories.length - 2)));
    setCategoryOpen(false);
    if (name) toast(`Removed "${name}"`);
  }

  function updateEmail(id: string, patch: Partial<Email>) {
    setPartners((ps) =>
      ps.map((p) => (p.id === id && p.email ? { ...p, email: { ...p.email, ...patch } } : p)),
    );
  }

  function newAnalysis() {
    setView("start");
    setPartnerOpen(false);
    setCategoryOpen(false);
  }

  function reset() {
    setUrl("");
    setProfile(null);
    setCategories([]);
    setPartners([]);
    setSelectedPartner(null);
    setPartnerOpen(false);
    setCategoryFilter(null);
    setView("start");
  }

  return {
    url, setUrl, profile, categories, partners, visiblePartners, view, setView, busy, busySince,
    drafting, searchNote, selectedPartner, setSelectedPartner, partnerOpen, setPartnerOpen,
    selectedCategory, setSelectedCategory, categoryOpen, setCategoryOpen, categoryFilter,
    setCategoryFilter, grouped, setGrouped, sidebarOpen, setSidebarOpen, commandOpen, setCommandOpen,
    shortcutsOpen, setShortcutsOpen, categoryColor, issuePrefix, analyze, suggestCategories,
    findPartners, draftEmail, openPartner, copyEmail, exportCsv, updateProfile, updateCategory,
    addCategory, removeCategory, updateEmail, newAnalysis, reset,
  };
}

type AppState = ReturnType<typeof useAppState>;
const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const state = useAppState();
  return <AppContext.Provider value={state}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
