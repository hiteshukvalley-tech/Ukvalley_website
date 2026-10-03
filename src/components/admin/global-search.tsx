"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchAllTextAction, type SearchResult } from "@/app/admin/(panel)/texts/search-actions";

type Row =
  | { type: "page"; key: string; path: string; slug: string; title: string; sub: string }
  | { type: "hit"; key: string; path: string; slug: string; title: string; sub: string; before: string; match: string; after: string };

const href = (slug: string, path: string, q: string) => `/admin/texts/${slug}?path=${encodeURIComponent(path)}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

/** Search any line or word on any page, from every admin screen. Opens the page's editor on the matching text. */
export function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
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
  const rows: Row[] = result
    ? [
        ...result.pages.map((p): Row => ({ type: "page", key: `p:${p.path}`, path: p.path, slug: p.slug, title: p.page, sub: `${p.group} · ${p.tag}` })),
        ...result.hits.map((h, i): Row => ({
          type: "hit", key: `h:${h.path}:${i}`, path: h.path, slug: h.slug, title: h.page,
          sub: [h.group, h.section, h.card].filter(Boolean).join(" › "),
          before: h.before, match: h.match, after: h.after,
        })),
      ]
    : [];

  // Build the page index in the background as soon as the box is used.
  const warm = useCallback(() => {
    if (warmed.current) return;
    warmed.current = true;
    void searchAllTextAction("").catch(() => { warmed.current = false; });
  }, []);

  // Debounced search; only the latest request may update the list.
  useEffect(() => {
    if (term.length < 2) return;
    const id = ++seq.current;
    const t = setTimeout(async () => {
      setBusy(true);
      setError("");
      try {
        const r = await searchAllTextAction(term);
        if (id === seq.current) {
          setResult(r);
          setResultFor(term);
          setActive(0);
        }
      } catch {
        if (id === seq.current) setError("Search failed. Try again.");
      } finally {
        if (id === seq.current) setBusy(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [term]);

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
    router.push(href(row.slug, row.path, row.type === "hit" ? term : ""));
  }

  const showPanel = open && term.length >= 2;
  const clear = () => {
    seq.current++;
    setQ("");
    setResult(null);
    setBusy(false);
    setError("");
    input.current?.focus();
  };

  return (
    <div ref={box} className="relative min-w-0 max-w-xl flex-1">
      <label className="relative block">
        <span className="sr-only">Search every page&apos;s text</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-uk-muted" />
        <input
          ref={input}
          type="search"
          value={q}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls="admin-search-results"
          aria-label="Search any text on any page"
          autoComplete="off"
          placeholder="Search any text on any page…  ( / )"
          onChange={(e) => {
            const v = e.target.value;
            setQ(v);
            setOpen(true);
            if (v.trim().length < 2) {
              seq.current++;
              setResult(null);
              setBusy(false);
            } else {
              setBusy(true);
            }
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
        {busy ? (
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
          className="absolute left-0 right-0 top-full z-40 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-uk-line bg-uk-card p-2 shadow-premium sm:min-w-[34rem]"
        >
          {error ? (
            <p role="alert" className="px-3 py-4 text-sm text-destructive">{error}</p>
          ) : !result ? (
            <p className="px-3 py-4 text-sm text-uk-muted">Searching every page… the first search builds the index and can take a few seconds.</p>
          ) : rows.length === 0 ? (
            <p className="px-3 py-4 text-sm text-uk-muted">
              Nothing found for “{term}” in {result.searched} pages. (Home page text is edited under Home page.)
            </p>
          ) : (
            <>
              {rows.map((r, i) => (
                <button
                  key={r.key}
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
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-uk-blue" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="truncate text-sm font-semibold text-uk-heading">{r.title}</span>
                      <span className="truncate text-[11px] text-uk-muted">{r.sub}</span>
                    </span>
                    {r.type === "hit" ? (
                      <span className="mt-0.5 block text-xs leading-relaxed text-uk-body">
                        {r.before}
                        <mark className="rounded bg-uk-yellow/60 px-0.5 text-uk-heading">{r.match}</mark>
                        {r.after}
                      </span>
                    ) : (
                      <span className="mt-0.5 block text-xs text-uk-blue">Open this page</span>
                    )}
                  </span>
                </button>
              ))}
              <p className="px-3 pb-1 pt-2 text-[11px] text-uk-muted">
                {result.hits.length} line{result.hits.length === 1 ? "" : "s"} shown
                {result.more > 0 ? ` · ${result.more} more matches not listed — narrow the search` : ""} · searched {result.searched} pages
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
