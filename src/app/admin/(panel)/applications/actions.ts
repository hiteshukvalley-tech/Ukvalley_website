"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import { deleteApplication, getApplication, recordStatusEmail, updateApplication } from "@/lib/applications-store";
import { applicationStatusLabel, isApplicationStatus, isEmailStatus, type ApplicationStatus } from "@/lib/applications-validation";
import { cleanExtras, STATUS_EMAIL_BODY_MAX, STATUS_EMAIL_SUBJECT_MAX, STATUS_FIELDS, type Extras } from "@/lib/application-status-emails";
import { emailBrand, sendStatusEmail } from "@/lib/application-emails";
import { hasMailer } from "@/lib/mailer";
import { getSiteSettings } from "@/lib/settings";

export type ApplicationFormState = {
  status?: "saved" | "error";
  message?: string;
  errors?: Record<string, string>;
  values?: { status: string; note: string };
  nonce?: number;
};

export type ActionResult = { ok: boolean; message?: string };

const NO_DB = "Database is not connected (MONGODB_URI missing).";
const dbMessage = (e: unknown) => (e instanceof Error ? e.message : "database error");
const NOTE_MAX = 2000;

function refresh(id?: string) {
  revalidatePath("/admin/applications");
  revalidatePath("/admin/applications/applicants");
  if (id) revalidatePath(`/admin/applications/${id}`);
  revalidatePath("/admin");
}

export async function updateApplicationAction(
  id: string,
  _prev: ApplicationFormState,
  formData: FormData
): Promise<ApplicationFormState> {
  id = String(id);
  const user = await requireAdmin("applications");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  // "Save status" (beside the Status box) saves only the status: not the note, and no email.
  const statusOnly = formData.get("intent") === "status";
  // Optional email to the applicant about the status (subject and messages as HR left them).
  const sendEmail = !statusOnly && formData.get("sendEmail") === "1";
  const subject = String(formData.get("emailSubject") ?? "").replace(/\s+/g, " ").trim();
  const text = (k: string) => String(formData.get(k) ?? "").replace(/\r\n?/g, "\n").trim();
  const message = text("emailMessage");
  const closing = text("emailClosing");
  const edited = formData.get("emailEdited") === "1";
  let extras: Extras = {};
  if (isApplicationStatus(status)) {
    for (const f of STATUS_FIELDS[status]) extras[f.key] = text(`extra.${f.key}`);
    // Interview / joining details are optional and not checked (only capped in length).
    extras = cleanExtras(status, extras);
  }
  const values = { status, note };
  const nonce = Date.now();

  const errors: Record<string, string> = {};
  if (!isApplicationStatus(status)) errors.status = "Choose one of the listed statuses.";
  if (!statusOnly && note.length > NOTE_MAX) errors.note = `Note must be ${NOTE_MAX} characters or fewer.`;
  if (sendEmail && isApplicationStatus(status) && !isEmailStatus(status)) {
    errors.status = "No email is sent for this status. Untick “Send email when I save” or choose a status that has an email.";
  } else if (sendEmail) {
    if (!subject) errors.emailSubject = "Enter the email subject.";
    else if (subject.length > STATUS_EMAIL_SUBJECT_MAX) errors.emailSubject = `Subject must be ${STATUS_EMAIL_SUBJECT_MAX} characters or fewer.`;
    if (message.length < 10) errors.emailMessage = "Write the message to the applicant.";
    else if (message.length > STATUS_EMAIL_BODY_MAX) errors.emailMessage = `Message must be ${STATUS_EMAIL_BODY_MAX} characters or fewer.`;
    if (closing.length > STATUS_EMAIL_BODY_MAX) errors.emailClosing = `Closing must be ${STATUS_EMAIL_BODY_MAX} characters or fewer.`;
    if (!(await hasMailer(user.id))) errors.emailSubject = "Email is not set up yet — add your own SMTP in Settings, or an admin can add the HR SMTP in Site settings.";
  }
  if (Object.keys(errors).length) {
    return { status: "error", message: "Please fix the highlighted fields.", errors, values, nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  try {
    const found = await updateApplication(id, statusOnly ? { status: status as ApplicationStatus } : { status: status as ApplicationStatus, note });
    if (!found) return { status: "error", message: "This application no longer exists.", values, nonce };
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  refresh(id);
  if (statusOnly) return { status: "saved", message: `Status saved: ${applicationStatusLabel[status as ApplicationStatus]}.`, values, nonce };
  if (!sendEmail) return { status: "saved", message: "Application updated.", values, nonce };

  // The status is saved either way; only the email can still fail.
  const app = await getApplication(id);
  if (!app) return { status: "error", message: "Status saved, but the application could not be read to send the email.", values, nonce };
  try {
    const settings = await getSiteSettings();
    await sendStatusEmail(app, {
      status: status as ApplicationStatus,
      email: { subject, message, closing },
      extras,
      brand: emailBrand(settings),
      replyTo: settings.hr.email || undefined,
      sentBy: user.email,
      senderId: user.id,
    });
  } catch (e) {
    // The form keeps the draft so HR can try again.
    return { status: "error", message: `Status saved, but the email could not be sent: ${dbMessage(e)}`, values, nonce };
  }
  try {
    const details = Object.fromEntries(Object.entries(extras).filter(([, v]) => v));
    await recordStatusEmail(id, {
      status: status as ApplicationStatus, subject, edited, sentBy: user.email, sentAt: new Date(),
      ...(Object.keys(details).length ? { details } : {}),
    });
  } catch {
    // The email went out; only its line in the history is missing.
  }
  refresh(id);
  return { status: "saved", message: `Application updated and email sent to ${app.email}.`, values, nonce };
}

export async function deleteApplicationAction(id: string): Promise<ActionResult> {
  id = String(id);
  await requireAdmin("applications");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    await deleteApplication(id);
  } catch (e) {
    return { ok: false, message: `Could not delete: ${dbMessage(e)}` };
  }
  refresh();
  redirect("/admin/applications/applicants?saved=deleted");
}
