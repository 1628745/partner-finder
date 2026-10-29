"use client";

import { Globe, MapPin, Plus, Sparkles, X } from "lucide-react";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useApp } from "./app-context";
import { Header, HeaderButton } from "./header";

const SECTIONS: { key: keyof Profile; label: string }[] = [
  { key: "product", label: "What they sell" },
  { key: "customers", label: "Who buys it" },
  { key: "value_prop", label: "Value proposition" },
];

function Field({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={1}
      className={cn(
        "field-sizing-content -mx-2 w-full resize-none rounded-md bg-transparent px-2 py-1 outline-none hover:bg-[#141517] focus:bg-[#141517]",
        className,
      )}
    />
  );
}

export function ProfileView() {
  const { profile, updateProfile, suggestCategories, categories, busy } = useApp();
  if (!profile) return null;

  return (
    <>
      <Header crumbs={[profile.company_name, "Profile"]}>
        <HeaderButton
          primary
          onClick={suggestCategories}
          disabled={busy !== null}
          hotkey="mod+enter"
          tooltip={categories.length ? "Regenerate categories" : "Suggest partner categories"}
        >
          <Sparkles />
          {categories.length ? "Regenerate categories" : "Suggest categories"}
        </HeaderButton>
      </Header>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[760px] px-10 pt-12 pb-24">
          <input
            value={profile.company_name}
            onChange={(e) => updateProfile("company_name", e.target.value)}
            className="w-full bg-transparent text-[26px] font-semibold tracking-[-0.02em] text-foreground outline-none"
          />
          <Field
            value={profile.one_liner}
            onChange={(v) => updateProfile("one_liner", v)}
            className="mt-1 text-[15px] leading-relaxed text-muted-foreground"
          />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <a
              href={`https://${profile.domain}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-6 items-center gap-1.5 rounded-full border border-border px-2 text-[12px] text-muted-foreground hover:text-foreground"
            >
              <Globe className="size-3" />
              {profile.domain}
            </a>
            <label className="inline-flex h-6 items-center gap-1.5 rounded-full border border-border pr-1 pl-2 text-[12px] text-muted-foreground">
              <MapPin className="size-3 shrink-0" />
              <input
                value={profile.geography}
                onChange={(e) => updateProfile("geography", e.target.value)}
                size={Math.min(Math.max(profile.geography.length, 6), 48)}
                className="bg-transparent outline-none"
              />
            </label>
          </div>

          <div className="my-8 h-px bg-border" />

          <div className="flex flex-col gap-7">
            {SECTIONS.map(({ key, label }) => (
              <section key={key}>
                <h3 className="mb-1.5 text-[12px] font-medium text-muted-foreground">{label}</h3>
                <Field
                  value={profile[key] as string}
                  onChange={(v) => updateProfile(key, v)}
                  className="text-[14px] leading-[1.6] text-[#d0d6e0]"
                />
              </section>
            ))}

            <section>
              <h3 className="mb-1.5 text-[12px] font-medium text-muted-foreground">What they lack</h3>
              <ul className="flex flex-col">
                {profile.gaps.map((gap, i) => (
                  <li key={i} className="group flex items-start gap-2">
                    <span className="mt-[11px] size-1 shrink-0 rounded-full bg-tertiary-foreground" />
                    <Field
                      value={gap}
                      onChange={(v) => updateProfile("gaps", profile.gaps.map((g, j) => (j === i ? v : g)))}
                      className="mx-0 text-[14px] leading-[1.6] text-[#d0d6e0]"
                    />
                    <button
                      onClick={() => updateProfile("gaps", profile.gaps.filter((_, j) => j !== i))}
                      className="mt-1.5 grid size-5 shrink-0 place-items-center rounded text-tertiary-foreground opacity-0 group-hover:opacity-100 hover:text-foreground"
                      aria-label="Remove gap"
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => updateProfile("gaps", [...profile.gaps, ""])}
                className="mt-1 inline-flex h-7 items-center gap-1.5 rounded-md px-1.5 text-[13px] text-tertiary-foreground hover:text-muted-foreground"
              >
                <Plus className="size-3.5" /> Add gap
              </button>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
