"use client";

import { Fragment, useEffect, useState } from "react";
import type { Category, Email, Partner, Profile } from "@/lib/types";

const STORAGE_KEY = "partner-finder-v1";

interface SavedState {
  url: string;
  profile: Profile | null;
  categories: Category[];
  partners: Partner[];
}

async function api<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({ error: `Request failed (${res.status})` }));
  if (!res.ok || data.error) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as T;
}

function csvCell(value: string | number | null | undefined) {
  const s = String(value ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsv(profile: Profile | null, partners: Partner[]) {
  const header = [
    "Company",
    "Category",
    "Fit score",
    "Why they'd care",
    "Contact role",
    "Website",
    "Source URL",
    "Email subject",
    "Email body",
  ];
  const rows = partners.map((p) => [
    p.name,
    p.category,
    p.fit_score,
    p.why,
    p.contact_role,
    p.website,
    p.source_url,
    p.email?.subject,
    p.email?.body,
  ]);
  const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `partners-${profile?.domain || "export"}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function scoreClass(score: number) {
  return score >= 8 ? "high" : score >= 6 ? "mid" : "low";
}

function Status({ text }: { text: string }) {
  return (
    <div className="status">
      <span className="spinner" /> {text}
    </div>
  );
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "profile" | "categories" | "partners">(null);
  const [emailBusy, setEmailBusy] = useState<string | null>(null);
  const [error, setError] = useState<{ step: string; message: string } | null>(null);
  const [searchNote, setSearchNote] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Restore the last session from this browser.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as SavedState;
        setUrl(s.url ?? "");
        setProfile(s.profile ?? null);
        setCategories(s.categories ?? []);
        setPartners(s.partners ?? []);
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      const s: SavedState = { url, profile, categories, partners };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {}
  }, [loaded, url, profile, categories, partners]);

  async function run<T>(step: NonNullable<typeof busy>, fn: () => Promise<T>) {
    setBusy(step);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError({ step, message: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(null);
    }
  }

  function analyze(e: React.FormEvent) {
    e.preventDefault();
    run("profile", async () => {
      const { profile } = await api<{ profile: Profile }>("/api/profile", { url });
      setProfile(profile);
      setCategories([]);
      setPartners([]);
      setOpenId(null);
    });
  }

  function findCategories() {
    if (!profile) return;
    run("categories", async () => {
      const { categories } = await api<{ categories: Category[] }>("/api/categories", { profile });
      setCategories(categories);
      setPartners([]);
      setOpenId(null);
    });
  }

  function findPartners() {
    if (!profile) return;
    const cats = categories.filter((c) => c.name.trim() && c.queries.some((q) => q.trim()));
    run("partners", async () => {
      const res = await api<{ partners: Partner[]; candidateCount: number; dropped: number }>(
        "/api/partners",
        { profile, categories: cats },
      );
      setPartners(res.partners);
      setOpenId(null);
      setSearchNote(
        `Picked from ${res.candidateCount} search results.` +
          (res.dropped ? ` ${res.dropped} picks dropped because they weren't in the cited result.` : ""),
      );
    });
  }

  async function generateEmail(partner: Partner) {
    if (!profile) return;
    setEmailBusy(partner.id);
    setError(null);
    try {
      const { email } = await api<{ email: Email }>("/api/email", { profile, partner });
      setPartners((ps) => ps.map((p) => (p.id === partner.id ? { ...p, email } : p)));
    } catch (e) {
      setError({ step: "email", message: e instanceof Error ? e.message : String(e) });
    } finally {
      setEmailBusy(null);
    }
  }

  function toggleRow(p: Partner) {
    const next = openId === p.id ? null : p.id;
    setOpenId(next);
    if (next && !p.email && emailBusy !== p.id) generateEmail(p);
  }

  function updateProfile<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => (p ? { ...p, [key]: value } : p));
  }

  function updateCategory(i: number, patch: Partial<Category>) {
    setCategories((cs) => cs.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  }

  function updateEmail(id: string, patch: Partial<Email>) {
    setPartners((ps) =>
      ps.map((p) => (p.id === id && p.email ? { ...p, email: { ...p.email, ...patch } } : p)),
    );
  }

  function reset() {
    setUrl("");
    setProfile(null);
    setCategories([]);
    setPartners([]);
    setOpenId(null);
    setError(null);
  }

  const errorFor = (step: string) =>
    error?.step === step ? <div className="error">{error.message}</div> : null;

  return (
    <main>
      <h1>Partner Finder</h1>
      <p className="sub">
        Paste a startup&apos;s URL. Get real partner companies, ranked, with an outreach draft for each.
      </p>

      <section>
        <form className="row" onSubmit={analyze}>
          <input
            placeholder="Company URL, e.g. gini.health"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            autoFocus
          />
          <button className="primary" type="submit" disabled={!url.trim() || busy !== null}>
            Analyze
          </button>
          {profile && (
            <button type="button" onClick={reset} disabled={busy !== null}>
              Start over
            </button>
          )}
        </form>
        {busy === "profile" && <Status text="Reading the site and writing a profile…" />}
        {errorFor("profile")}
      </section>

      {profile && (
        <section>
          <div className="section-head">
            <h2>
              <span className="step">1</span>Company profile
            </h2>
            <span className="meta">Edit anything that&apos;s off. Every later step uses this.</span>
          </div>
          <div className="grid2">
            <div>
              <label>Company</label>
              <input
                value={profile.company_name}
                onChange={(e) => updateProfile("company_name", e.target.value)}
              />
            </div>
            <div>
              <label>Geography</label>
              <input
                value={profile.geography}
                onChange={(e) => updateProfile("geography", e.target.value)}
              />
            </div>
          </div>
          <label>One-liner</label>
          <input
            value={profile.one_liner}
            onChange={(e) => updateProfile("one_liner", e.target.value)}
          />
          <div className="grid2">
            <div>
              <label>What they sell</label>
              <textarea
                value={profile.product}
                onChange={(e) => updateProfile("product", e.target.value)}
              />
            </div>
            <div>
              <label>Who buys it</label>
              <textarea
                value={profile.customers}
                onChange={(e) => updateProfile("customers", e.target.value)}
              />
            </div>
            <div>
              <label>Value proposition</label>
              <textarea
                value={profile.value_prop}
                onChange={(e) => updateProfile("value_prop", e.target.value)}
              />
            </div>
            <div>
              <label>What they lack (one per line)</label>
              <textarea
                value={profile.gaps.join("\n")}
                onChange={(e) => updateProfile("gaps", e.target.value.split("\n"))}
              />
            </div>
          </div>
          <div className="row" style={{ marginTop: 16 }}>
            <button className="primary" onClick={findCategories} disabled={busy !== null}>
              {categories.length ? "Regenerate partner categories" : "Suggest partner categories"}
            </button>
          </div>
          {busy === "categories" && <Status text="Working out who already has their customers…" />}
          {errorFor("categories")}
        </section>
      )}

      {profile && categories.length > 0 && (
        <section>
          <div className="section-head">
            <h2>
              <span className="step">2</span>Partner categories
            </h2>
            <span className="meta">Remove, rename or tweak the search queries before searching.</span>
          </div>
          <div className="categories">
            {categories.map((c, i) => (
              <div className="cat" key={i}>
                <div className="row" style={{ alignItems: "center", flexDirection: "row" }}>
                  <input
                    className="cat-name"
                    value={c.name}
                    onChange={(e) => updateCategory(i, { name: e.target.value })}
                  />
                  <button
                    className="link"
                    title="Remove category"
                    onClick={() => setCategories((cs) => cs.filter((_, j) => j !== i))}
                  >
                    ✕
                  </button>
                </div>
                {c.rationale && <p>{c.rationale}</p>}
                <label>Contact</label>
                <input
                  value={c.contact_role}
                  onChange={(e) => updateCategory(i, { contact_role: e.target.value })}
                />
                <label>Search queries (one per line)</label>
                <textarea
                  value={c.queries.join("\n")}
                  onChange={(e) => updateCategory(i, { queries: e.target.value.split("\n") })}
                />
              </div>
            ))}
          </div>
          <div className="row" style={{ marginTop: 16 }}>
            <button className="primary" onClick={findPartners} disabled={busy !== null}>
              {partners.length ? "Search again" : "Find partners"}
            </button>
            <button
              onClick={() =>
                setCategories((cs) => [
                  ...cs,
                  { name: "New category", rationale: "", contact_role: "Head of Partnerships", queries: [""] },
                ])
              }
              disabled={busy !== null}
            >
              Add category
            </button>
          </div>
          {busy === "partners" && (
            <Status text="Searching the web, then filtering and scoring real companies. Takes 30–90 seconds…" />
          )}
          {errorFor("partners")}
        </section>
      )}

      {partners.length > 0 && (
        <section>
          <div className="section-head">
            <h2>
              <span className="step">3</span>
              {partners.length} potential partners
            </h2>
            <div className="row" style={{ alignItems: "center", flexDirection: "row" }}>
              <span className="meta">Click a row for an outreach draft.</span>
              <button onClick={() => downloadCsv(profile, partners)}>Export CSV</button>
            </div>
          </div>
          {searchNote && <p className="meta" style={{ marginTop: -6 }}>{searchNote}</p>}
          {errorFor("email")}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fit</th>
                  <th>Company</th>
                  <th>Category</th>
                  <th>Why they&apos;d care</th>
                  <th>Contact</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((p) => (
                  <Fragment key={p.id}>
                    <tr
                      className={`partner ${openId === p.id ? "open" : ""}`}
                      onClick={() => toggleRow(p)}
                    >
                      <td className={`score ${scoreClass(p.fit_score)}`}>{p.fit_score}/10</td>
                      <td className="company">
                        {p.name}
                        <a
                          href={p.website ?? p.source_url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title={p.source_title}
                        >
                          {p.website ? p.website.replace(/^https:\/\//, "") : "source ↗"}
                        </a>
                      </td>
                      <td>
                        <span className="pill">{p.category}</span>
                      </td>
                      <td>{p.why}</td>
                      <td>{p.contact_role}</td>
                    </tr>
                    {openId === p.id && (
                      <tr>
                        <td colSpan={5} className="email-cell">
                          <div className="email">
                            <p className="evidence">
                              Found in:{" "}
                              <a className="src" style={{ display: "inline" }} href={p.source_url} target="_blank" rel="noreferrer">
                                {p.source_title || p.source_url}
                              </a>
                            </p>
                            {emailBusy === p.id && <Status text="Drafting email…" />}
                            {p.email && emailBusy !== p.id && (
                              <>
                                <label>Subject</label>
                                <input
                                  value={p.email.subject}
                                  onChange={(e) => updateEmail(p.id, { subject: e.target.value })}
                                />
                                <label>Body</label>
                                <textarea
                                  value={p.email.body}
                                  onChange={(e) => updateEmail(p.id, { body: e.target.value })}
                                />
                                <div className="actions">
                                  <button onClick={() => generateEmail(p)}>Regenerate</button>
                                  <button
                                    className="primary"
                                    onClick={() =>
                                      navigator.clipboard.writeText(
                                        `Subject: ${p.email!.subject}\n\n${p.email!.body}`,
                                      )
                                    }
                                  >
                                    Copy
                                  </button>
                                </div>
                              </>
                            )}
                            {!p.email && emailBusy !== p.id && (
                              <button onClick={() => generateEmail(p)}>Draft email</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
