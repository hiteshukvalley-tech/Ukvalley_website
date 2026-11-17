"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArchiveRestore, Loader2, Trash2 } from "lucide-react";
import { confirmDialog } from "@/components/admin/confirm-dialog";
import { toast } from "@/components/admin/toast";
import { purgeCareerAction, restoreCareerAction } from "../actions";

const btn = "inline-flex h-8 items-center gap-1.5 rounded-lg border border-uk-line px-2.5 text-xs font-semibold transition-colors hover:bg-uk-surface-2 disabled:opacity-50";

/** Restore / Delete forever for one deleted opening. */
export function RecycleActions({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => ReturnType<typeof restoreCareerAction>, success: string) =>
    start(async () => {
      const r = await fn();
      toast.result(r, success);
      if (r.ok) router.refresh();
    });

  return (
    <div className="inline-flex items-center gap-2">
      {pending && <Loader2 className="h-4 w-4 animate-spin text-uk-muted" aria-label="Working" />}
      <button type="button" disabled={pending} className={`${btn} text-uk-blue`} onClick={() => run(() => restoreCareerAction(id), `“${name}” restored to Careers.`)}>
        <ArchiveRestore className="h-3.5 w-3.5" /> Restore
      </button>
      <button
        type="button"
        disabled={pending}
        className={`${btn} text-rose-600 dark:text-rose-400`}
        onClick={async () => {
          if (await confirmDialog(`Delete “${name}” forever? It can't be restored after this. Its applications are kept.`)) {
            run(() => purgeCareerAction(id), `“${name}” deleted forever.`);
          }
        }}
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete forever
      </button>
    </div>
  );
}
