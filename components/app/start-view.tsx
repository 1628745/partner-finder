"use client";

import { ArrowRight, Globe, Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { useApp } from "./app-context";
import { Header } from "./header";
import { Shortcut } from "./shortcut";

export function StartView() {
  const { url, setUrl, analyze, busy, profile } = useApp();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
  }, []);

  return (
    <>
      <Header crumbs={["New analysis"]} />
      <div className="flex flex-1 items-start justify-center overflow-y-auto px-6 pt-[18vh]">
        <div className="w-full max-w-[560px]">
          <h1 className="text-[22px] font-semibold tracking-[-0.015em] text-foreground">Find partners for a startup</h1>
          <p className="mt-1.5 text-[14px] text-muted-foreground">
            Paste a company&apos;s website. You&apos;ll get a profile, partner categories, and a ranked list of
            real companies with outreach drafts.
          </p>
          <form
            className="mt-6 flex h-11 items-center gap-2 rounded-lg border border-border bg-card pr-1.5 pl-3 shadow-[0_1px_2px_rgba(0,0,0,0.3)] focus-within:border-[#3b3e45]"
            onSubmit={(e) => {
              e.preventDefault();
              analyze();
            }}
          >
            <Globe className="size-4 shrink-0 text-muted-foreground" />
            <input
              ref={input}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="gini.health"
              disabled={busy === "profile"}
              className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-foreground outline-none placeholder:text-tertiary-foreground"
            />
            <button
              type="submit"
              disabled={!url.trim() || busy !== null}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground hover:bg-[#6b77e0] disabled:opacity-50"
            >
              {busy === "profile" ? <Loader2 className="size-3.5 animate-spin" /> : <ArrowRight className="size-3.5" />}
              Analyze
            </button>
          </form>
          {busy === "profile" ? (
            <p className="mt-3 text-[12px] text-muted-foreground">Reading the site and writing a profile…</p>
          ) : (
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-tertiary-foreground">
              <span className="flex items-center gap-1.5">
                <Shortcut keys="enter" /> analyze
              </span>
              <span className="flex items-center gap-1.5">
                <Shortcut keys="mod+k" /> command menu
              </span>
              <span className="flex items-center gap-1.5">
                <Shortcut keys="?" /> shortcuts
              </span>
              {profile && (
                <span className="flex items-center gap-1.5">
                  <Shortcut keys="escape" /> back to {profile.company_name}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
