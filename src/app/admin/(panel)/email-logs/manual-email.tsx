"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Loader2, MailPlus, Send, X } from "lucide-react";
import { FormField, FormSelect, FormTextarea } from "@/components/admin/form";
import { useResultToast } from "@/components/admin/toast";
import { EMAIL_STATUSES, applicationStatusLabel, isEmailStatus } from "@/lib/applications-validation";
import { STATUS_EMAIL_BODY_MAX, STATUS_EMAIL_SUBJECT_MAX } from "@/lib/application-status-emails";
import { sendManualEmailAction, type ManualEmailState, type ManualEmailValues } from "./actions";

/** Who the email is for, when it is opened from a row of the log. */
export type ManualEmailPrefill = { to: string; name: string; position: string; status: string };

// Applicants are emailed only about these statuses.
const statusOptions = EMAIL_STATUSES.map((s) => ({ value: s, label: applicationStatusLabel[s] }));

const blank: ManualEmailValues = { to: "", name: "", position: "", status: "on-hold", subject: "", message: "", closing: "" };

// One form for the whole page: the header button and every row's button open it
// through this tiny store (so the field ids stay unique).
let openWith: ((p?: ManualEmailPrefill) => void) | null = null;

/** Opens the Manual email form, optionally filled in for an applicant. */
export function ManualEmailButton({ prefill, compact }: { prefill?: ManualEmailPrefill; compact?: boolean }) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={() => openWith?.(prefill)}
        title={prefill ? `Email ${prefill.name}` : "Manual email"}
        aria-label={prefill ? `Email ${prefill.name}` : "Manual email"}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-uk-line text-uk-body transition-colors hover:border-uk-blue/50 hover:text-uk-blue"
      >
        <MailPlus className="h-4 w-4" />
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => openWith?.(prefill)}
      className="btn-sheen inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-4 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright"
    >
      <MailPlus className="h-4 w-4" /> Manual email
    </button>
  );
}

/**
 * The "Manual email" form in a dialog: HR types the recipient, the status the
 * email is about, subject and message; it goes out in the branded HR layout
 * and is added to the log. Mount once on the page.
 */
export function ManualEmailDialog() {
  const [open, setOpen] = useState(false);
  const [state, action, sending] = useActionState<ManualEmailState, FormData>(sendManualEmailAction, {});
  useResultToast(state);
  // What the inputs start from on this opening, and the last result before it
  // (an older failed send must not show its errors in a new form).
  const [opening, setOpening] = useState<{ values: ManualEmailValues; n: number; before?: number }>({ values: blank, n: 0 });
  const stateNonce = useRef(state.nonce);
  useEffect(() => {
    stateNonce.current = state.nonce;
  }, [state.nonce]);

  useEffect(() => {
    openWith = (p) => {
      const values = p ? { ...blank, ...p, status: isEmailStatus(p.status) ? p.status : blank.status } : blank;
      setOpening((o) => ({ values, n: o.n + 1, before: stateNonce.current }));
      setOpen(true);
    };
    return () => {
      openWith = null;
    };
  }, []);

  // Close after a successful send; a failed one keeps the form as typed.
  const [handled, setHandled] = useState(state.nonce);
  if (state.nonce !== handled) {
    setHandled(state.nonce);
    if (state.status === "sent") setOpen(false);
  }

  const failed = state.status === "error" && state.nonce !== opening.before;
  const values = failed && state.values ? state.values : opening.values;
  const errors = failed ? (state.errors ?? {}) : {};

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !sending && setOpen(o)}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[60] bg-uk-heading/50 backdrop-blur-sm dark:bg-[#070511]/70" />
        <Dialog.Viewport className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6">
          <Dialog.Popup className="w-full max-w-2xl rounded-2xl border border-uk-line bg-uk-card shadow-premium-lg outline-none">
            <div className="flex items-start justify-between gap-4 border-b border-uk-line px-6 py-4">
              <div>
                <Dialog.Title className="font-heading text-lg font-semibold text-uk-heading">Manual email</Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-uk-muted">
                  Write an email to an applicant. It goes out from Ukvalley HR Team in the usual branded layout, replies go to the HR email, and it is added to the log.
                </Dialog.Description>
              </div>
              <Dialog.Close aria-label="Close" className="rounded-lg p-1.5 text-uk-muted transition-colors hover:bg-uk-surface-2 hover:text-uk-heading">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>

            {/* key remounts the inputs (their starting values) on each opening and after a failed send */}
            <form action={action} key={`${opening.n}-${failed ? state.nonce : 0}`} noValidate className="space-y-5 px-6 py-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Applicant email" name="to" type="email" inputMode="email" required defaultValue={values.to} error={errors.to} placeholder="applicant@example.com" />
                <FormField label="Applicant name" name="name" required defaultValue={values.name} error={errors.name} placeholder="Full name" />
                <FormField label="Position" name="position" defaultValue={values.position} error={errors.position} placeholder="e.g. React Developer" hint="Optional." />
                <FormSelect label="Status" name="status" required defaultValue={values.status} error={errors.status} options={statusOptions} hint="Shown as the badge at the top of the email." />
                <div className="sm:col-span-2">
                  <FormField label="Subject" name="subject" required defaultValue={values.subject} error={errors.subject} maxLength={STATUS_EMAIL_SUBJECT_MAX} />
                </div>
                <FormTextarea
                  label="Message"
                  name="message"
                  required
                  full
                  rows={7}
                  defaultValue={values.message}
                  error={errors.message}
                  maxLength={STATUS_EMAIL_BODY_MAX}
                  placeholder={"Dear …,\n\nWrite your message here. A blank line starts a new paragraph."}
                />
                <FormTextarea
                  label="Closing"
                  name="closing"
                  full
                  rows={3}
                  defaultValue={values.closing}
                  error={errors.closing}
                  maxLength={STATUS_EMAIL_BODY_MAX}
                  hint="Optional. Shown after the message, before the contact line and signature."
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-uk-line pt-4">
                <Dialog.Close
                  type="button"
                  disabled={sending}
                  className="inline-flex h-10 items-center rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading disabled:opacity-60"
                >
                  Cancel
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={sending}
                  className="btn-sheen inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-5 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright disabled:opacity-60"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {sending ? "Sending…" : "Send email"}
                </button>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
