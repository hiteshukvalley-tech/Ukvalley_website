import { randomUUID } from "node:crypto";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { isApplicationStatus, type ApplicationStatus } from "@/lib/applications-validation";

// A log of every Careers email: the HR notice and the applicant's thank-you
// sent when someone applies, and the hiring-status emails HR sends from the
// admin. One line per email, sent or failed. Shown in Admin → Careers →
// Email logs. Server-only.

const COLLECTION = "emailLogs";

export const EMAIL_KINDS = ["application-hr", "application-thanks", "status", "manual", "chat"] as const;
export type EmailKind = (typeof EMAIL_KINDS)[number];

export const emailKindLabel: Record<EmailKind, string> = {
  "application-hr": "New application (to HR)",
  "application-thanks": "Thank-you (to applicant)",
  status: "Status update (to applicant)",
  manual: "Manual email",
  chat: "Chat message",
};

export const isEmailKind = (v: unknown): v is EmailKind => typeof v === "string" && (EMAIL_KINDS as readonly string[]).includes(v);

export type EmailLog = {
  id: string;
  kind: EmailKind;
  /** the address the email went to */
  to: string;
  subject: string;
  /** the application it is about; empty for a manual email to someone without one */
  applicationId: string;
  applicantName: string;
  applicantEmail: string;
  position: string;
  /** the application status the email was about */
  status: ApplicationStatus;
  result: "sent" | "failed";
  /** why it failed */
  error?: string;
  /** the admin who sent it (status emails); empty for automatic ones */
  sentBy: string;
  /** what HR wrote (message and closing), shown in the chat; missing on older lines */
  body?: string;
  at: Date;
};

type Doc = Omit<EmailLog, "id"> & { _id: string };

const col = () => getDb().collection<Doc>(COLLECTION);

/** Adds a line to the log. Never throws: a missing log line must not fail an email. */
export async function logEmail(entry: Omit<EmailLog, "id" | "at">): Promise<void> {
  if (!hasDatabaseUrl()) return;
  try {
    await col().insertOne({
      _id: randomUUID(),
      ...entry,
      error: entry.error?.slice(0, 500),
      ...(entry.body ? { body: entry.body.slice(0, 5000) } : {}),
      at: new Date(),
    });
  } catch (e) {
    console.error("[email-logs] Could not log an email:", e instanceof Error ? e.message : e);
  }
}

export type EmailLogCounts = { all: number; sent: number; failed: number };

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** India has no daylight saving, so a day always starts at 00:00 +05:30. */
const dayStart = (day: string) => new Date(`${day}T00:00:00+05:30`);
const DAY_MS = 24 * 60 * 60 * 1000;

/** Per-column filters from the table header; text ones match anywhere, ignoring case. */
export type EmailLogColumns = {
  name?: string;
  email?: string;
  position?: string;
  subject?: string;
  to?: string;
  sentBy?: string;
  /** an application status, matched exactly */
  status?: string;
};

const COLUMN_FIELDS = {
  name: "applicantName",
  email: "applicantEmail",
  position: "position",
  subject: "subject",
  to: "to",
  sentBy: "sentBy",
} as const;

/** The admin list, newest first, with sent / failed counts for the other filters. */
export async function listEmailLogs(query: {
  q?: string;
  kind?: string;
  result?: string;
  /** one day, YYYY-MM-DD in India time */
  date?: string;
  columns?: EmailLogColumns;
  page?: number;
  pageSize?: number;
}): Promise<{ items: EmailLog[]; total: number; counts: EmailLogCounts; dbError?: string }> {
  const empty = { all: 0, sent: 0, failed: 0 };
  if (!hasDatabaseUrl()) return { items: [], total: 0, counts: empty, dbError: "MONGODB_URI is not set." };

  const pageSize = query.pageSize ?? 25;
  const page = Math.max(1, query.page ?? 1);
  const base: Record<string, unknown> = {};
  if (isEmailKind(query.kind)) base.kind = query.kind;
  if (query.date) base.at = { $gte: dayStart(query.date), $lt: new Date(dayStart(query.date).getTime() + DAY_MS) };
  const needle = query.q?.trim();
  if (needle) {
    const rx = { $regex: escapeRegex(needle.slice(0, 100)), $options: "i" };
    base.$or = [{ applicantName: rx }, { applicantEmail: rx }, { to: rx }, { subject: rx }, { position: rx }];
  }
  const columns: Record<string, unknown>[] = [];
  for (const [key, field] of Object.entries(COLUMN_FIELDS)) {
    const v = query.columns?.[key as keyof typeof COLUMN_FIELDS]?.trim();
    // Emails sent when someone applies have no sender; the table shows them as "Automatic".
    if (v && key === "sentBy" && v.length >= 4 && "automatic".startsWith(v.toLowerCase())) columns.push({ sentBy: "" });
    else if (v) columns.push({ [field]: { $regex: escapeRegex(v.slice(0, 100)), $options: "i" } });
  }
  if (isApplicationStatus(query.columns?.status)) columns.push({ status: query.columns.status });
  if (columns.length) base.$and = columns;
  const filter: Record<string, unknown> = { ...base };
  if (query.result === "sent" || query.result === "failed") filter.result = query.result;

  try {
    const [docs, total, byResult] = await Promise.all([
      col().find(filter).sort({ at: -1 }).skip((page - 1) * pageSize).limit(pageSize).toArray(),
      col().countDocuments(filter),
      col().aggregate<{ _id: string; n: number }>([{ $match: base }, { $group: { _id: "$result", n: { $sum: 1 } } }]).toArray(),
    ]);
    const counts = { ...empty };
    for (const g of byResult) {
      if (g._id === "sent" || g._id === "failed") counts[g._id] = g.n;
      counts.all += g.n;
    }
    return { items: docs.map(({ _id, ...rest }) => ({ ...rest, id: _id })), total, counts };
  } catch (e) {
    return { items: [], total: 0, counts: empty, dbError: e instanceof Error ? e.message : "Could not read the email logs." };
  }
}

/**
 * Every email sent to one applicant (by address, ignoring case), oldest first:
 * the HR side of their chat in Admin → Careers → Email logs. The HR notice
 * about their application went to HR, not to them, so it is left out.
 */
export async function listConversationEmails(email: string): Promise<{ items: EmailLog[]; dbError?: string }> {
  if (!hasDatabaseUrl()) return { items: [], dbError: "MONGODB_URI is not set." };
  const address = email.trim().slice(0, 200);
  if (!address) return { items: [] };
  try {
    const docs = await col()
      .find({ applicantEmail: { $regex: `^${escapeRegex(address)}$`, $options: "i" }, kind: { $ne: "application-hr" } })
      .sort({ at: 1 })
      .limit(300)
      .toArray();
    return { items: docs.map(({ _id, ...rest }) => ({ ...rest, id: _id })) };
  } catch (e) {
    return { items: [], dbError: e instanceof Error ? e.message : "Could not read the emails." };
  }
}
