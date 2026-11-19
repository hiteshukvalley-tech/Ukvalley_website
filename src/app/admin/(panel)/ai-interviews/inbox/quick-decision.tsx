"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "@/components/admin/toast";
import { decisionAction } from "../actions";

const btn = "inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium transition-colors disabled:opacity-50";

/**
 * One-click HR decisions on an "Awaiting decision" card (as in GrowthValley):
 * Next round, Shortlist, Reject or On hold, with an optional note. The
 * application's stage moves with it, and the card leaves the inbox.
 */
export function QuickDecision({ id }: { id: string }) {
  const [state, decide, pending] = useActionState(decisionAction, null);
  const [note, setNote] = useState(false);
  useEffect(() => {
    if (!state) return;
    toast.result(state, "Decision saved.");
    // The sidebar badge counts the inbox: tell it to refresh.
    if (state.ok) window.dispatchEvent(new Event("ai-inbox-changed"));
  }, [state]);

  return (
    <form action={decide} className="mt-4 space-y-2 border-t border-uk-line pt-3">
      <input type="hidden" name="id" value={id} />
      {note && (
        <textarea name="note" rows={2} maxLength={1000} placeholder="Note for the team (optional)" className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring" />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" name="decision" value="next_round" disabled={pending} className={`${btn} bg-uk-blue text-uk-white hover:opacity-90`}>Next round</button>
        <button type="submit" name="decision" value="shortlist" disabled={pending} className={`${btn} border border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300`}>Shortlist</button>
        <button type="submit" name="decision" value="move_stage" disabled={pending} className={`${btn} border border-amber-500/40 text-amber-800 hover:bg-amber-500/10 dark:text-amber-300`}>Hold</button>
        <button type="submit" name="decision" value="reject" disabled={pending} className={`${btn} border border-red-500/40 text-red-700 hover:bg-red-500/10 dark:text-red-300`}>Reject</button>
        {/* "Hold" moves the application to On Hold. */}
        <input type="hidden" name="stage" value="on-hold" />
        {!note && <button type="button" onClick={() => setNote(true)} className="text-xs text-uk-muted hover:text-uk-heading">Add a note</button>}
      </div>
    </form>
  );
}
