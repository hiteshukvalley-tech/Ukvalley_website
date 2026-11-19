"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, CornerDownRight, FileText, Inbox, Layers, Loader2, Mail, Search, UserRound, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchAllTextAction, type SearchResult } from "@/app/admin/(panel)/texts/search-actions";
import { searchRecordsAction } from "@/app/admin/(panel)/search-actions";
import type { RecordResult } from "@/lib/panel-search";
import type { Access } from "@/lib/admin-access";
import type { AdminRole } from "@/lib/admin-auth";
import { navTargets } from "./nav";

type Row =
  | { type: "nav"; key: string; href: string; section: string; title: string; sub: string; icon?: LucideIcon }
  | { type: "record"; key: string; href: string; section: string; area: string; title: string; sub: string; before: string; match: string; after: string }
  | { type: "page"; key: string; href: string; section: string; title: string; sub: string }
  | { type: "hit"; key: string; href: string; section: string; title: string; sub: string; before: string; match: string; after: string };

const textHref = (slug: string, path: string, q: string) => `/admin/texts/${slug}?path=${encodeURIComponent(path)}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

const ICONS: Record<string, LucideIcon> = { applications: UserRound, leads: Inbox, careers: Briefcase, users: UserRound };
const iconFor = (r: Row): LucideIcon =>
  r.type === "nav" ? r.icon ?? CornerDownRight : r.type === "record" ? (r.section === "Email logs" ? Mail : ICONS[r.area] ?? Layers) : FileText;

/** Panel sections shown at most, above the records. */
const MAX_SECTIONS = 5;

/**
 * Search from every admin screen: the panel's own sections (by name), then
 * applicants, leads, email logs, job openings, every content list and users —
 * only the sections this user may open — plus every line of page text for
 * people with "Pages & text".
 */
export function GlobalSearch({ role, access, canTexts }: { role: AdminRole; access: Access; canTexts: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [textBusy, setTextBusy] = useState(false);
  const [records, setRecords] = useState<RecordResult | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);
  /** the term the current results belong to */
  const [resultFor, setResultFor] = useState("");
  const [error, setError] = useState("");
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const seq = useRef(0);
  const warmed = useRef(false);

  const term = q.trim();
  // Sections are matched here, at once: every word typed must be in the section's name or its group's.
  const words = term.toLowerCase().split(/\s+/).filter(Boolean);
  const sections =
    term.length < 2
      ? []
      : navTargets(role, access)
          .filter((t) => words.every((w) => `${t.label} ${t.parent}`.toLowerCase().includes(w)))
          .slice(0, MAX_SECTIONS);
  const rows: Row[] = [
    ...sections.map((t): Row => ({ type: "nav", key: `n:${t.href}`, href: t.href, section: "Panel sections", title: t.label, sub: t.parent, icon: t.icon })),
    ...(records?.hits ?? []).map((h, i): Row => ({
      type: "record", key: `r:${h.href}:${i}`, href: h.href, section: h.section, area: h.area,
      title: h.title, sub: h.sub, before: h.before, match: h.match, after: h.after,
    })),
    ...(result
      ? [
          ...result.pages.map((p): Row => ({ type: "page", key: `p:${p.path}`, href: textHref(p.slug, p.path, ""), section: "Page text", title: p.page, sub: `${p.group} · ${p.tag}` })),
          ...result.hits.map((h, i): Row => ({
            type: "hit", key: `h:${h.path}:${i}`, href: textHref(h.slug, h.path, term), section: "Page text", title: h.page,
            sub: [h.group, h.section, h.card].filter(Boolean).join(" › "),
            before: h.before, match: h.match, after: h.after,
          })),
        ]
      : []),
  ];

  // Build the page-text index in the background as soon as the box is used.
  const warm = useCallback(() => {
    if (warmed.current || !canTexts) return;
    warmed.current = true;
    void searchAllTextAction("").catch(() => { warmed.current = false; });
  }, [canTexts]);

  // Debounced search; only the latest request may update the list. Records
  // come back fast and show first; page text follows when it is ready.
  useEffect(() => {
    if (term.length < 2) return;
    const id = ++seq.current;
    const t = setTimeout(() => {
      setBusy(true);
      setTextBusy(canTexts);
      setError("");
      searchRecordsAction(term)
        .then((r) => {
          if (id !== seq.current) return;
          setRecords(r);
          setResultFor(term);
          setActive(0);
          if (r.dbError && !canTexts) setError(r.dbError);
        })
        .catch(() => { if (id === seq.current) setError("Search failed. Try again."); })
        .finally(() => { if (id === seq.current) setBusy(false); });
      if (canTexts) {
        searchAllTextAction(term)
          .then((r) => { if (id === seq.current) setResult(r); })
          .catch(() => { if (id === seq.current) setResult(null); })
          .finally(() => { if (id === seq.current) setTextBusy(false); });
      }
    }, 250);
    return () => clearTimeout(t);
  }, [term, canTexts]);

  // Close on outside click; "/" focuses the box.
  useEffect(() => {
    const down = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT" && !(e.target as HTMLElement | null)?.isContentEditable) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", key);
    };
  }, []);

  function go(row: Row) {
    setOpen(false);
    router.push(row.href);
  }

  const reset = () => {
    seq.current++;
    setRecords(null);
    setResult(null);
    setBusy(false);
    setTextBusy(false);
    setError("");
  };
  const clear = () => {
    setQ("");
    reset();
    input.current?.focus();
  };

  const showPanel = open && term.length >= 2;
  const loading = busy || textBusy;

  return (
    <div ref={box} className="relative min-w-0 max-w-xl flex-1">
      <label className="relative block">
        <span className="sr-only">Search the admin panel</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-uk-muted" />
        <input
          ref={input}
          type="search"
          value={q}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls="admin-search-results"
          aria-label="Search sections, applicants, leads, content and page text"
          autoComplete="off"
          placeholder={canTexts ? "Search anything: names, emails, content, page text…  ( / )" : "Search names, emails, applications…  ( / )"}
          onChange={(e) => {
            const v = e.target.value;
            setQ(v);
            setOpen(true);
            if (v.trim().length < 2) reset();
            else setBusy(true);
          }}
          onFocus={() => {
            setOpen(true);
            warm();
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              input.current?.blur();
            } else if (e.key === "ArrowDown" && rows.length) {
              e.preventDefault();
              setActive((a) => Math.min(rows.length - 1, a + 1));
            } else if (e.key === "ArrowUp" && rows.length) {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            } else if (e.key === "Enter" && rows[active]) {
              e.preventDefault();
              go(rows[active]);
            }
          }}
          className="h-10 w-full rounded-lg border border-input bg-transparent pl-9 pr-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-search-cancel-button]:hidden"
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-uk-muted" />
        ) : q ? (
          <button type="button" onClick={clear} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-uk-muted hover:text-uk-heading">
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </label>

      {showPanel && (
        <div
          id="admin-search-results"
          role="listbox"
          data-for={resultFor}
          aria-busy={loading}
          className="absolute left-0 right-0 top-full z-40 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-uk-line bg-uk-card p-2 shadow-premium sm:min-w-[34rem]"
        >
          {/* matching sections still show when the database can't be searched */}
          {error && sections.length === 0 ? (
            <p role="alert" className="px-3 py-4 text-sm text-destructive">{error}</p>
          ) : rows.length === 0 && loading ? (
            <p className="px-3 py-4 text-sm text-uk-muted">
              Searching…{canTexts && !result ? " the first page-text search builds the index and can take a few seconds." : ""}
            </p>
          ) : rows.length === 0 ? (
            <p className="px-3 py-4 text-sm text-uk-muted">Nothing found for “{term}”.</p>
          ) : (
            <>
              {rows.map((r, i) => {
                const Icon = iconFor(r);
                return (
                  <div key={r.key}>
                    {(i === 0 || rows[i - 1].section !== r.section) && (
                      <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-uk-muted">{r.section}</p>
                    )}
                    <button
                      type="button"
                      role="option"
                      aria-selected={i === active}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(r)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                        i === active ? "bg-uk-blue/10" : "hover:bg-uk-surface-2"
                      )}
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-uk-blue" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline gap-2">
                          <span className="truncate text-sm font-semibold text-uk-heading">{r.title}</span>
                          <span className="truncate text-[11px] text-uk-muted">{r.sub}</span>
                        </span>
                        {r.type === "nav" ? (
                          <span className="mt-0.5 block text-xs text-uk-blue">Go to this section</span>
                        ) : r.type === "page" ? (
                          <span className="mt-0.5 block text-xs text-uk-blue">Open this page</span>
                        ) : r.match ? (
                          <span className="mt-0.5 block text-xs leading-relaxed text-uk-body">
                            {r.before}
                            <mark className="rounded bg-uk-yellow/60 px-0.5 text-uk-heading">{r.match}</mark>
                            {r.after}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </div>
                );
              })}
              <p className="px-3 pb-1 pt-2 text-[11px] text-uk-muted">
                {rows.length} result{rows.length === 1 ? "" : "s"} shown
                {(records?.more ?? 0) + (result?.more ?? 0) > 0 ? " · more matches not listed — narrow the search" : ""}
                {textBusy ? " · still searching page text…" : result ? ` · searched ${result.searched} pages` : ""}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
