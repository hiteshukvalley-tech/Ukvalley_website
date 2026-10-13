import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { escapeHtml, hasMailer, sendMail, type MailMessage } from "@/lib/mailer";
import { logEmail, type EmailKind } from "@/lib/email-logs-store";
import type { Application } from "@/lib/applications-store";
import type { ApplicationStatus } from "@/lib/applications-validation";
import { renderApplicantEmail, statusEmailTemplate, type EditableEmail, type EmailBrand, type Extras } from "@/lib/application-status-emails";
import type { SiteSettings } from "@/lib/settings";
import { SITE_URL } from "@/lib/site-origin";
import { formatPostedDate } from "@/lib/careers-shared";

// Emails sent when someone applies on the Careers page:
//   1. to HR (Admin → Site settings → HR email) with the details and the resume attached
//   2. a thank-you to the applicant, from "Ukvalley HR Team", replies going to HR
// and the hiring-status emails HR sends from the admin (sendStatusEmail).
// All use the branded layout in application-status-emails.ts.

const HR_NAME = "Ukvalley HR Team";

const LOGO_PATH = "/brand/ukvalley-logo.png";
const LOGO_CID = "ukvalley-logo@ukvalley.com";

/**
 * Company name, phone, website and logo for the email layout. The logo here
 * is the site's own path, which the admin's live preview loads; emails that
 * are sent carry the logo inside them instead (see withLogo).
 */
export function emailBrand(settings: Pick<SiteSettings, "name" | "phonePrimary">): EmailBrand {
  return {
    company: settings.name,
    phone: settings.phonePrimary,
    website: SITE_URL,
    logoUrl: LOGO_PATH,
  };
}

let logoBytes: Promise<Buffer | null> | null = null;

/** The logo file from public/brand, read once (null if it can't be read; retried next time). */
function readLogo(): Promise<Buffer | null> {
  logoBytes ??= readFile(join(process.cwd(), "public", LOGO_PATH)).catch(() => {
    logoBytes = null;
    return null;
  });
  return logoBytes;
}

type Attachment = NonNullable<MailMessage["attachments"]>[number];

/**
 * The brand for an email that is sent: the logo goes inside the email as an
 * inline image (cid:), so it shows straight away in Gmail, Outlook and phone
 * apps without loading anything from the website, and works even while the
 * website address is down. Falls back to the logo's web address.
 */
async function withLogo(brand: EmailBrand): Promise<{ brand: EmailBrand; attachments: Attachment[] }> {
  const logo = await readLogo();
  if (!logo) return { brand: { ...brand, logoUrl: `${SITE_URL}${LOGO_PATH}` }, attachments: [] };
  return {
    brand: { ...brand, logoUrl: `cid:${LOGO_CID}` },
    attachments: [{ filename: "ukvalley-logo.png", content: logo, contentType: "image/png", cid: LOGO_CID }],
  };
}

const applicantOf = (app: Application) => ({ id: app.id, name: app.name, position: app.position, appliedOn: app.createdAt });

const reason = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** One line in Admin → Careers → Email logs. */
function log(app: Application, kind: EmailKind, e: { to: string; subject: string; status: ApplicationStatus; sentBy?: string; error?: unknown; body?: string }) {
  return logEmail({
    kind,
    to: e.to,
    subject: e.subject,
    applicationId: app.id,
    applicantName: app.name,
    applicantEmail: app.email,
    position: app.position,
    status: e.status,
    result: e.error === undefined ? "sent" : "failed",
    ...(e.error === undefined ? {} : { error: reason(e.error) }),
    sentBy: e.sentBy ?? "",
    ...(e.body ? { body: e.body } : {}),
  });
}

/** What HR wrote in an email (opening message and closing), as the chat shows it. */
const bodyOf = (e: { message: string; closing?: string }) => [e.message, e.closing].map((x) => x?.trim()).filter(Boolean).join("\n\n");

function hrEmail(app: Application, adminUrl: string, brand: EmailBrand) {
  const rows: [string, string][] = [
    ["Candidate Name", app.name],
    ["Email", app.email],
    ["Phone", app.phone],
    ["Current Location", app.location],
    ["Job Title", app.position],
    ["Experience", app.experience],
    ["Expected Joining Date",app.joiningDate ? formatPostedDate(app.joiningDate) : "Not given"],
    ["Portfolio / LinkedIn", app.portfolio || "—"],
    ["Cover Letter", app.coverLetter || "—"],
  ];
  return renderApplicantEmail({
    status: "new",
    applicant: applicantOf(app),
    brand,
    email: {
      subject: `New application: ${app.position}, ${app.name}`,
      message: `Dear HR Team,\n\nA new job application has been received for the position of ${app.position}. Below are the candidate's details:`,
      closing: `The candidate's resume (${app.resume.name}) is attached to this email. You can also review the application, update its status and email the candidate from the admin panel.`,
    },
    detailsHeading: "Candidate Details",
    rows,
    button: { label: "Open in Admin Panel", href: adminUrl },
    signature: null,
  });
}

/** The thank-you sent when someone applies: the "New" status email. */
function applicantEmail(app: Application, brand: EmailBrand) {
  return renderApplicantEmail({ status: "new", applicant: applicantOf(app), email: statusEmailTemplate("new", applicantOf(app)), brand });
}

/**
 * Sends a hiring-status email (subject and messages as HR wrote or kept them)
 * to the applicant, from "Ukvalley HR Team" with replies going to HR, and
 * logs it (sent or failed). Throws when it can't be sent.
 */
export async function sendStatusEmail(
  app: Application,
  opts: {
    status: ApplicationStatus; email: EditableEmail; extras: Extras; brand: EmailBrand; replyTo?: string;
    /** email of the admin sending it, for the log */
    sentBy?: string;
    /** id of the admin sending it: their own SMTP is used when they set one */
    senderId?: string;
  }
) {
  const { brand, attachments } = await withLogo(opts.brand);
  const { subject, html, text } = renderApplicantEmail({
    status: opts.status,
    applicant: applicantOf(app),
    email: opts.email,
    extras: opts.extras,
    brand,
  });
  const entry = { to: app.email, subject, status: opts.status, sentBy: opts.sentBy, body: bodyOf(opts.email) };
  try {
    await sendMail(
      { to: app.email, subject, text, html, attachments, fromName: HR_NAME, ...(opts.replyTo ? { replyTo: opts.replyTo } : {}) },
      { senderId: opts.senderId }
    );
  } catch (error) {
    await log(app, "status", { ...entry, error });
    throw error;
  }
  await log(app, "status", entry);
}

/** What HR types in the "Manual email" form on the Email logs page. */
export type ManualEmail = {
  to: string;
  name: string;
  position: string;
  status: ApplicationStatus;
  subject: string;
  message: string;
  closing: string;
};

/**
 * Sends an email HR wrote by hand (Admin → Careers → Email logs → Manual
 * email) in the same branded layout, from "Ukvalley HR Team", and logs it
 * (sent or failed). `app` links the log line to the applicant's application,
 * when there is one. Throws when it can't be sent.
 */
export async function sendManualEmail(
  input: ManualEmail,
  opts: { app: Application | null; brand: EmailBrand; replyTo?: string; sentBy: string; senderId?: string }
) {
  const applicant = {
    id: opts.app?.id ?? "",
    name: input.name,
    position: input.position,
    appliedOn: opts.app?.createdAt ?? new Date(),
  };
  const { brand, attachments } = await withLogo(opts.brand);
  const { subject, html, text } = renderApplicantEmail({
    status: input.status,
    applicant,
    email: { subject: input.subject, message: input.message, closing: input.closing },
    brand,
    rows: [],
  });
  const entry = {
    kind: "manual" as const,
    to: input.to,
    subject,
    applicationId: opts.app?.id ?? "",
    applicantName: input.name,
    applicantEmail: input.to,
    position: input.position,
    status: input.status,
    sentBy: opts.sentBy,
    body: bodyOf(input),
  };
  try {
    await sendMail(
      { to: input.to, subject, text, html, attachments, fromName: HR_NAME, ...(opts.replyTo ? { replyTo: opts.replyTo } : {}) },
      { senderId: opts.senderId }
    );
  } catch (error) {
    await logEmail({ ...entry, result: "failed", error: reason(error) });
    throw error;
  }
  await logEmail({ ...entry, result: "sent" });
}

/**
 * Sends both emails. Never throws: a failed email doesn't undo the
 * application (it is already saved in the admin panel). Returns what was sent.
 */
export async function sendApplicationEmails(
  app: Application,
  opts: { hrEmail: string; adminUrl: string; resume: Buffer; brand: EmailBrand }
): Promise<{ hr: boolean; applicant: boolean }> {
  const { brand, attachments: logo } = await withLogo(opts.brand);
  const hr = hrEmail(app, opts.adminUrl, brand);
  const thanks = applicantEmail(app, brand);
  const hrEntry = { to: opts.hrEmail, subject: hr.subject, status: "new" as const };
  const thanksEntry = { to: app.email, subject: thanks.subject, status: "new" as const, body: bodyOf(statusEmailTemplate("new", applicantOf(app))) };
  if (!(await hasMailer())) {
    console.info(`[careers] Application ${app.id} saved; emails not sent (SMTP not configured).`);
    const error = "Email (SMTP) is not set up.";
    await Promise.all([log(app, "application-hr", { ...hrEntry, error }), log(app, "application-thanks", { ...thanksEntry, error })]);
    return { hr: false, applicant: false };
  }
  const [toHr, toApplicant] = await Promise.allSettled([
    sendMail({
      to: opts.hrEmail,
      ...hr,
      fromName: "Ukvalley Careers",
      replyTo: app.email,
      attachments: [...logo, { filename: app.resume.name, content: opts.resume, contentType: "application/pdf" }],
    }),
    sendMail({ to: app.email, ...thanks, attachments: logo, fromName: HR_NAME, replyTo: opts.hrEmail }),
  ]);
  for (const [label, r] of [["HR", toHr], ["applicant", toApplicant]] as const) {
    if (r.status === "rejected") {
      console.error(`[careers] Could not send the ${label} email for application ${app.id}:`, r.reason instanceof Error ? r.reason.message : r.reason);
    }
  }
  const failed = (r: PromiseSettledResult<unknown>) => (r.status === "rejected" ? { error: r.reason ?? "Unknown error" } : {});
  await Promise.all([
    log(app, "application-hr", { ...hrEntry, ...failed(toHr) }),
    log(app, "application-thanks", { ...thanksEntry, ...failed(toApplicant) }),
  ]);
  return { hr: toHr.status === "fulfilled", applicant: toApplicant.status === "fulfilled" };
}

/**
 * A chat message from HR to an applicant (Admin → Careers → Email logs →
 * Chat): a short, plain email from "Ukvalley HR Team", replies going to HR.
 * Logged as a "Chat message" (sent or failed). Throws when it can't be sent.
 */
export async function sendChatMessage(
  to: { email: string; name: string; position: string; applicationId: string; status: ApplicationStatus },
  opts: { message: string; subject: string; replyTo?: string; sentBy: string; senderId?: string }
) {
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1f2937;max-width:600px">
${opts.message.split(/\n{2,}/).map((p) => `<p style="margin:0 0 12px">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`).join("\n")}
<p style="margin:16px 0 0;color:#6b7280;font-size:13px">${escapeHtml(HR_NAME)}<br>Ukvalley Technologies</p>
</div>`;
  const text = `${opts.message}\n\n${HR_NAME}\nUkvalley Technologies`;
  const entry = {
    kind: "chat" as const,
    to: to.email,
    subject: opts.subject,
    applicationId: to.applicationId,
    applicantName: to.name,
    applicantEmail: to.email,
    position: to.position,
    status: to.status,
    sentBy: opts.sentBy,
    body: opts.message,
  };
  try {
    await sendMail(
      { to: to.email, subject: opts.subject, text, html, fromName: HR_NAME, ...(opts.replyTo ? { replyTo: opts.replyTo } : {}) },
      { senderId: opts.senderId }
    );
  } catch (error) {
    await logEmail({ ...entry, result: "failed", error: reason(error) });
    throw error;
  }
  await logEmail({ ...entry, result: "sent" });
}
