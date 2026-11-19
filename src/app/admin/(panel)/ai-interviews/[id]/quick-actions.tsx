"use client";

import { useActionState, useState, useTransition } from "react";
import { CalendarPlus, Clock, Copy, Loader2, Mail, RefreshCw, RotateCcw, Send } from "lucide-react";
import { toast } from "@/components/admin/toast";
import { confirmDialog } from "@/components/admin/confirm-dialog";
import { EXTEND_HOURS, HR_MESSAGE_BODY_MAX, HR_MESSAGE_SUBJECT_MAX } from "@/lib/ai-interview/types";
import { extendLinkAction, messageCandidateAction, quickToolAction, revealLinkAction, type ActionResult, type QuickTool } from "../actions";

// "Quick actions" on one interview: the everyday fixes HR needs without
// rescheduling from scratch. Each button shows only when it applies; the
// server checks again and explains when it doesn't.

const btn = "inline-flex h-8 items-center gap-1.5 rounded-lg border border-uk-line px-2.5 text-xs font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading disabled:opacity-50";
const field = "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm text-uk-body outline-none focus-visible:border-ring";

export type QuickActionsProps = {
  id: string;
  candidateEmail: string;
  /** what applies now (worked out on the server from the interview) */
  can: { copyLink: boolean; resend: boolean; extend: boolean; grantResume: boolean; regenerate: boolean; autoSchedule: boolean };
  resumes: number;
  maxResumes: number;
};

export function QuickActions({ id, candidateEmail, can, resumes, maxResumes }: QuickActionsProps) {
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string>("");
  const [hours, setHours] = useState<number>(24);
  const [writing, setWriting] = useState(false);
  const [, sendMessage, sending] = useActionState(async (prev: ActionResult | null, f: FormData) => {
    const r = await messageCandidateAction(prev, f);
    toast.result(r, "Sent.");
    if (r.ok) setWriting(false);
    return r;
  }, null);

  const run = (key: string, fn: () => Promise<ActionResult>, confirm?: string) =>
    start(async () => {
      if (confirm && !(await confirmDialog(confirm))) return;
      setBusy(key);
      try {
        toast.result(await fn(), "Done.");
      } finally {
        setBusy("");
      }
    });
  const tool = (t: QuickTool, confirm?: string) => run(t, () => quickToolAction(id, t), confirm);
  const spin = (key: string, icon: React.ReactNode) => (pending && busy === key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {can.copyLink && (
          <button
            type="button"
            className={btn}
            disabled={pending}
            onClick={() =>
              start(async () => {
                setBusy("link");
                const r = await revealLinkAction(id);
                setBusy("");
                if (r.ok && r.link) {
                  try {
                    await navigator.clipboard.writeText(r.link);
                    toast.success("Interview link copied. Share it only with the candidate.");
                  } catch {
                    // Clipboard blocked (no permission): show it to copy by hand.
                    window.prompt("The candidate's interview link:", r.link);
                  }
                } else toast.result(r, "");
              })
            }
          >
            {spin("link", <Copy className="h-3.5 w-3.5" />)} Copy candidate link
          </button>
        )}
        {can.resend && (
          <button type="button" className={btn} disabled={pending} onClick={() => tool("resend_invite")}>
            {spin("resend_invite", <Send className="h-3.5 w-3.5" />)} Send invitation again
          </button>
        )}
        {can.autoSchedule && (
          <button type="button" className={btn} disabled={pending} onClick={() => tool("auto_schedule", "Schedule at the next free working time and send the candidate a new link?")}>
            {spin("auto_schedule", <CalendarPlus className="h-3.5 w-3.5" />)} Next free time
          </button>
        )}
        {can.grantResume && (
          <button type="button" className={btn} disabled={pending} onClick={() => tool("grant_resume")} title={`${resumes} of ${maxResumes} resumes used`}>
            {spin("grant_resume", <RotateCcw className="h-3.5 w-3.5" />)} Allow one more resume
          </button>
        )}
        {can.regenerate && (
          <button type="button" className={btn} disabled={pending} onClick={() => tool("regenerate", "Throw away the prepared questions and write new ones (using this job's current settings)?")}>
            {spin("regenerate", <RefreshCw className="h-3.5 w-3.5" />)} New questions
          </button>
        )}
        <button type="button" className={btn} onClick={() => setWriting((w) => !w)} aria-expanded={writing}>
          <Mail className="h-3.5 w-3.5" /> Email the candidate
        </button>
      </div>

      {can.extend && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Clock className="h-3.5 w-3.5 text-uk-muted" />
          <label htmlFor={`extend-${id}`} className="text-uk-muted">Keep the link open</label>
          <select id={`extend-${id}`} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs text-uk-body outline-none focus-visible:border-ring">
            {EXTEND_HOURS.map((h) => <option key={h} value={h}>{h} hours longer</option>)}
          </select>
          <button type="button" className={btn} disabled={pending} onClick={() => run("extend", () => extendLinkAction(id, hours))}>
            {spin("extend", null)} Extend
          </button>
        </div>
      )}

      {writing && (
        <form action={sendMessage} className="space-y-2 rounded-xl border border-uk-line bg-uk-surface-2/50 p-3">
          <input type="hidden" name="id" value={id} />
          <p className="text-xs text-uk-muted">To {candidateEmail}, from the HR mail server. Logged with the notifications.</p>
          <label className="block text-xs font-medium text-uk-muted">
            Subject
            <input name="subject" required minLength={3} maxLength={HR_MESSAGE_SUBJECT_MAX} className={`mt-1 ${field}`} />
          </label>
          <label className="block text-xs font-medium text-uk-muted">
            Message
            <textarea name="body" required minLength={5} maxLength={HR_MESSAGE_BODY_MAX} rows={5} className={`mt-1 ${field}`} />
          </label>
          <button type="submit" disabled={sending} className="h-9 rounded-lg bg-uk-blue px-3 text-sm font-semibold text-uk-white disabled:opacity-60">
            {sending ? "Sending…" : "Send email"}
          </button>
        </form>
      )}
    </div>
  );
}
