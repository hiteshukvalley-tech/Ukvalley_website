"use client";

import { useActionState, useEffect } from "react";
import { toast } from "@/components/admin/toast";
import { createInterviewAction } from "./actions";

export function CreateInterviewForm({ applicationId }: { applicationId: string }) {
  const [state, action, pending] = useActionState(createInterviewAction, null);
  useEffect(() => void (state && toast.result(state, "Done.")), [state]);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="applicationId" value={applicationId} />
      <label className="text-xs font-medium text-uk-muted">
        Interview time (India time, optional)
        <input type="datetime-local" name="startsAt" className="mt-1 block h-10 rounded-lg border border-input bg-transparent px-3 text-sm text-uk-body outline-none focus-visible:border-ring" />
      </label>
      <label className="flex items-center gap-2 pb-2.5 text-sm text-uk-body">
        <input type="checkbox" name="textMode" className="h-4 w-4 accent-[var(--uk-blue)]" /> Written (no camera)
      </label>
      <button type="submit" disabled={pending} className="h-10 rounded-lg bg-uk-blue px-4 text-sm font-semibold text-uk-white disabled:opacity-60">
        {pending ? "Starting…" : "Start AI interview"}
      </button>
      {state && !state.ok && <p role="alert" className="w-full text-sm text-destructive">{state.message}</p>}
    </form>
  );
}
