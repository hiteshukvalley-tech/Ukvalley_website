"use client";

import { useState, useTransition } from "react";
import { CircleAlert, CircleCheck, Download, Loader2 } from "lucide-react";
import { runMigrationAction, type MigrationResult } from "./actions";

/** Shared by the "import all" button and each row's own button. */
function useMigration() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<MigrationResult>();
  const run = (keys?: string[]) =>
    start(async () => {
      setResult(undefined);
      setResult(await runMigrationAction(keys));
    });
  return { pending, result, run };
}

export function ImportAllButton({ pendingCount }: { pendingCount: number }) {
  const { pending, result, run } = useMigration();
  const done = pendingCount === 0;

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={pending || done}
        onClick={() => run()}
        className="btn-sheen inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-5 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {pending ? "Importing…" : done ? "Everything is imported" : `Import ${pendingCount} remaining section${pendingCount === 1 ? "" : "s"}`}
      </button>

      {result && !result.ok && result.message && (
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {result.message}
        </p>
      )}
      {result?.outcomes && (
        <ul role="status" className="space-y-1.5 rounded-xl border border-uk-line bg-uk-card p-4 text-sm">
          {result.outcomes.map((o) => (
            <li key={o.key} className="flex items-start gap-2">
              {o.status === "failed" ? (
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              ) : (
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              )}
              <span className="min-w-0 break-words text-uk-body">
                <span className="font-medium text-uk-heading">{o.label}</span>
                {o.status === "imported" && ` — imported ${o.imported} item${o.imported === 1 ? "" : "s"}.`}
                {o.status === "skipped" && " — already in the database, left unchanged."}
                {o.status === "failed" && ` — failed: ${o.error}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ImportRowButton({ sectionKey, label }: { sectionKey: string; label: string }) {
  const { pending, result, run } = useMigration();
  const failed = result?.outcomes?.find((o) => o.status === "failed");
  const error = failed?.error ?? (result && !result.ok ? result.message : undefined);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => run([sectionKey])}
        aria-label={`Import ${label}`}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-uk-line px-3 text-xs font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        Import
      </button>
      {error && <p role="alert" className="max-w-56 text-right text-xs text-destructive">{error}</p>}
    </div>
  );
}
