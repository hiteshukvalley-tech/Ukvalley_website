"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "@/components/site/intent-link";
import { ArrowDown, ArrowRight, ArrowUp, Eye, EyeOff, Loader2, Lock, Plus, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast, useResultToast } from "@/components/admin/toast";
import { createCustomSectionAction, saveHomeOrderAction, type LayoutState } from "./actions";

export type SectionRow = {
  id: string;
  label: string;
  description: string;
  shown: boolean;
  custom: boolean;
  /** "Last saved …" / "Original text", already formatted on the server */
  note: string;
  /** names of the admin areas that hold this section's cards */
  cards?: string;
};

const arrowBtn =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-uk-line text-uk-muted transition-colors hover:bg-uk-surface-2 hover:text-uk-heading disabled:pointer-events-none disabled:opacity-30";

/** The home page's sections in display order, with up/down controls and "add a section". */
export function SectionList({ rows: initialRows }: { rows: SectionRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [saving, startSave] = useTransition();
  const [createState, createAction, creating] = useActionState<LayoutState, FormData>(createCustomSectionAction, {});
  useResultToast(createState);

  function moveRow(from: number, to: number) {
    // The hero (row 0) stays on top; nothing may move above it.
    if (to < 1 || to >= rows.length || from < 1) return;
    const before = rows;
    const next = [...rows];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setRows(next);
    startSave(async () => {
      const r = await saveHomeOrderAction(next.map((x) => x.id));
      if (r.status === "saved") toast.success(r.message ?? "Order saved.");
      else {
        setRows(before);
        toast.error(r.message ?? "Could not save the order.");
      }
    });
  }

  return (
    <>
      <ol className="space-y-3" aria-busy={saving}>
        {rows.map((s, i) => (
          <li key={s.id} className="flex items-stretch gap-3">
            <div className="flex flex-col justify-center gap-1">
              {i === 0 ? (
                <span className="flex h-[4.25rem] w-8 items-center justify-center text-uk-muted" title="The hero always stays on top">
                  <Lock className="h-3.5 w-3.5" aria-label="Pinned to the top" />
                </span>
              ) : (
                <>
                  <button type="button" className={arrowBtn} disabled={saving || i <= 1} onClick={() => moveRow(i, i - 1)} aria-label={`Move ${s.label} up`}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" className={arrowBtn} disabled={saving || i >= rows.length - 1} onClick={() => moveRow(i, i + 1)} aria-label={`Move ${s.label} down`}>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
            <Link
              href={`/admin/home/${s.id}`}
              className="group flex min-w-0 flex-1 items-center gap-4 rounded-2xl border border-uk-line bg-uk-card p-5 transition-colors hover:border-uk-blue/40"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-uk-blue/10 font-heading text-sm font-bold text-uk-blue">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-heading text-base font-semibold text-uk-heading">{s.label}</span>
                  {s.custom && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-uk-yellow/20 px-2 py-0.5 text-[11px] font-semibold text-uk-heading">
                      <Sparkles className="h-3 w-3" /> Added by you
                    </span>
                  )}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      s.shown ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" : "bg-uk-surface-3 text-uk-muted"
                    )}
                  >
                    {s.shown ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    {s.shown ? "Shown" : "Hidden"}
                  </span>
                </span>
                <span className="mt-0.5 block text-sm text-uk-muted">{s.description}</span>
                <span className="mt-1 block text-xs text-uk-muted">
                  {s.note}
                  {s.cards && ` · Cards: ${s.cards}`}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-uk-muted transition-transform group-hover:translate-x-0.5 group-hover:text-uk-blue" />
            </Link>
          </li>
        ))}
      </ol>

      <form action={createAction} className="mt-8 rounded-2xl border border-dashed border-uk-blue/40 bg-uk-blue/[0.04] p-5">
        <h2 className="font-heading text-base font-semibold text-uk-heading">Add a new section</h2>
        <p className="mt-1 text-sm text-uk-muted">
          A free-form section with a heading, text, an image, cards and a button. It is added after Insights — use the arrows above to put it anywhere.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Input name="name" required maxLength={60} placeholder="Section name, e.g. Our awards" className="h-10 max-w-sm flex-1" aria-label="New section name" />
          <button
            type="submit"
            disabled={creating}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-4 text-sm font-semibold text-uk-white transition-colors hover:bg-uk-blue-bright disabled:opacity-60"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add section
          </button>
        </div>
        {createState.status === "error" && createState.message && (
          <p role="alert" className="mt-2 text-xs font-medium text-destructive">{createState.message}</p>
        )}
      </form>
    </>
  );
}
