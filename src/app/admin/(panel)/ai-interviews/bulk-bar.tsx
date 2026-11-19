"use client";

import { useEffect, useState, useTransition } from "react";
import { Download, Loader2, X } from "lucide-react";
import { toast } from "@/components/admin/toast";
import { confirmDialog } from "@/components/admin/confirm-dialog";
import { BULK_ACTIONS, BULK_MAX, bulkActionLabel, type BulkAction } from "@/lib/ai-interview/types";
import { bulkAction } from "./actions";

// The Schedule list's selection: a checkbox per row (rendered by the server
// page as <input name="bulk-id">), "select all" in the header, and this bar
// with the action to run on the selected interviews.

const SELECTOR = 'input[name="bulk-id"]';
const boxes = () => [...document.querySelectorAll<HTMLInputElement>(SELECTOR)];

/** Ticks or clears every row on this page. */
export function SelectAll() {
  return (
    <input
      type="checkbox"
      aria-label="Select every interview on this page"
      className="h-4 w-4 accent-uk-blue"
      onChange={(e) => {
        for (const b of boxes()) b.checked = e.currentTarget.checked;
        document.dispatchEvent(new Event("bulk-change"));
      }}
    />
  );
}

/** A row's checkbox (a client component so ticking it updates the bar). */
export function SelectRow({ id, name }: { id: string; name: string }) {
  return (
    <input
      type="checkbox"
      name="bulk-id"
      value={id}
      aria-label={`Select ${name}`}
      className="h-4 w-4 accent-uk-blue"
      onChange={() => document.dispatchEvent(new Event("bulk-change"))}
    />
  );
}

const NEEDS_REASON: BulkAction[] = ["cancel", "shortlist", "reject"];

export function BulkBar({ exportHref }: { exportHref: string }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [action, setAction] = useState<BulkAction>("remind");
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();

  useEffect(() => {
    const read = () => setSelected(boxes().filter((b) => b.checked).map((b) => b.value));
    document.addEventListener("bulk-change", read);
    return () => document.removeEventListener("bulk-change", read);
  }, []);

  const clear = () => {
    for (const b of boxes()) b.checked = false;
    for (const b of document.querySelectorAll<HTMLInputElement>('input[aria-label="Select every interview on this page"]')) b.checked = false;
    setSelected([]);
  };

  if (!selected.length) {
    return (
      <div className="mb-3 flex justify-end">
        <a href={exportHref} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-uk-line px-3 text-sm font-medium text-uk-body hover:bg-uk-surface-2">
          <Download className="h-4 w-4" /> Export CSV (these filters)
        </a>
      </div>
    );
  }

  return (
    <div role="region" aria-label="Bulk actions" className="sticky top-2 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-uk-blue/30 bg-uk-card p-3 shadow-premium-lg">
      <span className="text-sm font-semibold text-uk-heading">{selected.length} selected</span>
      <button type="button" onClick={clear} className="inline-flex items-center gap-1 text-xs text-uk-muted hover:text-uk-heading"><X className="h-3.5 w-3.5" /> Clear</button>
      <label className="sr-only" htmlFor="bulk-action">Action</label>
      <select id="bulk-action" value={action} onChange={(e) => setAction(e.target.value as BulkAction)} className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm text-uk-body outline-none focus-visible:border-ring">
        {BULK_ACTIONS.map((a) => <option key={a} value={a}>{bulkActionLabel[a]}</option>)}
      </select>
      {NEEDS_REASON.includes(action) && (
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={300}
          placeholder={action === "cancel" ? "Reason (shown to candidates, optional)" : "Note for the record (optional)"}
          aria-label="Reason or note"
          className="h-9 min-w-56 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm text-uk-body outline-none focus-visible:border-ring"
        />
      )}
      <button
        type="button"
        disabled={pending || selected.length > BULK_MAX}
        className="h-9 rounded-lg bg-uk-blue px-3 text-sm font-semibold text-uk-white disabled:opacity-60"
        onClick={() =>
          start(async () => {
            const sure = await confirmDialog(`${bulkActionLabel[action]}: ${selected.length} interview${selected.length === 1 ? "" : "s"}? Each candidate affected is notified as usual.`);
            if (!sure) return;
            const r = await bulkAction(selected, action, reason);
            toast.result(r, "Done.");
            if (r.skipped?.length) {
              const sample = r.skipped.slice(0, 3).map((s) => `${s.name}: ${s.reason}`).join(" · ");
              toast.info(`Skipped: ${sample}${r.skipped.length > 3 ? ` (+${r.skipped.length - 3} more)` : ""}`);
            }
            clear();
          })
        }
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
      </button>
      <a href={`${exportHref}${exportHref.includes("?") ? "&" : "?"}ids=${selected.join(",")}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-uk-line px-3 text-sm font-medium text-uk-body hover:bg-uk-surface-2">
        <Download className="h-4 w-4" /> Export selected
      </a>
      {selected.length > BULK_MAX && <span className="w-full text-xs text-red-700 dark:text-red-400">Select up to {BULK_MAX} at a time.</span>}
    </div>
  );
}
