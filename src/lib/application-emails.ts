import { escapeHtml, hasMailer, sendMail } from "@/lib/mailer";
import type { Application } from "@/lib/applications-store";

// Emails sent when someone applies on the Careers page:
//   1. to HR (Admin → Site settings → HR email) with the details and the resume attached
//   2. a thank-you to the applicant, from "Ukvalley HR Team", replies going to HR

const HR_NAME = "Ukvalley HR Team";

const wrap = (inner: string) =>
  `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#1f2937;max-width:620px">${inner}</div>`;

function hrEmail(app: Application, adminUrl: string) {
  const rows: [string, string][] = [
    ["Full name", app.name],
    ["Email", app.email],
    ["Phone", app.phone],
    ["Current location", app.location],
    ["Position applied for", app.position],
    ["Years of experience", app.experience],
    ["Portfolio / LinkedIn", app.portfolio || "—"],
  ];
  const text = [
    `New job application for ${app.position}`,
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    "Cover letter:",
    app.coverLetter || "—",
    "",
    `Resume attached (${app.resume.name}).`,
    `Open in the admin panel: ${adminUrl}`,
  ].join("\n");

  const cell = "padding:8px 12px;border-bottom:1px solid #e5e7eb;vertical-align:top";
  const html = wrap(`
<h2 style="margin:0 0 4px;font-size:20px">New job application</h2>
<p style="margin:0 0 16px;color:#4b5563">${escapeHtml(app.position)}</p>
<table style="border-collapse:collapse;width:100%;font-size:14px">
${rows
  .map(([k, v]) => {
    const value =
      k === "Email" ? `<a href="mailto:${escapeHtml(v)}">${escapeHtml(v)}</a>`
      : k === "Portfolio / LinkedIn" && v !== "—" ? `<a href="${escapeHtml(v)}">${escapeHtml(v)}</a>`
      : escapeHtml(v);
    return `<tr><td style="${cell};color:#6b7280;width:38%">${k}</td><td style="${cell}">${value}</td></tr>`;
  })
  .join("\n")}
</table>
<h3 style="margin:20px 0 6px;font-size:15px">Cover letter</h3>
<p style="margin:0;white-space:pre-wrap">${app.coverLetter ? escapeHtml(app.coverLetter) : '<span style="color:#9ca3af">—</span>'}</p>
<p style="margin:20px 0 0">The resume is attached. <a href="${escapeHtml(adminUrl)}">Open this application in the admin panel</a>.</p>`);

  return { subject: `New application: ${app.position} — ${app.name}`, text, html };
}

function applicantEmail(app: Application) {
  const first = app.name.split(" ")[0];
  const text = [
    `Hi ${first},`,
    "",
    `Thank you for applying for the ${app.position} position at Ukvalley Technologies. We've received your application and resume.`,
    "",
    "Our HR team reviews every application personally. If your profile matches what we're looking for, we'll contact you within 7 working days to arrange the next step.",
    "",
    "If you have any questions in the meantime, just reply to this email.",
    "",
    "Best regards,",
    HR_NAME,
    "Ukvalley Technologies",
  ].join("\n");

  const html = wrap(`
<p>Hi ${escapeHtml(first)},</p>
<p>Thank you for applying for the <strong>${escapeHtml(app.position)}</strong> position at Ukvalley Technologies. We've received your application and resume.</p>
<p>Our HR team reviews every application personally. If your profile matches what we're looking for, we'll contact you within <strong>7 working days</strong> to arrange the next step.</p>
<p>If you have any questions in the meantime, just reply to this email.</p>
<p style="margin-top:24px">Best regards,<br><strong>${HR_NAME}</strong><br>Ukvalley Technologies</p>`);

  return { subject: `We've received your application — ${app.position}`, text, html };
}

/**
 * Sends both emails. Never throws: a failed email doesn't undo the
 * application (it is already saved in the admin panel). Returns what was sent.
 */
export async function sendApplicationEmails(
  app: Application,
  opts: { hrEmail: string; adminUrl: string; resume: Buffer }
): Promise<{ hr: boolean; applicant: boolean }> {
  if (!hasMailer()) {
    console.info(`[careers] Application ${app.id} saved; emails not sent (SMTP not configured).`);
    return { hr: false, applicant: false };
  }
  const hr = hrEmail(app, opts.adminUrl);
  const thanks = applicantEmail(app);
  const [toHr, toApplicant] = await Promise.allSettled([
    sendMail({
      to: opts.hrEmail,
      ...hr,
      fromName: "Ukvalley Careers",
      replyTo: app.email,
      attachments: [{ filename: app.resume.name, content: opts.resume, contentType: "application/pdf" }],
    }),
    sendMail({ to: app.email, ...thanks, fromName: HR_NAME, replyTo: opts.hrEmail }),
  ]);
  for (const [label, r] of [["HR", toHr], ["applicant", toApplicant]] as const) {
    if (r.status === "rejected") {
      console.error(`[careers] Could not send the ${label} email for application ${app.id}:`, r.reason instanceof Error ? r.reason.message : r.reason);
    }
  }
  return { hr: toHr.status === "fulfilled", applicant: toApplicant.status === "fulfilled" };
}
