"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, CircleAlert, Layers, Link2, Loader2, RotateCcw, Save, Search, Trash2, Type } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "@/components/admin/toast";
import { confirmDialog } from "@/components/admin/confirm-dialog";
import { ImageInput } from "../home/section-editor";
import { resetAllTextsAction, saveTextsAction, verifyTextsAction, type TextChange } from "./actions";

export type TextRow = {
  id: string;
  kind: "text" | "alt" | "link" | "image";
  region: "Header" | "Page" | "Footer";
  role: string;
  /** places on the page that show this */
  count: number;
  /** section this sits in and its title; card inside the section (0 = none) and its title */
  sectionKey: string;
  sectionTitle: string;
  cardId: number;
  cardTitle: string;
  /** the text as written in the page code */
  original: string;
  /** what the page shows now */
  current: string;
  /** current differs from the original because of a saved edit */
  edited: boolean;
  /** a saved edit for this text exists but is not showing on this page */
  stuckOverride?: string;
};

const KINDS: { value: "all" | TextRow["kind"]; label: string }[] = [
  { value: "all", label: "Everything" },
  { value: "text", label: "Text & buttons" },
  { value: "image", label: "Images" },
  { value: "alt", label: "Image descriptions" },
];

const edge = (o: string) => ({ lead: /^\s*/.exec(o)![0], trail: /\s*$/.exec(o)![0] });
const isTextKind = (r: TextRow) => r.kind === "text" || r.kind === "alt";

type Group = { key: string; title: string; region: TextRow["region"]; blocks: { cardId: number; cardTitle: string; rows: TextRow[] }[]; total: number };

/** Rows grouped by section (in page order), then by card inside the section. */
function groupRows(rows: TextRow[]): Group[] {
  const groups: Group[] = [];
  for (const r of rows) {
    let g = groups.find((x) => x.key === r.sectionKey);
    if (!g) {
      g = { key: r.sectionKey, title: r.sectionTitle, region: r.region, blocks: [], total: 0 };
      groups.push(g);
    }
    g.total++;
    const last = g.blocks[g.blocks.length - 1];
    if (last && last.cardId === r.cardId) last.rows.push(r);
    else g.blocks.push({ cardId: r.cardId, cardTitle: r.cardTitle, rows: [r] });
  }
  return groups;
}

/** All text, button labels, links and images of one page, by section. */
export function TextsEditor({ path, rows, initialQuery = "" }: { path: string; rows: TextRow[]; initialQuery?: string }) {
  const router = useRouter();
  const baseline = useMemo(
    () => Object.fromEntries(rows.map((r) => [r.id, isTextKind(r) ? r.current.trim() : r.current])),
    [rows]
  );
  const [values, setValues] = useState<Record<string, string>>(baseline);
  const [revert, setRevert] = useState<Set<string>>(new Set());
  const [q, setQ] = useState(initialQuery);
  const [kind, setKind] = useState<"all" | TextRow["kind"]>("all");
  const [pending, start] = useTransition();
  const [notApplied, setNotApplied] = useState<string[]>([]);
  const [closed, setClosed] = useState<Set<string>>(new Set());

  const changed = rows.filter((r) => values[r.id] !== baseline[r.id] || revert.has(r.id));
  const searching = q.trim() !== "";

  const shown = rows.filter((r) => {
    if (kind !== "all" && r.kind !== kind) return false;
    if (searching && !`${r.current} ${r.original}`.toLowerCase().includes(q.trim().toLowerCase())) return false;
    return true;
  });
  const groups = useMemo(() => groupRows(shown), [shown]);

  function save() {
    const changes: TextChange[] = changed.map((r) => {
      const typed = isTextKind(r) ? (() => { const { lead, trail } = edge(r.original); return lead + values[r.id].trim() + trail; })() : values[r.id].trim();
      const back = revert.has(r.id) || typed === r.original;
      return { kind: r.kind, o: r.original, r: back ? null : typed };
    });
    start(async () => {
      const saved = await saveTextsAction(path, changes);
      if (saved.status !== "saved") {
        toast.error(saved.message ?? "Could not save.");
        return;
      }
      // Confirm on the live page that each change is really showing.
      const res = await verifyTextsAction(path, changes);
      setNotApplied(res.notApplied ?? []);
      (res.notApplied?.length ? toast.error : toast.success)(res.message ?? saved.message ?? "Saved.");
      setRevert(new Set());
      if (!res.notApplied?.length) router.refresh();
    });
  }

  function renderRow(r: TextRow) {
    const value = values[r.id] ?? "";
    const isChanged = changed.includes(r);
    const Icon = r.kind === "link" ? Link2 : Type;
    return (
      <li key={r.id} className={cn("rounded-xl border bg-uk-card p-3.5", isChanged ? "border-amber-500/50" : "border-uk-line")}>
        <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
          <span className="inline-flex items-center gap-1 rounded-full bg-uk-blue/10 px-2 py-0.5 text-uk-blue">
            {r.kind !== "image" && <Icon className="h-3 w-3" />}
            {r.role}
          </span>
          {r.count > 1 && <span className="rounded-full bg-uk-surface-3 px-2 py-0.5 text-uk-muted">shown {r.count}× on this page</span>}
          {r.edited && <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-emerald-700 dark:text-emerald-300">Edited</span>}
          {isChanged && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-700 dark:text-amber-300">Unsaved</span>}
        </div>

        {r.kind === "image" ? (
          <ImageInput
            id={`t-${r.id}`}
            label="Image"
            value={value}
            onChange={(v) => setValues((p) => ({ ...p, [r.id]: v }))}
            hint="Upload a new image or paste a /media/… path. Use “Revert” to go back to the original."
          />
        ) : r.kind === "link" ? (
          <Input value={value} aria-label="Link address" onChange={(e) => setValues((p) => ({ ...p, [r.id]: e.target.value }))} className="h-10 font-mono text-xs" />
        ) : (
          <Textarea
            value={value}
            aria-label={`${r.role} text`}
            rows={Math.min(8, Math.max(1, Math.ceil(value.length / 90)))}
            onChange={(e) => setValues((p) => ({ ...p, [r.id]: e.target.value }))}
          />
        )}

        {(r.edited || r.stuckOverride !== undefined) && (
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-uk-muted">
            {r.edited && <span>Original: <span className="text-uk-body">{r.original.trim().slice(0, 160)}{r.original.trim().length > 160 ? "…" : ""}</span></span>}
            {r.stuckOverride !== undefined && (
              <span className="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-300">
                <CircleAlert className="h-3.5 w-3.5" /> A saved edit is not showing here (interactive part of the page).
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setValues((p) => ({ ...p, [r.id]: isTextKind(r) ? r.original.trim() : r.original }));
                setRevert((p) => new Set(p).add(r.id));
              }}
              className="inline-flex items-center gap-1 font-semibold text-uk-blue hover:text-uk-blue-bright"
            >
              <RotateCcw className="h-3.5 w-3.5" /> {r.stuckOverride !== undefined ? "Remove saved edit" : "Revert to original"}
            </button>
          </div>
        )}
      </li>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-uk-line bg-uk-card p-4">
        <label className="relative min-w-52 flex-1">
          <span className="sr-only">Search this page&apos;s text</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-uk-muted" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search text on this page" className="h-10 pl-9" />
        </label>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as typeof kind)}
          aria-label="Type of item"
          className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </select>
        <button
          type="button"
          onClick={() => setClosed(closed.size ? new Set() : new Set(groups.map((g) => g.key)))}
          className="h-10 rounded-lg border border-uk-line px-3 text-sm font-medium text-uk-body hover:bg-uk-surface-2 hover:text-uk-heading"
        >
          {closed.size ? "Expand all" : "Collapse all"}
        </button>
      </div>

      {notApplied.length > 0 && (
        <div role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <p className="flex items-center gap-2 font-semibold"><CircleAlert className="h-4 w-4" /> These changes are saved but not showing on this page:</p>
          <ul className="mt-1 list-disc pl-6 text-xs">
            {notApplied.map((n) => <li key={n}>{n.length > 120 ? `${n.slice(0, 120)}…` : n}</li>)}
          </ul>
          <p className="mt-1 text-xs">That text is built into an interactive part of the page (a form or widget). Use “Remove saved edit” to clear them.</p>
        </div>
      )}

      {groups.length === 0 ? (
        <p className="rounded-2xl border border-uk-line bg-uk-card p-10 text-center text-sm text-uk-muted">Nothing matches.</p>
      ) : (
        <div className="space-y-4">
          {groups.map((g, gi) => {
            const open = searching || !closed.has(g.key);
            const unsaved = g.blocks.flatMap((b) => b.rows).filter((r) => changed.includes(r)).length;
            return (
              <section key={g.key} className="overflow-hidden rounded-2xl border border-uk-line bg-uk-surface">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setClosed((p) => { const n = new Set(p); if (n.has(g.key)) n.delete(g.key); else n.add(g.key); return n; })}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-uk-surface-2"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-uk-blue/10 font-heading text-xs font-bold text-uk-blue">
                    {String(gi + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-heading text-base font-semibold text-uk-heading">{g.title}</span>
                    <span className="block text-xs text-uk-muted">
                      {g.region === "Page" ? "Section" : g.region} · {g.total} item{g.total === 1 ? "" : "s"}
                      {g.blocks.some((b) => b.cardId) && ` · ${new Set(g.blocks.filter((b) => b.cardId).map((b) => b.cardId)).size} cards`}
                    </span>
                  </span>
                  {unsaved > 0 && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">{unsaved} unsaved</span>}
                  <ChevronDown className={cn("h-4 w-4 shrink-0 text-uk-muted transition-transform", open && "rotate-180")} />
                </button>
                {open && (
                  <div className="space-y-4 border-t border-uk-line p-4 sm:p-5">
                    {g.blocks.map((b, bi) =>
                      b.cardId ? (
                        <div key={`${b.cardId}-${bi}`} className="rounded-2xl border border-uk-blue/25 bg-uk-blue/[0.04] p-3.5">
                          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-uk-blue">
                            <Layers className="h-3.5 w-3.5" /> Card · <span className="normal-case tracking-normal text-uk-heading">{b.cardTitle}</span>
                          </p>
                          <ol className="space-y-3">{b.rows.map(renderRow)}</ol>
                        </div>
                      ) : (
                        <ol key={`loose-${bi}`} className="space-y-3">{b.rows.map(renderRow)}</ol>
                      )
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-uk-line bg-uk-card/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <p className="text-xs text-uk-muted">
          {changed.length ? <span className="font-medium text-amber-600 dark:text-amber-400">{changed.length} unsaved change{changed.length === 1 ? "" : "s"}</span> : "No changes yet."}{" "}
          Edits apply to every place that shows exactly the same text.
        </p>
        <button
          type="button"
          disabled={pending || changed.length === 0}
          onClick={save}
          className="btn-sheen inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-5 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {pending ? "Saving and checking…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

/** Removes every edit made with this tool, on every page. */
export function ResetAllButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        if (!(await confirmDialog("Remove every text, link and image edit made here, on all pages? The pages go back to their original text."))) return;
        start(async () => {
          const r = await resetAllTextsAction();
          if (r.status === "saved") {
            toast.success(r.message ?? "Reset.");
            router.refresh();
          } else toast.error(r.message ?? "Could not reset.");
        });
      }}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-destructive/30 px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      Restore every page&apos;s original text
    </button>
  );
}
