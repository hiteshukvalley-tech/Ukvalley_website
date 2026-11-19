"use client";

import { useActionState, useState, useTransition } from "react";
import { BellRing, CalendarClock, CalendarX, Loader2 } from "lucide-react";
import { toast } from "@/components/admin/toast";
import { confirmDialog } from "@/components/admin/confirm-dialog";
import type { InterviewStatus } from "@/lib/ai-interview/types";
import { cancelAction, interviewToolAction, reminderAction, rescheduleAction, type ActionResult } from "./actions";

// Reschedule / cancel / remind buttons and the HR tools on one interview.

const btn = "inline-flex h-8 items-center gap-1.5 rounded-lg border border-uk-line px-2.5 text-xs font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading disabled:opacity-50";
const input = "h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm text-uk-body outline-none focus-visible:border-ring";

/** "2026-11-24T11:00" in India time, for a datetime-local field. */
const toLocalIst = (iso: string | null) => {
  const d = iso ? new Date(iso) : new Date(Date.now() + 24 * 3600_000);
  return new Date(d.getTime() + 330 * 60_000).toISOString().slice(0, 16);
};

export function InterviewControls({ id, status, startsAt, compact = false }: { id: string; status: InterviewStatus; startsAt: string | null; compact?: boolean }) {
  const [open, setOpen] = useState<"" | "reschedule" | "cancel">("");
  // Each form shows its result as a toast and closes when it succeeds.
  const withResult = (fn: typeof rescheduleAction) => async (prev: ActionResult | null, f: FormData) => {
    const r = await fn(prev, f);
    toast.result(r, "Done.");
    if (r.ok) setOpen("");
    return r;
  };
  const [, reschedule, rPending] = useActionState(withResult(rescheduleAction), null);
  const [, cancel, cPending] = useActionState(withResult(cancelAction), null);
  const [reminding, startRemind] = useTransition();

  const canSchedule = !["completed", "cancelled", "in_progress"].includes(status);
  const canCancel = ["unscheduled", "scheduled", "accommodation", "interrupted", "missed", "expired"].includes(status);
  const canRemind = startsAt && ["scheduled", "interrupted", "accommodation"].includes(status);

  return (
    <div className={compact ? "flex flex-wrap justify-end gap-1.5" : "space-y-3"}>
      <div className="flex flex-wrap gap-1.5">
        {canSchedule && (
          <button type="button" className={btn} onClick={() => setOpen(open === "reschedule" ? "" : "reschedule")} aria-expanded={open === "reschedule"}>
            <CalendarClock className="h-3.5 w-3.5" /> {startsAt ? "Reschedule" : "Schedule"}
          </button>
        )}
        {canRemind && (
          <button type="button" className={btn} disabled={reminding} onClick={() => startRemind(async () => toast.result(await reminderAction(id), "Reminder queued."))}>
            {reminding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BellRing className="h-3.5 w-3.5" />} Remind
          </button>
        )}
        {canCancel && (
          <button type="button" className={btn} onClick={() => setOpen(open === "cancel" ? "" : "cancel")} aria-expanded={open === "cancel"}>
            <CalendarX className="h-3.5 w-3.5" /> Cancel
          </button>
        )}
      </div>
      {open === "reschedule" && (
        <form action={reschedule} className="flex flex-wrap items-end gap-2 rounded-xl border border-uk-line bg-uk-surface-2/50 p-3 text-left">
          <input type="hidden" name="id" value={id} />
          <label className="text-xs font-medium text-uk-muted">
            New time (India time)
            <input type="datetime-local" name="startsAt" required defaultValue={toLocalIst(startsAt)} className={`mt-1 block ${input}`} />
          </label>
          <button type="submit" disabled={rPending} className="h-9 rounded-lg bg-uk-blue px-3 text-sm font-semibold text-uk-white disabled:opacity-60">
            {rPending ? "Saving…" : "Save and notify"}
          </button>
          <p className="w-full text-xs text-uk-muted">The candidate gets a new link, the old one stops working, and reminders and the calendar event move to the new time.</p>
        </form>
      )}
      {open === "cancel" && (
        <form action={cancel} className="flex flex-wrap items-end gap-2 rounded-xl border border-uk-line bg-uk-surface-2/50 p-3 text-left">
          <input type="hidden" name="id" value={id} />
          <label className="min-w-56 flex-1 text-xs font-medium text-uk-muted">
            Reason (shown to the candidate, optional)
            <input name="reason" maxLength={300} className={`mt-1 block w-full ${input}`} />
          </label>
          <button type="submit" disabled={cPending} className="h-9 rounded-lg bg-red-600 px-3 text-sm font-semibold text-white disabled:opacity-60">
            {cPending ? "Cancelling…" : "Cancel interview"}
          </button>
        </form>
      )}
    </div>
  );
}

type Tool = Parameters<typeof interviewToolAction>[1];

export function ToolButton({ id, tool, label, confirm, icon }: { id: string; tool: Tool; label: string; confirm?: string; icon?: React.ReactNode }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className={btn}
      disabled={pending}
      onClick={() =>
        start(async () => {
          if (confirm && !(await confirmDialog(confirm))) return;
          toast.result(await interviewToolAction(id, tool), "Done.");
        })
      }
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      {label}
    </button>
  );
}
