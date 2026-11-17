"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { CalendarClock, Loader2, X, XCircle } from "lucide-react";
import { toast } from "@/components/admin/toast";
import { OFFICE_ADDRESS } from "@/lib/application-status-emails";
import { cancelInterviewAction, rescheduleInterviewAction, type InterviewActionResult } from "./actions";

/** Tells the 30-minute reminder to reload the day's interviews. */
export const INTERVIEWS_CHANGED = "uk:interviews-changed";

const input =
  "h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-[invalid=true]:border-destructive";
const label = "mb-1 block text-sm font-medium text-uk-heading";
const btn =
  "inline-flex h-8 items-center gap-1.5 rounded-lg border border-uk-line px-2.5 text-xs font-semibold transition-colors hover:bg-uk-surface-2";

type Props = {
  applicationId: string;
  name: string;
  /** the interview as it stands, to fill the Reschedule form */
  date: string;
  time: string;
  mode: string;
  venue: string;
  cancelled: boolean;
  /** today in India (YYYY-MM-DD), the earliest date the form offers */
  today: string;
};

/** Reschedule and Cancel buttons for one interview, each opening a small form. */
export function InterviewActions(p: Props) {
  const [open, setOpen] = useState<"reschedule" | "cancel" | null>(null);
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
      <button type="button" onClick={() => setOpen("reschedule")} className={`${btn} text-uk-blue`}>
        <CalendarClock className="h-3.5 w-3.5" /> {p.cancelled ? "Set new time" : "Reschedule"}
      </button>
      {!p.cancelled && (
        <button type="button" onClick={() => setOpen("cancel")} className={`${btn} text-rose-600 dark:text-rose-400`}>
          <XCircle className="h-3.5 w-3.5" /> Cancel
        </button>
      )}
      {open === "reschedule" && <RescheduleForm {...p} onClose={() => setOpen(null)} />}
      {open === "cancel" && <CancelForm {...p} onClose={() => setOpen(null)} />}
    </div>
  );
}

/** Runs an action, shows its result, and refreshes the lists and the reminder. */
function useSubmit(run: (fd: FormData) => Promise<InterviewActionResult>, onDone: () => void) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await run(fd).catch((err: unknown) => ({ ok: false, message: err instanceof Error ? err.message : undefined }) as InterviewActionResult);
      setErrors(r.errors ?? {});
      if (r.errors && Object.keys(r.errors).length) return;
      toast.result(r, "Saved.");
      if (r.ok) {
        window.dispatchEvent(new Event(INTERVIEWS_CHANGED));
        router.refresh();
        onDone();
      }
    });
  };
  return { pending, errors, submit };
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  // focus the first field once, when the form opens
  useEffect(() => box.current?.querySelector<HTMLElement>("input, select, textarea")?.focus(), []);
  // On <body>, so a struck-out (faded) interview row doesn't fade the form too.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={box} role="dialog" aria-modal="true" aria-label={title} data-lenis-prevent className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-uk-line bg-uk-card p-5 text-left shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-semibold text-uk-heading">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-uk-muted hover:bg-uk-surface-2 hover:text-uk-heading">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

const Err = ({ msg }: { msg?: string }) => (msg ? <p className="mt-1 text-xs text-destructive">{msg}</p> : null);

function Notify({ error, text }: { error?: string; text: string }) {
  return (
    <div>
      <label className="flex items-start gap-2 text-sm text-uk-body">
        <input type="checkbox" name="notify" value="1" defaultChecked className="mt-0.5 h-4 w-4 accent-[var(--uk-blue)]" />
        {text}
      </label>
      <Err msg={error} />
    </div>
  );
}

function Footer({ pending, onClose, submit, danger = false }: { pending: boolean; onClose: () => void; submit: string; danger?: boolean }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button type="button" onClick={onClose} className="h-10 rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body hover:bg-uk-surface-2">
        Close
      </button>
      <button
        type="submit"
        disabled={pending}
        className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-uk-white disabled:opacity-60 ${
          danger ? "bg-rose-600 hover:bg-rose-700" : "bg-uk-blue hover:bg-uk-blue-bright"
        }`}
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {submit}
      </button>
    </div>
  );
}

function RescheduleForm({ applicationId, name, date, time, mode, venue, today, onClose }: Props & { onClose: () => void }) {
  const { pending, errors, submit } = useSubmit((fd) => rescheduleInterviewAction(applicationId, fd), onClose);
  const [place, setPlace] = useState(venue);
  // Offline: the office address goes in the venue (when empty or still a meeting link); back to Online, it comes out.
  const onMode = (m: string) => {
    if (m === "Offline" && (!place.trim() || /^https?:\/\//i.test(place.trim()))) setPlace(OFFICE_ADDRESS);
    else if (m === "Online" && place === OFFICE_ADDRESS) setPlace("");
  };
  return (
    <Modal title={`Reschedule interview: ${name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="ri-date">New date</label>
            <input id="ri-date" name="date" type="date" min={today} defaultValue={date >= today ? date : today} required aria-invalid={!!errors.date} className={input} />
            <Err msg={errors.date} />
          </div>
          <div>
            <label className={label} htmlFor="ri-time">New time</label>
            <input id="ri-time" name="time" type="time" defaultValue={time} required aria-invalid={!!errors.time} className={input} />
            <Err msg={errors.time} />
          </div>
        </div>
        <div>
          <label className={label} htmlFor="ri-mode">Mode</label>
          <select id="ri-mode" name="mode" defaultValue={mode} onChange={(e) => onMode(e.target.value)} aria-invalid={!!errors.mode} className={input}>
            <option value="">Keep as it is</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
          </select>
          <Err msg={errors.mode} />
        </div>
        <div>
          <label className={label} htmlFor="ri-venue">Venue / meeting link</label>
          <input id="ri-venue" name="venue" value={place} onChange={(e) => setPlace(e.target.value)} maxLength={500} placeholder="Leave as it is, or enter the new one" className={input} />
        </div>
        <div>
          <label className={label} htmlFor="ri-reason">Reason (optional)</label>
          <input id="ri-reason" name="reason" maxLength={500} placeholder="e.g. Interviewer unavailable at the earlier time" className={input} />
        </div>
        <Notify error={errors.notify} text="Email the applicant the new date and time" />
        <Footer pending={pending} onClose={onClose} submit="Reschedule" />
      </form>
    </Modal>
  );
}

function CancelForm({ applicationId, name, onClose }: Props & { onClose: () => void }) {
  const { pending, errors, submit } = useSubmit((fd) => cancelInterviewAction(applicationId, fd), onClose);
  return (
    <Modal title={`Cancel interview: ${name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <p className="text-sm text-uk-body">
          The interview stays in the list marked <strong>Cancelled</strong>. The application&apos;s status doesn&apos;t change, and you can set a new time later.
        </p>
        <div>
          <label className={label} htmlFor="ci-reason">Reason (optional)</label>
          <input id="ci-reason" name="reason" maxLength={500} placeholder="e.g. Position on hold" className={input} />
        </div>
        <Notify error={errors.notify} text="Email the applicant that the interview is cancelled" />
        <Footer pending={pending} onClose={onClose} submit="Cancel interview" danger />
      </form>
    </Modal>
  );
}
