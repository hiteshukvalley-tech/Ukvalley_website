import { applicationStatusLabel, isInterviewStatus, type ApplicationStatus, type EmailStatus } from "./applications-validation";

// Emails to job applicants. HR can email an applicant only about the statuses
// in EMAIL_STATUSES (applications-validation.ts); "new" is the automatic
// thank-you sent when someone applies. HR can edit the subject, the opening
// message and the closing message in the admin; the details card
// (application / interview / joining details), contact line, signature and
// footer are filled in automatically. Client-safe, so the admin shows a live
// preview of exactly what will be sent.

export const STATUS_EMAIL_SUBJECT_MAX = 200;
export const STATUS_EMAIL_BODY_MAX = 5000;

/** Who signs every applicant email. */
export const SIGNATURE = { name: "Umesh Khivasara", title: "CEO, Ukvalley Technologies" };

/** Company details used in the emails (from Site settings). */
export type EmailBrand = { company: string; phone: string; website: string; logoUrl: string };

export type EmailApplicant = {
  /** application id */
  id: string;
  name: string;
  position: string;
  /** when they applied */
  appliedOn: Date;
};

/** Extra details HR enters for some statuses (interview, joining). */
export type ExtraField = {
  key: string;
  label: string;
  type: "date" | "time" | "text" | "email" | "tel" | "select" | "textarea";
  options?: string[];
  placeholder?: string;
};

const INTERVIEW_FIELDS: ExtraField[] = [
  { key: "interviewDate", label: "Interview date", type: "date" },
  { key: "interviewTime", label: "Interview time", type: "time" },
  { key: "interviewMode", label: "Interview mode", type: "select", options: ["Online", "Offline"] },
  { key: "interviewVenue", label: "Venue / meeting link", type: "text", placeholder: "Online: https://meet.google.com/… · Offline: the office address" },
  { key: "interviewerName", label: "Interviewer name (optional)", type: "text", placeholder: "e.g. Priya Sharma, Technical Lead" },
  { key: "interviewerEmail", label: "Interviewer email (optional)", type: "email", placeholder: "interviewer@ukvalley.com" },
  { key: "interviewerPhone", label: "Interviewer contact number (optional)", type: "tel", placeholder: "e.g. +91 98765 43210" },
  { key: "interviewAgenda", label: "Agenda (optional)", type: "textarea", placeholder: "e.g. Introduction, technical round, Q&A" },
];

/** Extra details HR fills in before sending a status email (none for most statuses). */
export const STATUS_FIELDS: Record<ApplicationStatus, ExtraField[]> = {
  new: [],
  reviewing: [],
  shortlisted: INTERVIEW_FIELDS,
  "no-show": [],
  "next-round": [
    {
      key: "interviewRound", label: "Interview round", type: "select",
      options: ["Technical Round", "Second Technical Round", "Managerial Round", "HR Round", "Final Round"],
    },
    ...INTERVIEW_FIELDS,
  ],
  rescheduled: [
    ...INTERVIEW_FIELDS,
    { key: "rescheduleReason", label: "Reason for rescheduling (optional)", type: "text", placeholder: "e.g. Interviewer unavailable at the earlier time" },
  ],
  "on-hold": [],
  selected: [],
  rejected: [],
  "offer-issued": [],
  "offer-accepted": [],
  "offer-declined": [],
  hired: [
    { key: "joiningDate", label: "Joining date", type: "date" },
    { key: "reportingTime", label: "Reporting time (optional)", type: "time" },
    { key: "workLocation", label: "Work location (optional)", type: "text", placeholder: "e.g. Nashik office" },
  ],
  "not-joined": [],
};

export type Extras = Record<string, string>;

/** The parts of the email HR can edit. */
export type EditableEmail = { subject: string; message: string; closing: string };

/** Statuses with a ready-made email: the status emails plus the "application received" thank-you. */
export type TemplateStatus = "new" | EmailStatus;

const templates: Record<TemplateStatus, (a: EmailApplicant) => EditableEmail> = {
  new: ({ name, position }) => ({
    subject: `Application Received: ${position} | Ukvalley Technologies`,
    message: `Dear ${name},

Thank you for applying for the position of ${position} at Ukvalley Technologies. We are pleased to confirm that we have received your application and resume.

Below are your application details:`,
    closing: `Our HR team reviews every application carefully. If your profile matches our requirements, we will contact you within 7 working days with the next steps.`,
  }),
  shortlisted: ({ name, position }) => ({
    subject: `Shortlisted for Interview: ${position} | Ukvalley Technologies`,
    message: `Dear ${name},

We are pleased to inform you that your profile has been shortlisted for the position of ${position}, and an interview has been scheduled with our team. Below are the details:`,
    closing: `Please ensure you are available at the scheduled time and keep a copy of your resume handy. Kindly reply to this email to confirm your availability, or let us know if you need to reschedule.`,
  }),
  "next-round": ({ name, position }) => ({
    subject: `Next Round Interview Scheduled: ${position} | Ukvalley Technologies`,
    message: `Dear ${name},

Congratulations on successfully clearing the previous interview round for the position of ${position}. We are pleased to invite you to the next round of the selection process. Below are the details:`,
    closing: `Please ensure you are available at the scheduled time. Kindly reply to this email to confirm your availability, or let us know if the timing does not work for you.`,
  }),
  rescheduled: ({ name, position }) => ({
    subject: `Interview Rescheduled: ${position} | Ukvalley Technologies`,
    message: `Dear ${name},

Please note that your interview for the position of ${position} has been rescheduled. The updated date, time and venue are given below:`,
    closing: `We apologise for any inconvenience this change may cause. Kindly reply to this email to confirm your availability for the new schedule.`,
  }),
  "on-hold": ({ name, position }) => ({
    subject: `Application Status Update: ${position} | Ukvalley Technologies`,
    message: `Dear ${name},

Thank you for your continued interest in the position of ${position} at Ukvalley Technologies. We would like to inform you that your application has been placed on hold for the time being while we complete our internal review.

Below are your application details:`,
    closing: `No action is required from you at this stage. We will get in touch with you as soon as there is an update. We truly appreciate your patience.`,
  }),
  selected: ({ name, position }) => ({
    subject: `Congratulations! You Have Been Selected: ${position} | Ukvalley Technologies`,
    message: `Dear ${name},

Congratulations! We are delighted to inform you that, following the interview process, you have been selected for the position of ${position} at Ukvalley Technologies.

Below are your details:`,
    closing: `Our HR team will share your offer letter and the next steps with you shortly. We look forward to welcoming you to the team.`,
  }),
  rejected: ({ name, position }) => ({
    subject: `Update on Your Application: ${position} | Ukvalley Technologies`,
    message: `Dear ${name},

Thank you for taking the time to apply for the position of ${position} at Ukvalley Technologies, and for your interest in joining our team.

After careful consideration, we regret to inform you that we will not be moving forward with your application at this time, as we have decided to proceed with candidates whose experience more closely matches the requirements of this role.`,
    closing: `We truly appreciate the effort you put into your application. We will keep your details on file and may reach out if a suitable opening comes up in the future. We wish you every success in your career.`,
  }),
  hired: ({ name, position }) => ({
    subject: `Welcome to Ukvalley Technologies: Joining Details | ${position}`,
    message: `Dear ${name},

Congratulations and welcome to Ukvalley Technologies! We are delighted to confirm your appointment as ${position} and are excited to have you on board.

Below are your joining details:`,
    closing: `Please carry your original documents (identity proof, educational certificates and previous employment documents, if any) on your first day. Kindly reply to this email to confirm your joining.`,
  }),
};

/** The default subject, opening and closing for a status, addressed to this applicant. */
export function statusEmailTemplate(status: TemplateStatus, applicant: EmailApplicant): EditableEmail {
  return templates[status](applicant);
}

// ---------------------------------------------------------------------------
// Layout

const accent: Record<ApplicationStatus, string> = {
  new: "#3100ff",
  reviewing: "#d97706",
  shortlisted: "#7c3aed",
  "no-show": "#e11d48",
  "next-round": "#4f46e5",
  rescheduled: "#0891b2",
  "on-hold": "#ca8a04",
  selected: "#16a34a",
  rejected: "#475569",
  "offer-issued": "#0d9488",
  "offer-accepted": "#059669",
  "offer-declined": "#ea580c",
  hired: "#059669",
  "not-joined": "#be123c",
};

const badge: Record<ApplicationStatus, string> = {
  new: "Application Received",
  reviewing: "Under Review",
  shortlisted: "Shortlisted for Interview",
  "no-show": "Interview Missed",
  "next-round": "Next Round Interview",
  rescheduled: "Interview Rescheduled",
  "on-hold": "Application On Hold",
  selected: "Selected",
  rejected: "Application Update",
  "offer-issued": "Offer Letter Issued",
  "offer-accepted": "Offer Accepted",
  "offer-declined": "Offer Declined",
  hired: "Welcome Aboard",
  "not-joined": "Joining Update",
};

const detailsTitle: Partial<Record<ApplicationStatus, string>> = {
  new: "Application Details",
  reviewing: "Application Details",
  shortlisted: "Interview Details",
  "next-round": "Next Round Interview Details",
  rescheduled: "Rescheduled Interview Details",
  "on-hold": "Application Details",
  selected: "Selection Details",
  hired: "Joining Details",
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const isUrl = (s: string) => /^https?:\/\/\S+$/i.test(s.trim());

/** "01 Oct 2026" from YYYY-MM-DD (or a Date). */
function formatDate(v: string | Date): string {
  const d = typeof v === "string" ? new Date(`${v}T00:00:00Z`) : v;
  if (Number.isNaN(d.getTime())) return String(v);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    timeZone: typeof v === "string" ? "UTC" : "Asia/Kolkata",
  }).format(d);
}

/** "01:00 PM" from HH:MM. */
function formatTime(v: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v.trim());
  if (!m) return v;
  const h = Number(m[1]);
  return `${String(((h + 11) % 12) + 1).padStart(2, "0")}:${m[2]} ${h < 12 ? "AM" : "PM"}`;
}

/** A short reference for the application, e.g. "UKV-3F9A1C2B". */
export const applicationRef = (id: string) => `UKV-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;

/** The label/value rows of the details card. */
export function emailDetails(status: ApplicationStatus, a: EmailApplicant, x: Extras): [string, string][] {
  const base: [string, string][] = [
    ["Candidate Name", a.name],
    ["Application ID", applicationRef(a.id)],
    ["Job Title", a.position],
  ];
  const v = (k: string) => (x[k] ?? "").trim();
  switch (status) {
    case "new":
    case "reviewing":
      return [...base, ["Applied On", formatDate(a.appliedOn)], ["Application Status", applicationStatusLabel[status]]];
    case "on-hold":
    case "selected":
      return [...base, ["Application Status", applicationStatusLabel[status]]];
    case "shortlisted":
    case "next-round":
    case "rescheduled": {
      const rows: [string, string][] = [...base];
      if (status === "next-round") rows.push(["Interview Round", v("interviewRound") || "To be confirmed"]);
      rows.push(
        ["Interview Date", v("interviewDate") ? formatDate(v("interviewDate")) : "To be confirmed"],
        ["Interview Time", v("interviewTime") ? formatTime(v("interviewTime")) : "To be confirmed"],
        ["Interview Mode", v("interviewMode") || "To be confirmed"],
        ["Venue / Link", v("interviewVenue") || "To be confirmed"],
      );
      // Interviewer details: only the ones HR filled in.
      if (v("interviewerName")) rows.push(["Interviewer Name", v("interviewerName")]);
      if (v("interviewerEmail")) rows.push(["Interviewer Email", v("interviewerEmail")]);
      if (v("interviewerPhone")) rows.push(["Interviewer Contact", v("interviewerPhone")]);
      if (v("interviewAgenda")) rows.push(["Agenda", v("interviewAgenda")]);
      if (v("rescheduleReason")) rows.push(["Reason for Change", v("rescheduleReason")]);
      return rows;
    }
    case "hired": {
      const rows: [string, string][] = [
        ["Candidate Name", a.name],
        ["Job Title", a.position],
        ["Joining Date", v("joiningDate") ? formatDate(v("joiningDate")) : "To be confirmed"],
      ];
      if (v("reportingTime")) rows.push(["Reporting Time", formatTime(v("reportingTime"))]);
      if (v("workLocation")) rows.push(["Work Location", v("workLocation")]);
      return rows;
    }
    default:
      return [];
  }
}

/** HTML paragraphs from plain text: blank lines split paragraphs, single line breaks are kept. */
function paragraphs(text: string, style: string) {
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="${style}">${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

const FONT = "font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/**
 * Lays out a branded email: header with logo and status, the message, a
 * details card, an optional button, the closing, contact line, signature and
 * footer. Returns the subject, HTML and a plain-text version.
 */
export function renderApplicantEmail(opts: {
  status: ApplicationStatus;
  applicant: EmailApplicant;
  email: EditableEmail;
  extras?: Extras;
  brand: EmailBrand;
  /** title of the details card (defaults per status) */
  detailsHeading?: string;
  rows?: [string, string][];
  button?: { label: string; href: string };
  signature?: { name: string; title: string } | null;
}): { subject: string; html: string; text: string } {
  const { status, applicant, email, brand } = opts;
  const extras = opts.extras ?? {};
  const color = accent[status];
  const rows = opts.rows ?? emailDetails(status, applicant, extras);
  const heading = opts.detailsHeading ?? detailsTitle[status] ?? "";
  const signature = opts.signature === undefined ? SIGNATURE : opts.signature;
  const venue = (extras.interviewVenue ?? "").trim();
  const button = opts.button ?? (isInterviewStatus(status) && isUrl(venue) ? { label: "Join Interview", href: venue } : undefined);
  const year = new Date().getFullYear();
  const p = "margin:0 0 16px;font-size:15px;line-height:1.65;color:#1f2937";

  const rowHtml = rows
    .map(([k, val]) => {
      const value = isUrl(val)
        ? `<a href="${esc(val)}" style="color:${color};text-decoration:underline;word-break:break-all">${esc(val)}</a>`
        : esc(val).replace(/\n/g, "<br>");
      return `<tr>
<td style="padding:9px 14px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#6b7280;width:38%;vertical-align:top">${esc(k)}</td>
<td style="padding:9px 14px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;font-weight:600;vertical-align:top">${value}</td>
</tr>`;
    })
    .join("\n");

  const details = rows.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 22px;border-collapse:separate;background:#f8fafc;border:1px solid #e5e7eb;border-left:4px solid ${color};border-radius:10px;overflow:hidden">
${heading ? `<tr><td colspan="2" style="padding:12px 14px 8px;font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:${color}">${esc(heading)}</td></tr>` : ""}
${rowHtml}
</table>`
    : "";

  const buttonHtml = button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 22px"><tr><td style="border-radius:8px;background:${color}">
<a href="${esc(button.href)}" style="display:inline-block;padding:12px 26px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px">${esc(button.label)}</a>
</td></tr></table>`
    : "";

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(email.subject)}</title></head>
<body style="margin:0;padding:0;background:#eef1f7">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f7;padding:28px 12px;${FONT}">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e3e7ef">
<tr><td style="height:5px;background:${color};font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td style="padding:22px 32px 18px;border-bottom:1px solid #eef0f4">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="vertical-align:middle"><img src="${esc(brand.logoUrl)}" alt="${esc(brand.company)}" height="38" style="display:block;height:38px;width:auto;border:0"></td>
<td align="right" style="vertical-align:middle"><span style="display:inline-block;padding:6px 12px;border-radius:999px;background:${color}1a;color:${color};font-size:12px;font-weight:700;letter-spacing:.03em;${FONT}">${esc(badge[status])}</span></td>
</tr></table>
</td></tr>
<tr><td style="padding:30px 32px 8px;${FONT}">
${paragraphs(email.message, p)}
${details}
${buttonHtml}
${paragraphs(email.closing, p)}
<p style="${p}">For any queries, feel free to reach out to us at <a href="tel:${esc(brand.phone.replace(/[^\d+]/g, ""))}" style="color:${color};font-weight:600;text-decoration:none">(${esc(brand.phone)})</a> or simply reply to this email.</p>
${signature ? `<p style="margin:26px 0 4px;font-size:15px;color:#1f2937">Best Regards,</p>
<p style="margin:0 0 28px;font-size:15px;line-height:1.5;color:#1f2937"><strong>${esc(signature.name)}</strong><br><span style="color:#6b7280">${esc(signature.title)}</span></p>` : ""}
</td></tr>
<tr><td style="padding:18px 32px 22px;background:#f8fafc;border-top:1px solid #eef0f4;text-align:center;${FONT}">
<p style="margin:0 0 4px;font-size:12px;color:#6b7280">© ${year} ${esc(brand.company)}. All rights reserved.</p>
<p style="margin:0;font-size:12px"><a href="${esc(brand.website)}" style="color:#6b7280;text-decoration:underline">${esc(brand.website.replace(/^https?:\/\//, ""))}</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

  const text = [
    email.message.trim(),
    "",
    ...(rows.length ? [`${heading ? `${heading}:` : ""}`, "", ...rows.map(([k, val]) => `${k}: ${val}`), ""] : []),
    ...(button ? [`${button.label}: ${button.href}`, ""] : []),
    email.closing.trim(),
    "",
    `For any queries, feel free to reach out to us at (${brand.phone}) or simply reply to this email.`,
    ...(signature ? ["", "Best Regards,", "", signature.name, signature.title] : []),
    "",
    `© ${year} ${brand.company}. All rights reserved.`,
  ].join("\n");

  return { subject: email.subject, html, text };
}

/**
 * The extra details for a status as HR typed them. Every field is optional and
 * taken as typed (no date, time, link, email or phone checks); only each
 * value's length is capped, matching the boxes' 500-character limit.
 */
export function cleanExtras(status: ApplicationStatus, extras: Extras): Extras {
  const out: Extras = {};
  for (const f of STATUS_FIELDS[status]) out[f.key] = (extras[f.key] ?? "").trim().slice(0, 500);
  return out;
}
