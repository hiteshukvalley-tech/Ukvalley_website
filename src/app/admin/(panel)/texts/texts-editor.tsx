"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, CircleAlert, Link2, ListOrdered, Loader2, RotateCcw, Save, Search, Trash2, Type } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "@/components/admin/toast";
import { confirmDialog } from "@/components/admin/confirm-dialog";
import { ImageInput } from "../home/section-editor";
import { resetAllTextsAction, saveTextsAction, verifyTextsAction, type TextChange } from "./actions";
import { buildSectionLines, linesText, norm, sectionChanges, type SectionLine } from "./section-text";

export type TextRow = {
  id: string;
  kind: "text" | "alt" | "hint" | "link" | "image";
  region: "Header" | "Page" | "Footer";
  role: string;
  /** places on the page that show this */
  count: number;
  /** section this sits in and its title; card inside the section (0 = none) and its title */
  sectionKey: string;
  sectionTitle: string;
  cardId: number;
  cardTitle: string;
  /** the whole sentence this piece sits in (empty when the piece is the whole line) */
  context: string;
  /** rows with the same non-zero id are pieces of one sentence */
  blockId: number;
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
  { value: "hint", label: "Input hints (placeholders)" },
];

const isTextKind = (r: TextRow) => r.kind === "text" || r.kind === "alt" || r.kind === "hint";

/**
 * One section of the page: all of its text in one box (one paragraph per text on
 * the page), plus its images, links, image descriptions and input hints,
 * which are edited one by one below the box.
 */
type Group = { key: string; title: string; textRows: TextRow[]; lines: SectionLine[]; base: string; others: TextRow[] };

function groupRows(rows: TextRow[]): Group[] {
  const groups: Group[] = [];
  for (const r of rows) {
    let g = groups.find((x) => x.key === r.sectionKey);
    if (!g) {
      g = { key: r.sectionKey, title: r.sectionTitle, textRows: [], lines: [], base: "", others: [] };
      groups.push(g);
    }
    (r.kind === "text" ? g.textRows : g.others).push(r);
  }
  for (const g of groups) {
    g.lines = buildSectionLines(g.textRows);
    g.base = linesText(g.lines);
  }
  return groups;
}

/** All text, button labels, links and images of one page, by section. */
export function TextsEditor({ path, rows, initialQuery = "" }: { path: string; rows: TextRow[]; initialQuery?: string }) {
  const router = useRouter();
  const groups = useMemo(() => groupRows(rows), [rows]);

  // Section boxes being edited (key → box text); a section not in here shows its saved text.
  const [boxes, setBoxes] = useState<Record<string, string>>({});
  // Sections to put back to their original text on save.
  const [restore, setRestore] = useState<Set<string>>(new Set());
  // Images, links, image descriptions and hints, edited one by one.
  const [values, setValues] = useState<Record<string, string>>({});
  const [revert, setRevert] = useState<Set<string>>(new Set());
  const [q, setQ] = useState(initialQuery);
  const [kind, setKind] = useState<"all" | TextRow["kind"]>("all");
  const [pending, start] = useTransition();
  const [notApplied, setNotApplied] = useState<string[]>([]);
  const [closed, setClosed] = useState<Set<string>>(new Set());

  const boxText = (g: Group) => boxes[g.key] ?? g.base;
  const boxDirty = (g: Group) => (boxes[g.key] !== undefined && norm(boxes[g.key]) !== norm(g.base)) || restore.has(g.key);
  const rowValue = (r: TextRow) => values[r.id] ?? (isTextKind(r) ? r.current.trim() : r.current);
  const rowDirty = (r: TextRow) => (values[r.id] !== undefined && values[r.id] !== (isTextKind(r) ? r.current.trim() : r.current)) || revert.has(r.id);

  const dirtyGroups = groups.filter(boxDirty);
  const dirtyRows = groups.flatMap((g) => g.others).filter(rowDirty);
  const unsavedCount = dirtyGroups.length + dirtyRows.length;
  const searching = q.trim() !== "";
  const needle = q.trim().toLowerCase();

  // What is shown: the box when text is included in the filter, and the rows of the chosen kind.
  const showBox = kind === "all" || kind === "text";
  const visible = groups
    .map((g) => {
      const others = g.others.filter((r) => (kind === "all" || r.kind === kind) && (!searching || `${r.current} ${r.original}`.toLowerCase().includes(needle)));
      const box = showBox && g.lines.length > 0 && (!searching || boxText(g).toLowerCase().includes(needle));
      return { g, others, box };
    })
    .filter((x) => x.box || x.others.length);

  function collectChanges(): TextChange[] | null {
    const out: TextChange[] = [];
    for (const g of dirtyGroups) {
      if (restore.has(g.key)) {
        for (const r of g.textRows) if (r.edited || r.stuckOverride !== undefined) out.push({ kind: "text", o: r.original, r: null });
        continue;
      }
      const res = sectionChanges(g.lines, boxText(g));
      if ("error" in res) {
        toast.error(`${g.title}: ${res.error}`);
        setClosed((p) => { const n = new Set(p); n.delete(g.key); return n; });
        return null;
      }
      for (const e of res.edits) {
        const row = e.row as TextRow;
        out.push({ kind: "text", o: row.original, r: norm(e.typed) === norm(row.original) && e.typed !== "" ? null : e.typed });
      }
    }
    for (const r of dirtyRows) {
      const typed = isTextKind(r)
        ? (() => { const lead = /^\s*/.exec(r.original)![0]; const trail = /\s*$/.exec(r.original)![0]; return lead + rowValue(r).trim() + trail; })()
        : rowValue(r).trim();
      out.push({ kind: r.kind, o: r.original, r: revert.has(r.id) || typed === r.original ? null : typed });
    }
    // One change per text, however many sections list it (the first one wins).
    const seen = new Set<string>();
    return out.filter((c) => {
      const key = `${c.kind}\u0000${c.o}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function save() {
    const changes = collectChanges();
    if (!changes) return;
    if (!changes.length) {
      setBoxes({});
      setRestore(new Set());
      return;
    }
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
      setBoxes({});
      setRestore(new Set());
      setValues({});
      setRevert(new Set());
      router.refresh();
    });
  }

  function renderBox(g: Group) {
    const text = boxText(g);
    const dirty = boxDirty(g);
    const problem = dirty && !restore.has(g.key) ? sectionChanges(g.lines, text) : null;
    const error = problem && "error" in problem ? problem.error : "";
    const edited = g.textRows.some((r) => r.edited || r.stuckOverride !== undefined);
    // each text plus the empty line after it
    const rowsTall = g.lines.reduce((n, l) => n + Math.max(1, Math.ceil(l.text.length / 95)) + 1, 0);
    return (
      <div className={cn("rounded-xl border bg-uk-card p-3.5", dirty ? "border-amber-500/50" : "border-uk-line")}>
        <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
          <span className="inline-flex items-center gap-1 rounded-full bg-uk-blue/10 px-2 py-0.5 text-uk-blue">
            <Type className="h-3 w-3" /> One section · 1 editable part
          </span>
          <span className="rounded-full bg-uk-surface-3 px-2 py-0.5 text-uk-muted">
            {g.lines.length} text{g.lines.length === 1 ? "" : "s"}
          </span>
          {edited && <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-emerald-700 dark:text-emerald-300">Edited</span>}
          {restore.has(g.key) && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-700 dark:text-amber-300">Original text on save</span>}
          {dirty && !restore.has(g.key) && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-700 dark:text-amber-300">Unsaved</span>}
        </div>
        <Textarea
          value={text}
          aria-label={`All text of the section “${g.title}”, one text per paragraph, separated by empty lines`}
          rows={Math.min(60, Math.max(3, rowsTall))}
          disabled={restore.has(g.key)}
          onChange={(e) => setBoxes((p) => ({ ...p, [g.key]: e.target.value }))}
          className="font-[inherit] leading-relaxed"
        />
        {error ? (
          <p role="alert" className="mt-2 flex items-start gap-1.5 text-xs font-medium text-destructive">
            <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
          </p>
        ) : (
          <p className="mt-2 text-xs text-uk-muted">
            Each paragraph is one text of this section on the page (heading, text, button…), with an empty line between texts. Change the words; keep the empty lines and the number of texts.
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
          <details className="min-w-0 flex-1 text-uk-muted">
            <summary className="inline-flex cursor-pointer items-center gap-1 font-semibold text-uk-blue hover:text-uk-blue-bright">
              <ListOrdered className="h-3.5 w-3.5" /> What each text is
            </summary>
            <ol className="mt-2 space-y-1 rounded-lg bg-uk-surface-2 p-3">
              {g.lines.map((l, i) => (
                <li key={i} className="flex gap-2">
                  <span className="w-6 shrink-0 text-right font-semibold text-uk-heading">{i + 1}</span>
                  <span className="shrink-0 font-semibold text-uk-blue">{l.role}</span>
                  <span className="min-w-0 truncate">{l.text}</span>
                </li>
              ))}
            </ol>
          </details>
          {(dirty || edited) && (
            <button
              type="button"
              onClick={() => {
                if (dirty) {
                  setBoxes((p) => { const n = { ...p }; delete n[g.key]; return n; });
                  setRestore((p) => { const n = new Set(p); n.delete(g.key); return n; });
                } else setRestore((p) => new Set(p).add(g.key));
              }}
              className="inline-flex items-center gap-1 font-semibold text-uk-blue hover:text-uk-blue-bright"
            >
              <RotateCcw className="h-3.5 w-3.5" /> {dirty ? "Undo my changes" : "Restore this section's original text"}
            </button>
          )}
        </div>
      </div>
    );
  }

  /** An image, link, image description or input hint, edited on its own. */
  function renderRow(r: TextRow) {
    const value = rowValue(r);
    const isChanged = rowDirty(r);
    const set = (v: string) => setValues((p) => ({ ...p, [r.id]: v }));
    const Icon = r.kind === "link" ? Link2 : Type;
    return (
      <li key={r.id} className={cn("rounded-xl border bg-uk-card p-3.5", isChanged ? "border-amber-500/50" : "border-uk-line")}>
        <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
          <span className="inline-flex items-center gap-1 rounded-full bg-uk-blue/10 px-2 py-0.5 text-uk-blue">
            {r.kind !== "image" && <Icon className="h-3 w-3" />}
            {r.role}
          </span>
          {r.cardTitle && <span className="rounded-full bg-uk-surface-3 px-2 py-0.5 text-uk-muted">{r.cardTitle}</span>}
          {r.count > 1 && <span className="rounded-full bg-uk-surface-3 px-2 py-0.5 text-uk-muted">shown {r.count}× on this page</span>}
          {r.edited && <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-emerald-700 dark:text-emerald-300">Edited</span>}
          {isChanged && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-700 dark:text-amber-300">Unsaved</span>}
        </div>

        {r.kind === "image" ? (
          <ImageInput
            id={`t-${r.id}`}
            label="Image"
            value={value}
            onChange={set}
            hint="Upload a new image or paste a /media/… path. Use “Revert” to go back to the original."
          />
        ) : r.kind === "link" ? (
          <Input value={value} aria-label="Link address" onChange={(e) => set(e.target.value)} className="h-10 font-mono text-xs" />
        ) : (
          <Textarea value={value} aria-label={`${r.role} text`} rows={Math.min(8, Math.max(1, Math.ceil(value.length / 80)))} onChange={(e) => set(e.target.value)} />
        )}

        {(r.edited || r.stuckOverride !== undefined) && (
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-uk-muted">
            {r.edited && <span>Original: <span className="text-uk-body">{r.original.trim()}</span></span>}
            {r.stuckOverride !== undefined && (
              <span className="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-300">
                <CircleAlert className="h-3.5 w-3.5" /> A saved edit is not showing here (interactive part of the page).
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                set(isTextKind(r) ? r.original.trim() : r.original);
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
          <p className="mt-1 text-xs">That text is built into an interactive part of the page (a form or widget). Restore it from its section to clear the saved edit.</p>
        </div>
      )}

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-uk-line bg-uk-card p-10 text-center text-sm text-uk-muted">Nothing matches.</p>
      ) : (
        <div className="space-y-4">
          {visible.map(({ g, others, box }) => {
            const gi = groups.indexOf(g);
            const open = searching || !closed.has(g.key);
            const unsaved = (boxDirty(g) ? 1 : 0) + others.filter(rowDirty).length;
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
                    <span className="block break-words font-heading text-base font-semibold text-uk-heading">{g.title}</span>
                    <span className="block text-xs text-uk-muted">
                      Section · {g.lines.length} text{g.lines.length === 1 ? "" : "s"}
                      {g.others.length > 0 && ` · ${g.others.length} image${g.others.length === 1 ? "" : "s"}, link${g.others.length === 1 ? "" : "s"} or hint${g.others.length === 1 ? "" : "s"}`}
                    </span>
                  </span>
                  {unsaved > 0 && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">Unsaved</span>}
                  <ChevronDown className={cn("h-4 w-4 shrink-0 text-uk-muted transition-transform", open && "rotate-180")} />
                </button>
                {open && (
                  <div className="space-y-4 border-t border-uk-line p-4 sm:p-5">
                    {box && renderBox(g)}
                    {others.length > 0 && <ol className="space-y-3">{others.map(renderRow)}</ol>}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-uk-line bg-uk-card/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <p className="text-xs text-uk-muted">
          {unsavedCount ? <span className="font-medium text-amber-600 dark:text-amber-400">{unsavedCount} unsaved change{unsavedCount === 1 ? "" : "s"}</span> : "No changes yet."}{" "}
          Edits apply to every place that shows exactly the same text.
        </p>
        <button
          type="button"
          disabled={pending || unsavedCount === 0}
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
