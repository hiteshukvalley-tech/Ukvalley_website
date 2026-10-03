"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  ArrowDown, ArrowUp, CircleAlert, CircleCheck, Eye, EyeOff, ImageIcon, Loader2, Plus, RotateCcw, Save, Trash2, Upload,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { FieldDef, SectionDef, SectionValues } from "@/lib/home-schema";
import type { HomeSectionState } from "./actions";
import { useResultToast } from "@/components/admin/toast";

type Errors = Record<string, string>;
type Row = Record<string, string>;

/* ── Small building blocks ─────────────────────────────────────────── */

function Counter({ length, max }: { length: number; max: number }) {
  return (
    <span
      className={cn(
        "ml-auto shrink-0 text-xs tabular-nums",
        length >= max ? "font-medium text-amber-600 dark:text-amber-400" : "text-uk-muted"
      )}
    >
      {length} / {max}
      <span className="sr-only"> characters</span>
    </span>
  );
}

/** Hint or error on the left, character count on the right. */
function Footer({ id, error, hint, length, max }: { id: string; error?: string; hint?: string; length?: number; max?: number }) {
  if (!error && !hint && max === undefined) return null;
  return (
    <div className="flex items-start gap-3">
      {error ? (
        <p id={`${id}-err`} role="alert" className="text-xs font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-uk-muted">{hint}</p>
      ) : null}
      {max !== undefined && <Counter length={length ?? 0} max={max} />}
    </div>
  );
}

function TextInput({
  id, label, value, onChange, max, multiline, rows = 3, required, error, hint,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void; max: number;
  multiline?: boolean; rows?: number; required?: boolean; error?: string; hint?: string;
}) {
  const props = {
    id,
    value,
    maxLength: max,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-err` : hint ? `${id}-hint` : undefined,
  };
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-uk-heading">
        {label}
        {required && <span className="text-destructive" aria-hidden> *</span>}
      </Label>
      {multiline ? <Textarea {...props} rows={rows} /> : <Input {...props} className="h-10" />}
      <Footer id={id} error={error} hint={hint} length={value.length} max={max} />
    </div>
  );
}

/** An image field: paste a link, or upload a file to the media library (stored as /media/<id>). */
export function ImageInput({
  id, label, value, onChange, error, hint,
}: { id: string; label: string; value: string; onChange: (v: string) => void; error?: string; hint?: string }) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setProblem("");
    try {
      const body = new FormData();
      body.append("files", file);
      const res = await fetch("/admin/media/upload", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as { error?: string; results?: { ok: boolean; id?: string; error?: string }[] };
      const r = data.results?.[0];
      if (r?.ok && r.id) onChange(`/media/${r.id}`);
      else setProblem(r?.error ?? data.error ?? "Upload failed.");
    } catch {
      setProblem("Upload failed. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-uk-heading">{label}</Label>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-uk-line bg-uk-surface-2 text-uk-muted">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-48 flex-1 space-y-2">
          <Input
            id={id}
            value={value}
            maxLength={300}
            placeholder="/media/… or https://…"
            aria-invalid={error ? true : undefined}
            onChange={(e) => onChange(e.target.value)}
            className="h-9"
          />
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-uk-line px-3 text-xs font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {busy ? "Uploading…" : "Upload image"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp,image/avif"
                className="sr-only"
                disabled={busy}
                onChange={(e) => {
                  void upload(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            {value && (
              <button type="button" onClick={() => onChange("")} className="text-xs font-medium text-uk-muted hover:text-destructive">
                Remove image
              </button>
            )}
          </div>
        </div>
      </div>
      {error || problem ? (
        <p role="alert" className="text-xs font-medium text-destructive">{error || problem}</p>
      ) : (
        <p className="text-xs text-uk-muted">{hint ?? "PNG, JPG, GIF, WebP or AVIF, up to 4 MB. Files are kept in Admin → Media."}</p>
      )}
    </div>
  );
}

const iconBtn =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-uk-line text-uk-muted transition-colors hover:bg-uk-surface-2 hover:text-uk-heading disabled:pointer-events-none disabled:opacity-40";

function RowTools({
  index, count, onMove, onRemove, what,
}: { index: number; count: number; onMove: (to: number) => void; onRemove: () => void; what: string }) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" className={iconBtn} disabled={index === 0} onClick={() => onMove(index - 1)} aria-label={`Move ${what} up`}>
        <ArrowUp className="h-3.5 w-3.5" />
      </button>
      <button type="button" className={iconBtn} disabled={index === count - 1} onClick={() => onMove(index + 1)} aria-label={`Move ${what} down`}>
        <ArrowDown className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className={cn(iconBtn, "hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive")}
        onClick={onRemove}
        aria-label={`Remove ${what}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function move<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function AddButton({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-uk-blue/40 px-3 text-sm font-medium text-uk-blue transition-colors hover:bg-uk-blue/10 disabled:pointer-events-none disabled:opacity-50"
    >
      <Plus className="h-4 w-4" /> {label}
    </button>
  );
}

/* ── One field of the section, by kind ─────────────────────────────── */

function Field({
  field: f, value, onChange, errors,
}: { field: FieldDef; value: SectionValues[string]; onChange: (v: SectionValues[string]) => void; errors: Errors }) {
  const id = `h-${f.key}`;

  if (f.kind === "text" || f.kind === "textarea") {
    return (
      <TextInput
        id={id}
        label={f.label}
        value={typeof value === "string" ? value : ""}
        onChange={onChange}
        max={f.max}
        multiline={f.kind === "textarea"}
        rows={f.kind === "textarea" ? f.rows : undefined}
        required={f.required}
        error={errors[f.key]}
        hint={f.hint}
      />
    );
  }

  if (f.kind === "image") {
    return (
      <ImageInput
        id={id}
        label={f.label}
        value={typeof value === "string" ? value : ""}
        onChange={onChange}
        error={errors[f.key]}
        hint={f.hint}
      />
    );
  }

  if (f.kind === "list") {
    const items = Array.isArray(value) ? (value as string[]) : [];
    return (
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-uk-heading">{f.label}</legend>
        {f.hint && <p className="text-xs text-uk-muted">{f.hint}</p>}
        {items.length === 0 && <p className="text-xs text-uk-muted">Nothing added — this part is hidden on the page.</p>}
        <ol className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 shrink-0 text-right text-xs font-semibold text-uk-muted">{i + 1}.</span>
                <Input
                  id={`${id}-${i}`}
                  value={item}
                  maxLength={f.max}
                  aria-label={`${f.itemLabel} ${i + 1}`}
                  aria-invalid={errors[`${f.key}.${i}`] ? true : undefined}
                  onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
                  className="h-9"
                />
                <RowTools
                  index={i}
                  count={items.length}
                  what={`${f.itemLabel.toLowerCase()} ${i + 1}`}
                  onMove={(to) => onChange(move(items, i, to))}
                  onRemove={() => onChange(items.filter((_, j) => j !== i))}
                />
              </div>
              <div className="pl-8 pr-[6.75rem]">
                <Footer id={`${id}-${i}`} error={errors[`${f.key}.${i}`]} length={item.length} max={f.max} />
              </div>
            </li>
          ))}
        </ol>
        {errors[f.key] && <p role="alert" className="text-xs font-medium text-destructive">{errors[f.key]}</p>}
        <AddButton
          label={`Add ${f.itemLabel.toLowerCase()}`}
          disabled={items.length >= f.maxItems}
          onClick={() => onChange([...items, ""])}
        />
        <p className="text-xs text-uk-muted">{items.length} of up to {f.maxItems}.</p>
      </fieldset>
    );
  }

  // group: a list of small cards
  const rows = Array.isArray(value) ? (value as Row[]) : [];
  const blank = () => Object.fromEntries(f.fields.map((sf) => [sf.key, ""]));
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-uk-heading">{f.label}</legend>
      {f.hint && <p className="text-xs text-uk-muted">{f.hint}</p>}
      {rows.length === 0 && <p className="text-xs text-uk-muted">Nothing added — this part is hidden on the page.</p>}
      <div className="space-y-3">
        {rows.map((row, i) => (
          <div key={i} className="rounded-xl border border-uk-line bg-uk-surface p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-uk-muted">
                {f.itemLabel} {i + 1}
              </span>
              <RowTools
                index={i}
                count={rows.length}
                what={`${f.itemLabel.toLowerCase()} ${i + 1}`}
                onMove={(to) => onChange(move(rows, i, to))}
                onRemove={() => onChange(rows.filter((_, j) => j !== i))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {f.fields.map((sf) => (
                <div key={sf.key} className={sf.kind === "textarea" || sf.kind === "image" ? "sm:col-span-2" : undefined}>
                  {sf.kind === "image" ? (
                    <ImageInput
                      id={`${id}-${i}-${sf.key}`}
                      label={sf.label}
                      value={row[sf.key] ?? ""}
                      onChange={(v) => onChange(rows.map((r, j) => (j === i ? { ...r, [sf.key]: v } : r)))}
                      error={errors[`${f.key}.${i}.${sf.key}`]}
                      hint={sf.hint}
                    />
                  ) : (
                    <TextInput
                      id={`${id}-${i}-${sf.key}`}
                      label={sf.label}
                      value={row[sf.key] ?? ""}
                      onChange={(v) => onChange(rows.map((r, j) => (j === i ? { ...r, [sf.key]: v } : r)))}
                      max={sf.max}
                      multiline={sf.kind === "textarea"}
                      rows={2}
                      required={sf.required}
                      error={errors[`${f.key}.${i}.${sf.key}`]}
                      hint={sf.hint}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {errors[f.key] && <p role="alert" className="text-xs font-medium text-destructive">{errors[f.key]}</p>}
      <AddButton
        label={`Add ${f.itemLabel.toLowerCase()}`}
        disabled={rows.length >= f.maxItems}
        onClick={() => onChange([...rows, blank()])}
      />
      <p className="text-xs text-uk-muted">{rows.length} of up to {f.maxItems}.</p>
    </fieldset>
  );
}

/* ── The editor ────────────────────────────────────────────────────── */

/**
 * Holds the values being edited. Re-mounted (via `key`) whenever the saved
 * copy changes, so after a save or a reset it shows what is really stored.
 */
function EditorBody({
  def, initial, initialVisible, errors, onDirty, where,
}: {
  def: SectionDef; initial: SectionValues; initialVisible: boolean; errors: Errors; onDirty: (d: boolean) => void; where: string;
}) {
  const [values, setValues] = useState<SectionValues>(initial);
  const [visible, setVisible] = useState(initialVisible);
  const payload = JSON.stringify({ values, visible });
  const dirty = payload !== JSON.stringify({ values: initial, visible: initialVisible });

  useEffect(() => onDirty(dirty), [dirty, onDirty]);

  return (
    <>
      <input type="hidden" name="payload" value={payload} />

      {def.canHide && (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-uk-line bg-uk-card p-5">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                visible ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400" : "bg-uk-surface-3 text-uk-muted"
              )}
            >
              {visible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </span>
            <div>
              <p className="text-sm font-semibold text-uk-heading">
                {visible ? `Shown on ${where}` : `Hidden from ${where}`}
              </p>
              <p className="text-xs text-uk-muted">Hiding keeps the text, so you can switch it back on any time.</p>
            </div>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-uk-heading">
            <input
              type="checkbox"
              checked={visible}
              onChange={(e) => setVisible(e.target.checked)}
              className="h-4 w-4 accent-[var(--uk-blue)]"
            />
            Show this section
          </label>
        </section>
      )}

      <section className="space-y-6 rounded-2xl border border-uk-line bg-uk-card p-6">
        {def.fields.map((f) => (
          <Field
            key={f.key}
            field={f}
            value={values[f.key]}
            errors={errors}
            onChange={(v) => setValues((prev) => ({ ...prev, [f.key]: v }))}
          />
        ))}
      </section>
    </>
  );
}

export function SectionEditor({
  def, initial, visible, version, save, reset, where = "the home page",
}: {
  def: SectionDef;
  initial: SectionValues;
  visible: boolean;
  /** changes whenever the stored copy changes (its last-saved time) */
  version: string;
  /** server action, already bound to this section */
  save: (prev: HomeSectionState, formData: FormData) => Promise<HomeSectionState>;
  /** server action that restores the built-in text; omit when there is none */
  reset?: () => Promise<HomeSectionState>;
  /** where the content shows, for the visibility note ("the home page", "every page") */
  where?: string;
}) {
  const [state, action, saving] = useActionState<HomeSectionState, FormData>(save, {});
  const [resetting, startReset] = useTransition();
  const [resetState, setResetState] = useState<HomeSectionState>({});
  const [dirty, setDirty] = useState(false);
  const latest = (resetState.nonce ?? 0) > (state.nonce ?? 0) ? resetState : state;
  const errors = latest.status === "error" ? (latest.errors ?? {}) : {};
  useResultToast(latest);
  const busy = saving || resetting;

  // Warn before leaving the page with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return (
    <form action={action} className="space-y-6" noValidate>
      {latest.message && (
        <div
          role={latest.status === "error" ? "alert" : "status"}
          className={
            latest.status === "error"
              ? "flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              : "flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300"
          }
        >
          {latest.status === "error" ? <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> : <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />}
          {latest.message}
        </div>
      )}

      <EditorBody
        key={version}
        def={def}
        initial={initial}
        initialVisible={visible}
        errors={errors}
        onDirty={setDirty}
        where={where}
      />

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-uk-line bg-uk-card/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        {reset ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (window.confirm(`Restore "${def.label}" to its original text? Your saved changes to this section will be removed.`)) {
                startReset(async () => setResetState(await reset()));
              }
            }}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading disabled:opacity-60"
          >
            {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Restore original text
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          {dirty && <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Unsaved changes</span>}
          <button
            type="submit"
            disabled={busy}
            className="btn-sheen inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-5 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : "Save section"}
          </button>
        </div>
      </div>
    </form>
  );
}
