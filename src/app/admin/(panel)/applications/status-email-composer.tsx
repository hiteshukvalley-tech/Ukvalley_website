"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminSelect } from "@/components/admin/admin-select";
import { applicationStatusLabel, isInterviewStatus, type ApplicationStatus } from "@/lib/applications-validation";
import {
  SIGNATURE, STATUS_EMAIL_BODY_MAX, STATUS_EMAIL_SUBJECT_MAX, STATUS_FIELDS, renderApplicantEmail,
  type EditableEmail, type EmailApplicant, type EmailBrand, type Extras,
} from "@/lib/application-status-emails";

const fieldClass =
  "h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function ErrorText({ id, msg }: { id: string; msg?: string }) {
  return msg ? <p id={id} role="alert" className="text-xs text-destructive">{msg}</p> : null;
}

/**
 * The email HR sends the applicant with a status change: interview / joining
 * details for that status, the editable subject, opening and closing, and a
 * live preview of the finished email. Controlled by the application form.
 */
export function StatusEmailComposer({
  status, applicant, brand, value, extras, edited, errors, onChange, onExtra, onReset,
}: {
  status: ApplicationStatus;
  applicant: EmailApplicant;
  brand: EmailBrand;
  value: EditableEmail;
  extras: Extras;
  edited: boolean;
  errors: Record<string, string>;
  onChange: (next: EditableEmail) => void;
  onExtra: (key: string, v: string) => void;
  onReset: () => void;
}) {
  const label = applicationStatusLabel[status];
  const fields = STATUS_FIELDS[status];
  const [preview, setPreview] = useState(true);
  const rendered = useMemo(
    () => renderApplicantEmail({ status, applicant, email: value, extras, brand }),
    [status, applicant, value, extras, brand]
  );

  return (
    <div className="mt-5 space-y-5">
      <input type="hidden" name="sendEmail" value="1" />
      <input type="hidden" name="emailEdited" value={edited ? "1" : "0"} />

      {fields.length > 0 && (
        <fieldset className="rounded-xl border border-uk-line p-4">
          <legend className="px-1 text-sm font-semibold text-uk-heading">
            {isInterviewStatus(status) ? "Interview details" : "Joining details"}
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => {
              const id = `f-extra-${f.key}`;
              const err = errors[`extra.${f.key}`];
              const common = {
                id,
                name: `extra.${f.key}`,
                value: extras[f.key] ?? "",
                "aria-invalid": err ? true : undefined,
                "aria-describedby": err ? `${id}-err` : undefined,
              };
              return (
                <div key={f.key} className={f.type === "textarea" || f.key === "interviewVenue" ? "space-y-2 sm:col-span-2" : "space-y-2"}>
                  <label htmlFor={id} className="text-sm font-medium text-uk-heading">
                    {f.label}
                  </label>
                  {f.type === "select" ? (
                    <AdminSelect
                      id={id}
                      name={`extra.${f.key}`}
                      value={extras[f.key] ?? ""}
                      options={(f.options ?? []).map((o) => ({ value: o, label: o }))}
                      onChange={(v) => onExtra(f.key, v)}
                      invalid={!!err}
                      describedBy={err ? `${id}-err` : undefined}
                    />
                  ) : f.type === "textarea" ? (
                    <Textarea {...common} rows={3} maxLength={500} placeholder={f.placeholder} onChange={(e) => onExtra(f.key, e.target.value)} />
                  ) : (
                    <input
                      {...common}
                      type={f.type}
                      maxLength={500}
                      placeholder={f.placeholder}
                      onChange={(e) => onExtra(f.key, e.target.value)}
                      onClick={(e) => {
                        if (f.type === "date" || f.type === "time") {
                          try { e.currentTarget.showPicker(); } catch {}
                        }
                      }}
                      className={fieldClass}
                    />
                  )}
                  <ErrorText id={`${id}-err`} msg={err} />
                </div>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-uk-surface-2 px-3 py-2 text-sm">
        <span className={edited ? "text-uk-body" : "text-uk-muted"}>
          {edited
            ? "You've edited this email. It will be sent as you wrote it."
            : `Default “${label}” email. Edit it if you want — you'll be asked to confirm before the default is sent.`}
        </span>
        {edited && (
          <button type="button" onClick={onReset} className="inline-flex items-center gap-1.5 text-sm font-medium text-uk-blue hover:underline">
            <RotateCcw className="h-3.5 w-3.5" /> Use the default “{label}” email
          </button>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="f-emailSubject" className="text-sm font-medium text-uk-heading">Subject</label>
        <Input
          id="f-emailSubject"
          name="emailSubject"
          value={value.subject}
          onChange={(e) => onChange({ ...value, subject: e.target.value })}
          maxLength={STATUS_EMAIL_SUBJECT_MAX}
          aria-invalid={errors.emailSubject ? true : undefined}
          aria-describedby={errors.emailSubject ? "f-emailSubject-err" : undefined}
        />
        <ErrorText id="f-emailSubject-err" msg={errors.emailSubject} />
      </div>

      <div className="space-y-2">
        <label htmlFor="f-emailMessage" className="text-sm font-medium text-uk-heading">Message</label>
        <Textarea
          id="f-emailMessage"
          name="emailMessage"
          rows={8}
          value={value.message}
          onChange={(e) => onChange({ ...value, message: e.target.value })}
          maxLength={STATUS_EMAIL_BODY_MAX}
          aria-invalid={errors.emailMessage ? true : undefined}
          aria-describedby={errors.emailMessage ? "f-emailMessage-err" : "f-emailMessage-hint"}
        />
        {errors.emailMessage ? (
          <ErrorText id="f-emailMessage-err" msg={errors.emailMessage} />
        ) : (
          <p id="f-emailMessage-hint" className="text-xs text-uk-muted">
            Shown above the details card. Leave a blank line between paragraphs.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="f-emailClosing" className="text-sm font-medium text-uk-heading">Closing</label>
        <Textarea
          id="f-emailClosing"
          name="emailClosing"
          rows={4}
          value={value.closing}
          onChange={(e) => onChange({ ...value, closing: e.target.value })}
          maxLength={STATUS_EMAIL_BODY_MAX}
          aria-invalid={errors.emailClosing ? true : undefined}
          aria-describedby={errors.emailClosing ? "f-emailClosing-err" : "f-emailClosing-hint"}
        />
        {errors.emailClosing ? (
          <ErrorText id="f-emailClosing-err" msg={errors.emailClosing} />
        ) : (
          <p id="f-emailClosing-hint" className="text-xs text-uk-muted">
            Shown after the details. The contact line, signature ({SIGNATURE.name}, {SIGNATURE.title}) and footer are added automatically.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-uk-line">
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          aria-expanded={preview}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-uk-heading"
        >
          <span className="inline-flex items-center gap-2">
            {preview ? <EyeOff className="h-4 w-4 text-uk-muted" /> : <Eye className="h-4 w-4 text-uk-muted" />}
            {preview ? "Hide preview" : "Show preview"}
          </span>
          <span className="truncate text-xs font-normal text-uk-muted">Subject: {rendered.subject}</span>
        </button>
        {preview && (
          // The email as the applicant will see it. Sandboxed: no scripts, links don't navigate the admin.
          <iframe
            title="Email preview"
            sandbox=""
            srcDoc={rendered.html}
            className="block h-[44rem] w-full rounded-b-xl border-t border-uk-line bg-white"
          />
        )}
      </div>
    </div>
  );
}
