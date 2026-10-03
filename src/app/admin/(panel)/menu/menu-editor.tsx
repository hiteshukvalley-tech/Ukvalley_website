"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import Link from "@/components/site/intent-link";
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Pencil, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast, useResultToast } from "@/components/admin/toast";
import {
  MAX_DROPDOWN_LINKS, isBuiltInMenuId, linksToText, type MenuItem,
} from "@/lib/menu-schema";
import { createMainSectionAction, resetMenuAction, saveMenuAction, type MenuState } from "./actions";

type Row = { id: string; label: string; type: MenuItem["type"]; href: string; linksText: string; visible: boolean };

const toRow = (i: MenuItem): Row => ({
  id: i.id, label: i.label, type: i.type, href: i.href, linksText: linksToText(i.links), visible: i.visible,
});

const SOURCE: Record<string, { text: string; href: string }> = {
  services: { text: "Dropdown filled from your services.", href: "/admin/services" },
  solutions: { text: "Dropdown filled from your solutions.", href: "/admin/solutions" },
  hire: { text: "Dropdown filled from your hire roles.", href: "/admin/hire" },
};

const arrowBtn =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-uk-line text-uk-muted transition-colors hover:bg-uk-surface-2 hover:text-uk-heading disabled:pointer-events-none disabled:opacity-30";

/** The main menu: order, names, visibility, links — and adding new main sections. */
export function MenuEditor({ initial, pageNames }: { initial: MenuItem[]; pageNames: Record<string, string> }) {
  const [rows, setRows] = useState<Row[]>(() => initial.map(toRow));
  const [saved, setSaved] = useState(() => JSON.stringify(initial.map(toRow)));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const dirty = useMemo(() => JSON.stringify(rows) !== saved, [rows, saved]);

  const patch = (id: string, p: Partial<Row>) => setRows((r) => r.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const move = (from: number, to: number) =>
    setRows((r) => {
      if (to < 0 || to >= r.length) return r;
      const next = [...r];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  function save() {
    start(async () => {
      const res = await saveMenuAction(JSON.stringify(rows));
      if (res.status === "saved") {
        setErrors({});
        setSaved(JSON.stringify(rows));
        toast.success(res.message ?? "Menu saved.");
      } else {
        setErrors(res.errors ?? {});
        toast.error(res.message ?? "Could not save the menu.");
      }
    });
  }

  function restore() {
    if (!window.confirm("Restore the original menu (Services, Solutions, Work, Company, Hire, Insights)? Your menu changes are removed; pages you added are kept.")) return;
    start(async () => {
      const res = await resetMenuAction();
      if (res.status === "saved") {
        toast.success(res.message ?? "Restored.");
        window.location.reload();
      } else toast.error(res.message ?? "Could not restore the menu.");
    });
  }

  return (
    <div className="space-y-6">
      <ol className="space-y-3">
        {rows.map((r, i) => {
          const builtIn = isBuiltInMenuId(r.id);
          const source = SOURCE[r.type];
          const pageSlug = r.type === "link" && r.href.startsWith("/s/") ? r.href.slice(3) : undefined;
          return (
            <li key={r.id} className={cn("flex items-stretch gap-3", !r.visible && "opacity-70")}>
              <div className="flex flex-col justify-center gap-1">
                <button type="button" className={arrowBtn} disabled={pending || i === 0} onClick={() => move(i, i - 1)} aria-label={`Move ${r.label || "item"} left`}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button type="button" className={arrowBtn} disabled={pending || i === rows.length - 1} onClick={() => move(i, i + 1)} aria-label={`Move ${r.label || "item"} right`}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="min-w-0 flex-1 rounded-2xl border border-uk-line bg-uk-card p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-uk-blue/10 font-heading text-xs font-bold text-uk-blue">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-40 flex-1">
                    <Input
                      value={r.label}
                      maxLength={24}
                      aria-label={`Menu name ${i + 1}`}
                      aria-invalid={errors[`${r.id}.label`] ? true : undefined}
                      onChange={(e) => patch(r.id, { label: e.target.value })}
                      className="h-9 font-semibold"
                    />
                  </div>
                  <span className="rounded-full bg-uk-surface-3 px-2 py-0.5 text-[11px] font-semibold text-uk-muted">
                    {r.type === "link" ? "Single link" : "Dropdown"}
                    {!builtIn && " · added by you"}
                  </span>
                  <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-uk-heading">
                    <input type="checkbox" checked={r.visible} onChange={(e) => patch(r.id, { visible: e.target.checked })} className="h-4 w-4 accent-[var(--uk-blue)]" />
                    {r.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    Show
                  </label>
                  {!builtIn && (
                    <button
                      type="button"
                      onClick={() => setRows((x) => x.filter((y) => y.id !== r.id))}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-destructive/30 px-2.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                      aria-label={`Remove ${r.label || "item"} from the menu`}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  )}
                </div>
                {errors[`${r.id}.label`] && <p role="alert" className="mt-1 text-xs font-medium text-destructive">{errors[`${r.id}.label`]}</p>}

                {source && (
                  <p className="mt-3 text-xs text-uk-muted">
                    {source.text}{" "}
                    <Link href={source.href} className="font-semibold text-uk-blue hover:text-uk-blue-bright">Edit items →</Link>
                  </p>
                )}

                {r.type === "link" && (
                  <div className="mt-3 space-y-1">
                    <label className="text-xs font-medium text-uk-heading" htmlFor={`href-${r.id}`}>Link</label>
                    <div className="flex flex-wrap items-center gap-3">
                      <Input
                        id={`href-${r.id}`}
                        value={r.href}
                        maxLength={200}
                        aria-invalid={errors[`${r.id}.href`] ? true : undefined}
                        onChange={(e) => patch(r.id, { href: e.target.value })}
                        className="h-9 max-w-md flex-1"
                      />
                      {pageSlug && (
                        <Link href={`/admin/menu/${pageSlug}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-uk-line px-3 text-xs font-medium text-uk-body hover:bg-uk-surface-2 hover:text-uk-heading">
                          <Pencil className="h-3.5 w-3.5" /> Edit page “{pageNames[pageSlug] ?? pageSlug}”
                        </Link>
                      )}
                    </div>
                    {errors[`${r.id}.href`] && <p role="alert" className="text-xs font-medium text-destructive">{errors[`${r.id}.href`]}</p>}
                  </div>
                )}

                {r.type === "dropdown" && (
                  <div className="mt-3 space-y-1">
                    <label className="text-xs font-medium text-uk-heading" htmlFor={`links-${r.id}`}>
                      Dropdown links — one per line, written as <code className="rounded bg-uk-surface-3 px-1">Name | /link</code> (up to {MAX_DROPDOWN_LINKS}); the line order is the menu order
                    </label>
                    <Textarea
                      id={`links-${r.id}`}
                      value={r.linksText}
                      rows={Math.min(12, Math.max(3, r.linksText.split("\n").length + 1))}
                      aria-invalid={errors[`${r.id}.links`] ? true : undefined}
                      onChange={(e) => patch(r.id, { linksText: e.target.value })}
                      className="font-mono text-xs"
                    />
                    {errors[`${r.id}.links`] && <p role="alert" className="text-xs font-medium text-destructive">{errors[`${r.id}.links`]}</p>}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-uk-line bg-uk-card/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <button
          type="button"
          disabled={pending}
          onClick={restore}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading disabled:opacity-60"
        >
          <RotateCcw className="h-4 w-4" /> Restore original menu
        </button>
        <div className="flex items-center gap-3">
          {dirty && <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Unsaved changes</span>}
          <button
            type="button"
            disabled={pending || !dirty}
            onClick={save}
            className="btn-sheen inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-5 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {pending ? "Saving…" : "Save menu"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** "Add a main section" — placed after the last item (next to Insights). */
export function AddSectionForm() {
  const [state, action, creating] = useActionState<MenuState, FormData>(createMainSectionAction, {});
  useResultToast(state);
  return (
    <form action={action} className="rounded-2xl border border-dashed border-uk-blue/40 bg-uk-blue/[0.04] p-5">
      <h2 className="font-heading text-base font-semibold text-uk-heading">Add a main section</h2>
      <p className="mt-1 text-sm text-uk-muted">
        It is added at the end of the menu, next to Insights. Save the menu in the list above first if you have unsaved changes — adding a section reloads this page. Use the arrows to move it anywhere.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Input name="name" required maxLength={24} placeholder="Menu name, e.g. Resources" className="h-10 max-w-xs flex-1" aria-label="New section name" />
        <select
          name="kind"
          defaultValue="page"
          aria-label="What the new section is"
          className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="page">A page of its own (hero, cards, blocks)</option>
          <option value="dropdown">A dropdown of links</option>
          <option value="link">A single link</option>
        </select>
        <button
          type="submit"
          disabled={creating}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-4 text-sm font-semibold text-uk-white transition-colors hover:bg-uk-blue-bright disabled:opacity-60"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add section
        </button>
      </div>
      {state.status === "error" && state.message && <p role="alert" className="mt-2 text-xs font-medium text-destructive">{state.message}</p>}
    </form>
  );
}
