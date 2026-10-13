import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { INTERVIEW_STATUSES, isInterviewStatus, type ApplicationStatus } from "@/lib/applications-validation";
import type { StatusEmailRecord } from "@/lib/applications-store";

// Interviews come from the job applications: when HR moves an applicant to
// "Shortlisted for Interview", "Next Round Interview Scheduled" or "Interview
// Rescheduled" and sends the status email, the interview date, time, mode and
// venue are saved with that email (applications.statusEmails[].details). An
// applicant's interview is the one in the latest such email, so sending a new
// one reschedules it. Shown in Admin → Careers → Daily interviews and, for
// today, on the Dashboard. Server-only.

export type Interview = {
  applicationId: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  /** the application's current status (may have moved on since the interview was set) */
  status: ApplicationStatus;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM, or "" when not given */
  time: string;
  mode: string;
  venue: string;
  agenda: string;
  /** email of the admin who sent the interview email */
  scheduledBy: string;
  scheduledAt: Date;
  /** true when more than one interview email was sent (it was rescheduled) */
  rescheduled: boolean;
};

type Doc = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  status: ApplicationStatus;
  statusEmails?: StatusEmailRecord[];
};

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const hasInterview = (e: StatusEmailRecord) => isInterviewStatus(e.status) && !!e.details?.interviewDate?.trim();

/** The applicant's current interview (latest interview email), or null. */
function interviewOf(d: Doc): Interview | null {
  const sent = (d.statusEmails ?? []).filter(hasInterview);
  const last = sent[sent.length - 1];
  if (!last?.details) return null;
  const x = last.details;
  return {
    applicationId: d._id,
    name: d.name,
    email: d.email,
    phone: d.phone,
    position: d.position,
    status: d.status,
    date: x.interviewDate.trim(),
    time: (x.interviewTime ?? "").trim(),
    mode: (x.interviewMode ?? "").trim(),
    venue: (x.interviewVenue ?? "").trim(),
    agenda: (x.interviewAgenda ?? "").trim(),
    scheduledBy: last.sentBy,
    scheduledAt: last.sentAt,
    rescheduled: sent.length > 1,
  };
}

/**
 * Interviews from `from` to `to` (YYYY-MM-DD, both included), earliest first
 * (by day, then time; interviews without a time come last in their day).
 * `q` searches name, email, phone and position.
 */
export async function listInterviews(query: { from: string; to: string; q?: string }): Promise<{
  items: Interview[];
  dbError?: string;
}> {
  if (!hasDatabaseUrl()) return { items: [], dbError: "MONGODB_URI is not set." };
  const { from, to } = query;
  // Dates are stored as YYYY-MM-DD, so comparing them as text compares the days.
  const filter: Record<string, unknown> = {
    statusEmails: { $elemMatch: { status: { $in: [...INTERVIEW_STATUSES] }, "details.interviewDate": { $gte: from, $lte: to } } },
  };
  const needle = query.q?.trim();
  if (needle) {
    const rx = { $regex: escapeRegex(needle.slice(0, 100)), $options: "i" };
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }, { position: rx }];
  }
  try {
    const docs = await getDb()
      .collection<Doc>("applications")
      .find(filter, { projection: { name: 1, email: 1, phone: 1, position: 1, status: 1, statusEmails: 1 } })
      .limit(2000)
      .toArray();
    // An older email may match the range while the interview was moved to another day.
    const items = docs
      .map(interviewOf)
      .filter((i): i is Interview => !!i && i.date >= from && i.date <= to)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || "99:99").localeCompare(b.time || "99:99") || a.name.localeCompare(b.name));
    return { items };
  } catch (e) {
    return { items: [], dbError: e instanceof Error ? e.message : "Could not read interviews." };
  }
}
