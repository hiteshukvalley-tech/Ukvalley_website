"use client";

import { useActionState, useMemo, useRef, useState, useTransition } from "react";
import { Loader2, Mail, Save, Send, Trash2 } from "lucide-react";
import { FormSection, FormSelect, FormTextarea } from "@/components/admin/form";
import { toast, useResultToast } from "@/components/admin/toast";
import {
  APPLICATION_STATUSES, EMAIL_STATUSES, applicationStatusLabel, isApplicationStatus, isEmailStatus,
  type ApplicationStatus, type EmailStatus,
} from "@/lib/applications-validation";
import { statusEmailTemplate, type EditableEmail, type EmailBrand, type Extras } from "@/lib/application-status-emails";
import { deleteApplicationAction, updateApplicationAction, type ApplicationFormState } from "./actions";
import { confirmDialog } from "@/components/admin/confirm-dialog";
import { StatusEmailComposer } from "./status-email-composer";

const statusOptions = APPLICATION_STATUSES.map((s) => ({ value: s, label: applicationStatusLabel[s] }));

const BLANK_EMAIL: EditableEmail = { subject: "", message: "", closing: "" };

const sameEmail = (a: EditableEmail, b: EditableEmail) =>
  a.subject.trim() === b.subject.trim() && a.message.trim() === b.message.trim() && a.closing.trim() === b.closing.trim();

export function ApplicationForm({
  id,
  name,
  email,
  position,
  appliedOn,
  brand,
  canEmail,
  initial,
}: {
  id: string;
  name: string;
  /** the applicant's email address */
  email: string;
  position: string;
  /** when they applied (ISO string) */
  appliedOn: string;
  brand: EmailBrand;
  /** false when SMTP isn't configured on the server */
  canEmail: boolean;
  initial: { status: string; note: string };
}) {
  const [state, action, saving] = useActionState<ApplicationFormState, FormData>(updateApplicationAction.bind(null, id), {});
  const values = state.values ?? initial;
  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  useResultToast(state);

  const applicant = useMemo(() => ({ id, name, position, appliedOn: new Date(appliedOn) }), [id, name, position, appliedOn]);
  const template = (s: EmailStatus) => statusEmailTemplate(s, applicant);

  // The status picked in the form (the saved one is `initial.status`).
  const [selected, setSelected] = useState<ApplicationStatus>(isApplicationStatus(values.status) ? values.status : "new");
  // Only some statuses have an applicant email (EMAIL_STATUSES).
  const emailable = isEmailStatus(selected);
  const [send, setSend] = useState(false);
  const [draft, setDraft] = useState<EditableEmail>(() => (isEmailStatus(selected) ? template(selected) : BLANK_EMAIL));
  const [extras, setExtras] = useState<Extras>({});
  const edited = emailable && !sameEmail(draft, template(selected));
  const label = applicationStatusLabel[selected];
  const sending = send && emailable;

  // After a successful save, close the email box (a failed send keeps the draft).
  const [handled, setHandled] = useState(state.nonce);
  if (state.nonce !== handled) {
    setHandled(state.nonce);
    if (state.status === "saved") setSend(false);
  }

  const onStatus = (v: string) => {
    if (!isApplicationStatus(v)) return;
    // Load the new status's email unless HR has written their own.
    if (isEmailStatus(v) && !edited) setDraft(template(v));
    setSelected(v);
    // Offer the email whenever the status changes to one that has an email.
    setSend(canEmail && isEmailStatus(v) && v !== initial.status);
  };

  // Sending the default (unedited) email asks HR to confirm first.
  const formRef = useRef<HTMLFormElement>(null);
  const confirmed = useRef(false);
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // "Save status" never sends an email, so there is nothing to confirm.
    const statusOnly = (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "status";
    if (statusOnly || !sending || edited || confirmed.current) {
      confirmed.current = false;
      return;
    }
    e.preventDefault();
    const ok = await confirmDialog(
      `Send the default “${label}” email to ${email}? You haven't edited it — press Cancel to review or change it first.`
    );
    if (ok) {
      confirmed.current = true;
      formRef.current?.requestSubmit();
    }
  };

  const [deleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string>();

  return (
    <div className="space-y-6">
      {/* key remounts the inputs so defaultValues refresh after each result */}
      <form ref={formRef} action={action} onSubmit={onSubmit} key={state.nonce ?? "initial"} className="space-y-6" noValidate>

        <FormSection title="Hiring status" description="The status and note are only visible here. Use the email below to tell the applicant.">
          {/* Controlled: the picked status lives in `selected` (it also drives the email below). */}
          {/* "Save status" saves only the status (not the note, no email) */}
          <div className="flex flex-wrap items-end gap-3 sm:col-span-2">
            <div className="min-w-0 flex-1 sm:max-w-md">
              <FormSelect label="Status" name="status" required value={selected} error={errors.status} options={statusOptions} onChange={onStatus} />
            </div>
            <button
              type="submit"
              name="intent"
              value="status"
              disabled={saving}
              title="Save only the status (no email, the note is not changed)"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-uk-blue/40 bg-uk-surface-blue px-4 text-sm font-semibold text-uk-blue transition-colors hover:bg-uk-blue hover:text-uk-white disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save status
            </button>
          </div>
          <FormTextarea label="Internal note" name="note" full rows={5} defaultValue={values.note} error={errors.note} hint="Interview feedback, next steps … up to 2000 characters." />
        </FormSection>

        {/* Email to the applicant about the status */}
        <section className="rounded-2xl border border-uk-line bg-uk-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              {/* The icon sits outside the heading: inside .font-heading, .text-uk-blue becomes gradient text (transparent icons). */}
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 shrink-0 text-uk-blue" aria-hidden />
                <h2 className="font-heading text-lg font-semibold text-uk-heading">Email the applicant</h2>
              </div>
              <p className="mt-1 text-sm text-uk-muted">
                {!canEmail
                  ? "Email is not set up yet, so status emails can't be sent. Add your own mail server in Settings, or an admin can add the HR email settings in Site settings."
                  : emailable
                    ? <>Tell {name} about the “{label}” status. The email goes to <span className="font-medium text-uk-body">{email}</span> from Ukvalley HR Team; replies go to the HR email in Settings.</>
                    : <>No email is sent for the “{label}” status. Applicant emails are sent only for: {EMAIL_STATUSES.map((s) => applicationStatusLabel[s]).join(", ")}.</>}
              </p>
            </div>
            {canEmail && emailable && (
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-uk-line px-3 py-2 text-sm font-medium text-uk-heading">
                <input type="checkbox" checked={send} onChange={(e) => setSend(e.target.checked)} className="h-4 w-4 accent-uk-blue" />
                Send email when I save
              </label>
            )}
          </div>

          {canEmail && sending && (
            <StatusEmailComposer
              status={selected}
              applicant={applicant}
              brand={brand}
              value={draft}
              extras={extras}
              edited={edited}
              errors={errors}
              onChange={setDraft}
              onExtra={(k, v) => setExtras((x) => ({ ...x, [k]: v }))}
              onReset={() => emailable && setDraft(template(selected))}
            />
          )}
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-sheen inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-5 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : sending ? <Send className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saving ? (sending ? "Saving and sending…" : "Saving…") : sending ? "Save and send email" : "Save changes"}
          </button>
        </div>
      </form>

      <section className="rounded-2xl border border-uk-line bg-uk-card p-6">
        <h2 className="font-heading text-lg font-semibold text-uk-heading">Delete application</h2>
        <p className="mt-1 text-sm text-uk-muted">Permanently removes this application and its resume. This can&apos;t be undone.</p>
        <button
          type="button"
          disabled={deleting}
          onClick={async () => {
            if (await confirmDialog(`Delete the application from “${name}”? This can't be undone.`)) {
              startDelete(async () => {
                const r = await deleteApplicationAction(id);
                // On success the action redirects; a result only comes back on failure.
                if (r && !r.ok) {
                  setDeleteError(r.message);
                  toast.error(r.message ?? "Could not delete.");
                }
              });
            }
          }}
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-destructive/40 px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
        >
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Delete application
        </button>
        {deleteError && <p role="alert" className="mt-2 text-xs text-destructive">{deleteError}</p>}
      </section>
    </div>
  );
}
