"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-session";
import { findApplicationByEmail } from "@/lib/applications-store";
import { isEmailStatus } from "@/lib/applications-validation";
import { STATUS_EMAIL_BODY_MAX, STATUS_EMAIL_SUBJECT_MAX } from "@/lib/application-status-emails";
import { emailBrand, sendManualEmail, type ManualEmail } from "@/lib/application-emails";
import { hasMailer } from "@/lib/mailer";
import { getSiteSettings } from "@/lib/settings";

export type ManualEmailValues = Omit<ManualEmail, "status"> & { status: string };

export type ManualEmailState = {
  status?: "sent" | "error";
  message?: string;
  errors?: Record<string, string>;
  values?: ManualEmailValues;
  nonce?: number;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Sends the email HR wrote in the "Manual email" form, and logs it. */
export async function sendManualEmailAction(_prev: ManualEmailState, formData: FormData): Promise<ManualEmailState> {
  const user = await requireAdmin("applications");
  const line = (k: string) => String(formData.get(k) ?? "").replace(/\s+/g, " ").trim();
  const block = (k: string) => String(formData.get(k) ?? "").replace(/\r\n?/g, "\n").trim();
  const values: ManualEmailValues = {
    to: line("to").toLowerCase(),
    name: line("name"),
    position: line("position"),
    status: line("status"),
    subject: line("subject"),
    message: block("message"),
    closing: block("closing"),
  };
  const nonce = Date.now();

  const errors: Record<string, string> = {};
  if (!values.to) errors.to = "Enter the applicant's email address.";
  else if (values.to.length > 200 || !EMAIL.test(values.to)) errors.to = "Enter a valid email address.";
  if (!values.name) errors.name = "Enter the applicant's name.";
  else if (values.name.length > 100) errors.name = "Name must be 100 characters or fewer.";
  if (values.position.length > 100) errors.position = "Position must be 100 characters or fewer.";
  if (!isEmailStatus(values.status)) errors.status = "Choose the status this email is about.";
  if (!values.subject) errors.subject = "Enter the email subject.";
  else if (values.subject.length > STATUS_EMAIL_SUBJECT_MAX) errors.subject = `Subject must be ${STATUS_EMAIL_SUBJECT_MAX} characters or fewer.`;
  if (values.message.length < 10) errors.message = "Write the message (at least 10 characters).";
  else if (values.message.length > STATUS_EMAIL_BODY_MAX) errors.message = `Message must be ${STATUS_EMAIL_BODY_MAX} characters or fewer.`;
  if (values.closing.length > STATUS_EMAIL_BODY_MAX) errors.closing = `Closing must be ${STATUS_EMAIL_BODY_MAX} characters or fewer.`;
  if (Object.keys(errors).length) return { status: "error", message: "Please fix the highlighted fields.", errors, values, nonce };
  if (!(await hasMailer(user.id))) {
    return { status: "error", message: "Email is not set up yet — add your own SMTP in Settings, or an admin can add the HR SMTP in Site settings.", values, nonce };
  }

  try {
    const [settings, app] = await Promise.all([getSiteSettings(), findApplicationByEmail(values.to)]);
    await sendManualEmail(
      { ...values, status: values.status as ManualEmail["status"] },
      { app, brand: emailBrand(settings), replyTo: settings.hr.email || undefined, sentBy: user.email, senderId: user.id }
    );
  } catch (e) {
    revalidatePath("/admin/email-logs");
    // The form keeps what was typed so HR can try again.
    return { status: "error", message: `The email could not be sent: ${e instanceof Error ? e.message : String(e)}`, values, nonce };
  }
  revalidatePath("/admin/email-logs");
  return { status: "sent", message: `Email sent to ${values.to}.`, values, nonce };
}
