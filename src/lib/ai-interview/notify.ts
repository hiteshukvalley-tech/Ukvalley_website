import "server-only";
import { escapeHtml, hasMailer, sendMail } from "@/lib/mailer";
import { getSiteSettings } from "@/lib/settings";
import { API_URL, SITE_URL } from "@/lib/site-origin";
import { integrationKey } from "@/lib/integration-keys";
import { decryptText } from "./crypto";
import { calendarStatus } from "./google-calendar";
import { buildIcs } from "./ics";
import { getAiSettings } from "./settings-store";
import { logNotification, type InterviewRecord } from "./store";
import { PermanentJobError } from "./jobs";
import { isEmailOnlyKind, renderTemplate, type NotificationKind, type TemplateVars } from "./templates";
import { formatInZone, recommendationLabel, reminderLabel, type ReminderOffset } from "./types";
import { WhatsAppError, sendWhatsAppTemplate, toWhatsAppNumber, whatsappConfigured } from "./whatsapp";

// Sends one interview notification on one channel, and logs the result in
// aiNotificationLogs. Server-only. Called by the "notify" background job, so a
// failure throws and the job retries (PermanentJobError when retrying can't help).

/**
 * Hosts INTERVIEW_BASE_URL may point at: this site (with or without www.),
 * the backend, Render's own address and this machine. HR staff can edit the
 * value in Settings → API keys, so it must never send candidates (and their
 * interview tokens) to a domain someone else controls.
 */
function isOwnInterviewHost(host: string): boolean {
  const bare = (h: string) => h.toLowerCase().replace(/^www\./, "");
  const own = [SITE_URL, API_URL]
    .map((u) => { try { return bare(new URL(u).hostname); } catch { return ""; } })
    .filter(Boolean);
  const render = (process.env.RENDER_EXTERNAL_HOSTNAME ?? "").trim().toLowerCase();
  if (render) own.push(render);
  return own.includes(bare(host)) || /^(?:localhost|127\.0\.0\.1)$/i.test(host);
}

/** The public address interview links point to (INTERVIEW_BASE_URL overrides it for local testing). */
export const interviewBaseUrl = () => {
  const override = integrationKey("INTERVIEW_BASE_URL").replace(/\/+$/, "");
  if (!override) return SITE_URL;
  try {
    if (isOwnInterviewHost(new URL(override).hostname)) return override;
  } catch {}
  console.warn("[ai-interview] INTERVIEW_BASE_URL is not this site's address; using SITE_URL instead.");
  return SITE_URL;
};

/** The candidate's link, rebuilt from the encrypted token. Null when there is none. */
export function interviewLink(i: Pick<InterviewRecord, "tokenEnc">): string | null {
  const token = i.tokenEnc ? decryptText(i.tokenEnc, "link") : null;
  return token ? `${interviewBaseUrl()}/interview/${token}` : null;
}

export const adminInterviewUrl = (id: string) => `${API_URL}/admin/ai-interviews/${id}`;

/** "in about 3 hours", "in 20 minutes", "now": for HR's "Send reminder now" (no fixed offset). */
function untilStart(i: InterviewRecord): string {
  if (!i.schedule) return "soon";
  const min = Math.round((i.schedule.startsAt.getTime() - Date.now()) / 60_000);
  if (min <= 5) return "now";
  if (min < 90) return `in ${min} minutes`;
  if (min < 48 * 60) return `in about ${Math.round(min / 60)} hours`;
  return `in ${Math.round(min / 1440)} days`;
}

/**
 * How long the link stays open, from the interview's own schedule: "24 hours",
 * or for a right-away link open for days, "3 days (until Sun, 22 Nov, 11:59 pm (IST))".
 */
function joinWindowText(i: InterviewRecord): string {
  const hours = i.schedule ? Math.round((i.schedule.closesAt.getTime() - i.schedule.startsAt.getTime()) / 3600_000) : i.config.joinWindowHours;
  if (hours <= 30 || !i.schedule) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} (until ${formatInZone(i.schedule.closesAt, i.candidate.timeZone)})`;
}

/** "in about 24 hours", "in 3 hours": time left before a right-away link closes. */
function untilClose(i: InterviewRecord): string {
  if (!i.schedule) return "soon";
  const min = Math.max(1, Math.round((i.schedule.closesAt.getTime() - Date.now()) / 60_000));
  if (min < 90) return `in ${min} minutes`;
  return `in about ${Math.round(min / 60)} hours`;
}

async function varsFor(i: InterviewRecord, extra: { offset?: ReminderOffset; reason?: string; closing?: boolean }): Promise<TemplateVars> {
  const settings = await getSiteSettings();
  const r = i.evaluation.result;
  const rec = i.hr.recommendationOverride ?? r?.recommendation;
  return {
    candidateName: i.candidate.name.replace(/\s+/g, " ").trim().slice(0, 60),
    jobTitle: i.position,
    companyName: settings.name,
    interviewDate: i.schedule ? formatInZone(i.schedule.startsAt, i.candidate.timeZone) : "",
    interviewDateIst: i.schedule ? formatInZone(i.schedule.startsAt, "Asia/Kolkata") : "",
    duration: `${i.config.durationMinutes} minutes`,
    interviewLink: interviewLink(i) ?? "",
    joinWindow: joinWindowText(i),
    reminderWhen: extra.closing ? `now (your link closes ${untilClose(i)})` : extra.offset === undefined ? untilStart(i) : extra.offset === 0 ? "now" : `in ${reminderLabel[extra.offset].replace(/ before$/, "")}`,
    hrEmail: settings.hr.email || settings.email,
    hrPhone: settings.hr.phone ? `or call ${settings.hr.phone}` : "",
    reason: extra.reason ? `Reason: ${extra.reason}` : "",
    score: r ? `${r.overall}/100` : "",
    recommendation: rec ? recommendationLabel[rec] : "",
    adminLink: adminInterviewUrl(i.id),
  };
}

/**
 * Plain text → simple branded HTML: paragraphs, line breaks, and our own links
 * made clickable. Only addresses on this site's hosts become links: a web
 * address typed by a candidate (in their name, say) stays plain text, so an
 * email can't carry a clickable link to somewhere else.
 */
function toHtml(text: string, company: string): string {
  const ownHosts = new Set([SITE_URL, API_URL, interviewBaseUrl()].map((u) => { try { return new URL(u).host; } catch { return ""; } }).filter(Boolean));
  const linkify = (s: string) =>
    s.replace(/https?:\/\/[^\s<]+/g, (u) => {
      let host = "";
      try { host = new URL(u.replace(/&amp;/g, "&")).host; } catch {}
      return ownHosts.has(host) ? `<a href="${u}" style="color:#3100ff;word-break:break-all">${u}</a>` : u;
    });
  const body = text
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px">${linkify(escapeHtml(p)).replace(/\n/g, "<br>")}</p>`)
    .join("");
  return `<div style="background:#f5f6fb;padding:24px 12px;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e5e7eb;font-size:15px;line-height:1.6;color:#1f2937">
<img src="${SITE_URL}/brand/ukvalley-logo.png" alt="${escapeHtml(company)}" height="36" style="display:block;margin:0 0 20px;height:36px">
${body}
<p style="margin:20px 0 0;color:#6b7280;font-size:13px">${escapeHtml(company)} · HR Team</p>
</div></div>`;
}

/** The calendar file for invitations, reschedules and cancellations. */
function icsFor(i: InterviewRecord, kind: NotificationKind, company: string, hrEmail: string, link: string) {
  if (!i.schedule || !["invite", "rescheduled", "cancelled"].includes(kind) || !hrEmail) return null;
  const end = new Date(i.schedule.startsAt.getTime() + i.config.durationMinutes * 60_000);
  return buildIcs({
    uid: `ai-interview-${i.id}@ukvalley`,
    sequence: i.schedule.version,
    method: kind === "cancelled" ? "CANCEL" : "REQUEST",
    start: i.schedule.startsAt,
    end,
    summary: `AI interview: ${i.position} (${company})`,
    description: kind === "cancelled" ? "This interview was cancelled." : `Your private interview link: ${link}\nUse Chrome or Edge with a camera and microphone.`,
    url: link || SITE_URL,
    organizer: { name: `${company} HR`, email: hrEmail },
    attendee: { name: i.candidate.name, email: i.candidate.email },
  });
}

export type NotifyJob = { kind: NotificationKind; channel: "email" | "whatsapp"; offset?: ReminderOffset; reason?: string; logId: string;
  /** a right-away interview not taken yet: "the link closes soon" reminder, due `offset` minutes before the link closes */
  closing?: boolean };

export async function sendNotification(i: InterviewRecord, job: NotifyJob): Promise<void> {
  const { templates } = await getAiSettings();
  const vars = await varsFor(i, job);
  const base = { id: job.logId, interviewId: i.id, applicationId: i.applicationId, candidateName: i.candidate.name, channel: job.channel, kind: job.kind, detail: job.offset !== undefined ? (job.closing ? `${reminderLabel[job.offset]} the link closes` : reminderLabel[job.offset]) : undefined } as const;

  // Interview links only go out while the interview can be taken.
  const needsLink = job.kind === "invite" || job.kind === "reminder" || job.kind === "rescheduled" || job.kind === "missed";
  if (needsLink && !vars.interviewLink) {
    await logNotification({ ...base, recipient: i.candidate.email, status: "skipped", error: "The interview has no active link." });
    return;
  }

  if (job.channel === "email") {
    const settings = await getSiteSettings();
    const to = job.kind === "hr_evaluation" ? settings.hr.email || settings.email : i.candidate.email;
    if (!(await hasMailer())) {
      await logNotification({ ...base, recipient: to, status: "failed", error: "Email (SMTP) is not configured." });
      throw new PermanentJobError("Email (SMTP) is not configured.");
    }
    const tpl = templates.email[job.kind];
    const subject = renderTemplate(tpl.subject, vars).replace(/\s+/g, " ").slice(0, 200);
    const text = renderTemplate(tpl.body, vars);
    // With Google Calendar connected, Google sends its own invitation: a second
    // calendar file would put the interview in the candidate's calendar twice.
    const google = i.config.channels.calendar ? await calendarStatus() : null;
    const googleSends = Boolean(google?.connected && !google.unreadable);
    const ics = job.kind === "hr_evaluation" || googleSends ? null : icsFor(i, job.kind, settings.name, settings.hr.email || settings.email, vars.interviewLink ?? "");
    try {
      await sendMail({
        to,
        subject,
        text,
        html: toHtml(text, settings.name),
        fromName: `${settings.name} HR Team`,
        replyTo: settings.hr.email || undefined,
        ...(ics
          ? { attachments: [{ filename: job.kind === "cancelled" ? "interview-cancelled.ics" : "interview.ics", content: Buffer.from(ics, "utf8"), contentType: `text/calendar; charset=utf-8; method=${job.kind === "cancelled" ? "CANCEL" : "REQUEST"}` }] }
          : {}),
      });
      await logNotification({ ...base, recipient: to, status: "sent" });
    } catch (e) {
      await logNotification({ ...base, recipient: to, status: "failed", error: e instanceof Error ? e.message : String(e) });
      throw e;
    }
    return;
  }

  // WhatsApp: only with the candidate's consent, and a template for this kind.
  if (isEmailOnlyKind(job.kind)) return;
  const to = toWhatsAppNumber(i.candidate.phone);
  if (!i.candidate.whatsappOptIn) {
    await logNotification({ ...base, recipient: i.candidate.phone, status: "skipped", error: "The candidate did not agree to WhatsApp messages." });
    return;
  }
  if (!whatsappConfigured()) {
    await logNotification({ ...base, recipient: i.candidate.phone, status: "skipped", error: "WhatsApp is not configured." });
    return;
  }
  if (!to) {
    await logNotification({ ...base, recipient: i.candidate.phone, status: "failed", error: "The phone number can't receive WhatsApp messages." });
    return;
  }
  const tpl = templates.whatsapp[job.kind];
  try {
    const providerId = await sendWhatsAppTemplate(to, tpl, tpl.params.map((p) => vars[p] ?? ""));
    await logNotification({ ...base, recipient: `+${to}`, status: "sent", providerId });
  } catch (e) {
    await logNotification({ ...base, recipient: `+${to}`, status: "failed", error: e instanceof Error ? e.message : String(e) });
    if (e instanceof WhatsAppError && e.permanent) throw new PermanentJobError(e.message);
    throw e;
  }
}
