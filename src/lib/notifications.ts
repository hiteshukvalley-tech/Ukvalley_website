import type { SessionUser } from "@/lib/admin-auth";
import { listApplications } from "@/lib/applications-store";
import { listInterviews } from "@/lib/interviews-store";
import { listApplicantReplies, REPLY_WINDOW_DAYS } from "@/lib/inbox-replies";
import { getSmtpConfig, getSmtpConfigFor } from "@/lib/smtp-settings";
import { getProfile } from "@/lib/profiles-store";
import { todayInIndia } from "@/lib/careers-shared";

// The admin top bar's notification bell: new job applications (last 3 days),
// today's interviews and applicants' emails to HR (last week, read from the
// inbox). Server-only; the bell loads it through a server action.

export type NotificationKind = "application" | "interview" | "reply";

export type AdminNotification = {
  key: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  /** when it happened, ms since epoch (an interview's is when it was scheduled) */
  at: number;
  /** HH:MM for today's interviews, else "" (the bell shows "x min ago") */
  time: string;
  href: string;
  /** newer than the user's last "Mark all as read" */
  unread: boolean;
};

export type NotificationFeed = {
  items: AdminNotification[];
  unread: number;
  /** problems reading the database or a mailbox */
  problems: string[];
  /** false when no HR email (SMTP) is set up, so replies can't be read */
  mailbox: boolean;
};

export const APPLICATION_DAYS = 3;
export { REPLY_WINDOW_DAYS };
const MAX_ITEMS = 30;

const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export async function getNotifications(me: SessionUser): Promise<NotificationFeed> {
  const today = todayInIndia();
  const [hr, own] = await Promise.all([getSmtpConfig(), getSmtpConfigFor(me.id)]);
  // The HR mailbox, plus the user's own when they send from it (replies to their emails land there).
  const mailboxes = [hr?.config, own?.source === "user" ? own.config : undefined].filter((c) => !!c);
  const [applications, interviews, replies, profile] = await Promise.all([
    listApplications({ from: addDays(today, -(APPLICATION_DAYS - 1)), to: today, pageSize: MAX_ITEMS }),
    listInterviews({ from: today, to: today }),
    mailboxes.length ? listApplicantReplies(mailboxes) : Promise.resolve({ items: [], error: undefined }),
    getProfile(me),
  ]);
  const seen = profile.notificationsSeenAt?.getTime() ?? 0;

  type Draft = Omit<AdminNotification, "unread">;
  // Today's interviews first (in time order), then everything else, newest first.
  const pinned: Draft[] = interviews.items.map((i) => ({
    key: `i-${i.applicationId}`,
    kind: "interview",
    title: `${i.name} · ${i.position}`,
    detail: [i.mode, i.venue].filter(Boolean).join(" · ") || "Interview scheduled for today",
    at: new Date(i.scheduledAt).getTime(),
    time: i.time,
    href: `/admin/applications/${i.applicationId}`,
  }));
  const feed: Draft[] = [
    ...applications.items.map((a): Draft => ({
      key: `a-${a.id}`,
      kind: "application",
      title: `${a.name} applied for ${a.position}`,
      detail: [a.experience, a.location].filter(Boolean).join(" · "),
      at: a.createdAt.getTime(),
      time: "",
      href: `/admin/applications/${a.id}`,
    })),
    ...replies.items.map((r): Draft => ({
      key: `r-${r.id}`,
      kind: "reply",
      title: `${r.fromName || r.fromEmail} sent a message`,
      detail: `${r.subject || "(no subject)"} · ${r.position}`,
      at: r.receivedAt.getTime(),
      time: "",
      // opens the chat with this applicant in Email logs
      href: `/admin/email-logs?chat=${encodeURIComponent(r.fromEmail)}`,
    })),
  ].sort((a, b) => b.at - a.at);

  const items = [...pinned, ...feed].slice(0, MAX_ITEMS).map((n) => ({ ...n, unread: n.at > seen }));
  return {
    items,
    unread: items.filter((n) => n.unread).length,
    problems: [applications.dbError, interviews.dbError, replies.error].filter((p): p is string => !!p),
    mailbox: mailboxes.length > 0,
  };
}
