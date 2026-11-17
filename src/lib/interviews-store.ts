import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { INTERVIEW_STATUSES, isInterviewStatus, type ApplicationStatus } from "@/lib/applications-validation";
import type { InterviewCancellation, StatusEmailRecord } from "@/lib/applications-store";

// Interviews come from the job applications: when HR moves an applicant to
// "Interview Scheduled", "Interview Rescheduled" or "Next Round" (or, before
// those existed, "Shortlisted") and sends the status email, the interview date, time, mode and
// venue are saved with that email (applications.statusEmails[].details). An
// applicant's interview is the one in the latest such email, so sending a new
// one reschedules it (so does Reschedule on the interviews lists, which saves
// the new details the same way). Cancel marks the current interview cancelled
// until a new one is set. Shown in Admin → Careers → Daily interviews and, for
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
  /** HR cancelled this interview */
  cancelled: boolean;
  cancelReason: string;
  /** every detail of the latest interview entry (round, interviewer…), kept when rescheduling */
  details: Record<string, string>;
};

type Doc = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  status: ApplicationStatus;
  statusEmails?: StatusEmailRecord[];
  interviewCancelled?: InterviewCancellation;
};

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const hasInterview = (e: StatusEmailRecord) => isInterviewStatus(e.status) && !!e.details?.interviewDate?.trim();

/** The applicant's current interview (latest interview email), or null. */
function interviewOf(d: Doc): Interview | null {
  const sent = (d.statusEmails ?? []).filter(hasInterview);
  const last = sent[sent.length - 1];
  if (!last?.details) return null;
  const x = last.details;
  // A cancellation counts for the interview it was made on: one set after it is live again.
  const cancel = d.interviewCancelled;
  const cancelled = !!cancel && new Date(cancel.at).getTime() >= new Date(last.sentAt).getTime();
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
    cancelled,
    cancelReason: cancelled ? (cancel?.reason ?? "").trim() : "",
    details: { ...x },
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
    // An older email may match the range while the interview was moved to
    // another day, so the latest interview email's date is matched again in
    // the database, before the cap: the cap then only counts real matches.
    const trimmed = (v: unknown) => ({ $trim: { input: { $ifNull: [v, ""] } } });
    const docs = await getDb()
      .collection<Doc>("applications")
      .aggregate<Doc>([
        { $match: filter },
        {
          $addFields: {
            _interview: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: { $ifNull: ["$statusEmails", []] },
                    as: "e",
                    cond: { $and: [{ $in: ["$$e.status", [...INTERVIEW_STATUSES]] }, { $ne: [trimmed("$$e.details.interviewDate"), ""] }] },
                  },
                },
                -1,
              ],
            },
          },
        },
        { $match: { $expr: { $and: [{ $gte: [trimmed("$_interview.details.interviewDate"), from] }, { $lte: [trimmed("$_interview.details.interviewDate"), to] }] } } },
        { $limit: 2000 },
        { $project: { name: 1, email: 1, phone: 1, position: 1, status: 1, statusEmails: 1, interviewCancelled: 1 } },
      ])
      .toArray();
    const items = docs
      .map(interviewOf)
      .filter((i): i is Interview => !!i && i.date >= from && i.date <= to)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || "99:99").localeCompare(b.time || "99:99") || a.name.localeCompare(b.name));
    return { items };
  } catch (e) {
    return { items: [], dbError: e instanceof Error ? e.message : "Could not read interviews." };
  }
}

/** When an interview starts (ms since epoch), from its India-time day and HH:MM; null without a time. */
export function interviewStartsAt(i: Pick<Interview, "date" | "time">): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(i.time);
  if (!m) return null;
  const t = Date.parse(`${i.date}T${m[1].padStart(2, "0")}:${m[2]}:00+05:30`);
  return Number.isNaN(t) ? null : t;
}
