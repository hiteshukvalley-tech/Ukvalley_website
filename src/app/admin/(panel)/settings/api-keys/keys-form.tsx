"use client";

import { useActionState, useState, useTransition } from "react";
import { CheckCircle2, CircleAlert, KeyRound, Loader2, Lock, Save, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/admin/password-input";
import { AdminSelect } from "@/components/admin/admin-select";
import { useResultToast } from "@/components/admin/toast";
import { KEY_DEFS, KEY_GROUPS, type KeyDef, type KeyGroup, type KeyStatus } from "@/lib/integration-keys-shared";
import { saveKeysAction, testKeysAction, type KeysState } from "./actions";

const SOURCE: Record<KeyStatus["source"], { label: string; cls: string }> = {
  settings: { label: "Saved here", cls: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" },
  env: { label: "From .env", cls: "bg-uk-blue/10 text-uk-blue" },
  default: { label: "Default", cls: "bg-uk-surface-2 text-uk-muted" },
  none: { label: "Not set", cls: "bg-amber-500/12 text-amber-700 dark:text-amber-300" },
};

const TESTABLE: Partial<Record<KeyGroup, "claude" | "speech" | "google" | "whatsapp" | "recordings">> = {
  claude: "claude",
  speech: "speech",
  google: "google",
  whatsapp: "whatsapp",
  recordings: "recordings",
};

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "");

const btn =
  "inline-flex h-10 items-center gap-2 rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading disabled:opacity-60";

export function KeysForm({ statuses }: { statuses: KeyStatus[] }) {
  const [state, action, saving] = useActionState<KeysState, FormData>(saveKeysAction, {});
  useResultToast(state);
  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  const byName = new Map(statuses.map((s) => [s.name, s]));

  return (
    // Remounted after each save (key), so the boxes show what is saved now and secret boxes are empty again.
    <form key={state.nonce ?? 0} action={action} className="space-y-6" autoComplete="off">
      {KEY_GROUPS.map((g) => (
        <section key={g.key} className="rounded-2xl border border-uk-line bg-uk-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-2xl">
              <h2 className="font-heading text-lg font-semibold text-uk-heading">{g.title}</h2>
              <p className="mt-1 text-sm text-uk-muted">{g.description}</p>
            </div>
            {TESTABLE[g.key] && <TestButton service={TESTABLE[g.key]!} />}
          </div>
          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            {KEY_DEFS.filter((d) => d.group === g.key).map((d) => (
              <KeyField key={d.name} def={d} status={byName.get(d.name)!} error={errors[d.name]} />
            ))}
          </div>
        </section>
      ))}

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-uk-line bg-uk-card/95 p-4 shadow-lg backdrop-blur">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-5 text-sm font-semibold text-uk-white transition-colors hover:bg-uk-blue-bright disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {saving ? "Saving…" : "Save keys"}
        </button>
        <p className="text-xs text-uk-muted">
          Secret boxes are always empty: type a value only to add or replace one. Changes are used at once, with no restart.
        </p>
        {state.status === "error" && state.message && (
          <p role="alert" className="w-full text-sm font-medium text-destructive">{state.message}</p>
        )}
      </div>
    </form>
  );
}

function KeyField({ def, status, error }: { def: KeyDef; status: KeyStatus; error?: string }) {
  const id = `k-${def.name}`;
  const src = SOURCE[status.source];
  const canRemove = status.source === "settings" || status.unreadable;
  const describedBy = [error ? `${id}-err` : "", `${id}-hint`].filter(Boolean).join(" ");

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor={id} className="flex items-center gap-1.5 text-uk-heading">
          {def.secret && <KeyRound className="h-3.5 w-3.5 text-uk-muted" aria-hidden />}
          {def.label}
        </Label>
        <span className={`rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ${src.cls}`}>{src.label}</span>
      </div>

      <p className="flex flex-wrap items-center gap-x-2 text-xs text-uk-muted">
        <span className="font-mono text-uk-body">{def.name}</span>
        {status.display && def.secret && <span>· in use: <span className="font-mono">{status.display}</span></span>}
        {status.display && !def.secret && status.source !== "settings" && <span>· in use: <span className="font-mono">{status.display}</span></span>}
        {status.updatedAt && <span>· changed {when(status.updatedAt)} by {status.updatedBy}</span>}
      </p>

      {status.unreadable && (
        <p className="flex items-start gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
          <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> The saved value can't be read (the server's AUTH_SECRET changed). Enter it again.
        </p>
      )}

      {status.locked ? (
        <p className="flex items-start gap-1.5 rounded-lg bg-uk-surface-2 px-3 py-2 text-xs text-uk-body">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Locked: recordings are stored with the current key. It can be changed only while no recordings are stored.
        </p>
      ) : def.options ? (
        <AdminSelect
          id={id}
          name={`v.${def.name}`}
          options={def.options}
          defaultValue={status.savedValue || status.display || def.options[0].value}
          invalid={!!error}
          describedBy={describedBy}
        />
      ) : def.secret ? (
        <PasswordInput
          id={id}
          name={`v.${def.name}`}
          placeholder={status.source === "none" ? def.placeholder ?? "Enter the value" : "Enter a new value to replace it"}
          autoComplete="new-password"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
      ) : (
        <Input
          id={id}
          name={`v.${def.name}`}
          defaultValue={status.savedValue}
          placeholder={status.source !== "settings" && status.display ? status.display : def.placeholder}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="h-10 font-mono text-sm"
        />
      )}

      {error && (
        <p id={`${id}-err`} role="alert" className="text-xs font-medium text-destructive">{error}</p>
      )}
      <p id={`${id}-hint`} className="text-xs text-uk-muted">
        {def.hint}
        {!def.secret && !def.options && canRemove ? " Empty the box to stop using the saved value." : ""}
      </p>

      {canRemove && def.secret && !status.locked && (
        <label className="flex items-center gap-2 text-xs text-uk-body">
          <input type="checkbox" name={`rm.${def.name}`} className="h-3.5 w-3.5 accent-[var(--uk-blue)]" />
          Remove the saved value{status.source === "settings" ? " (falls back to .env, if set)" : ""}
        </label>
      )}
    </div>
  );
}

function TestButton({ service }: { service: "claude" | "speech" | "google" | "whatsapp" | "recordings" }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<KeysState>({});
  useResultToast(result);
  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" className={btn} disabled={pending} onClick={() => start(async () => setResult(await testKeysAction(service)))}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />} Test saved keys
      </button>
      {result.message && (
        <p role="status" className={`flex max-w-xs items-start gap-1 text-right text-xs ${result.status === "error" ? "text-destructive" : "text-emerald-700 dark:text-emerald-400"}`}>
          {result.status === "error" ? <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
          {result.message}
        </p>
      )}
    </div>
  );
}
