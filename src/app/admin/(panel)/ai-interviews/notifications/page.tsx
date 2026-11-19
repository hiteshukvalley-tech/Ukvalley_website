import Link from "@/components/site/intent-link";
import { BellRing } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin-session";
import { listFailedJobs } from "@/lib/ai-interview/jobs";
import { listNotifications, type Channel, type NotificationStatus } from "@/lib/ai-interview/store";
import { isNotificationKind, notificationKindLabel } from "@/lib/ai-interview/templates";
import { DbError, fmt } from "../ui";
import { RetryButton } from "./retry-button";

export const metadata = { title: "Interview notifications" };
export const dynamic = "force-dynamic";

const CHANNELS: Channel[] = ["email", "whatsapp", "calendar"];
const STATUSES: NotificationStatus[] = ["queued", "sent", "delivered", "read", "failed", "skipped"];
const PAGE = 50;
const JOB_LABEL: Record<string, string> = {
  notify: "Notification", calendar: "Calendar update", plan: "Writing the questions", evaluate: "AI evaluation",
  close_window: "Closing the link", purge_recordings: "Deleting an old recording",
};
const select = "h-10 rounded-lg border border-input bg-transparent px-3 text-sm text-uk-body outline-none focus-visible:border-ring";

/** Every invitation, reminder, calendar change and HR notice, with its delivery result. */
export default async function NotificationsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin("ai-interviews");
  const sp = await searchParams;
  const channel = CHANNELS.includes(sp.channel as Channel) ? (sp.channel as Channel) : "";
  const status = STATUSES.includes(sp.status as NotificationStatus) ? (sp.status as NotificationStatus) : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const [{ items, total, dbError }, failedJobs] = await Promise.all([
    listNotifications({ channel, status, page, pageSize: PAGE }),
    listFailedJobs(30).catch(() => []),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const link = (p: number) => `/admin/ai-interviews/notifications?${new URLSearchParams({ ...(channel ? { channel } : {}), ...(status ? { status } : {}), page: String(p) })}`;

  return (
    <>
      <PageHeader
        title="Interview notifications"
        crumbs={[{ label: "AI interviews", href: "/admin/ai-interviews" }, { label: "Notifications" }]}
        description="Emails, WhatsApp messages and calendar updates sent for AI interviews. Failed ones are retried automatically (up to 4 times); you can also send one again."
      />
      <form method="get" className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-uk-line bg-uk-card p-4">
        <select name="channel" defaultValue={channel} className={select} aria-label="Channel">
          <option value="">All channels</option>
          {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select name="status" defaultValue={status} className={select} aria-label="Status">
          <option value="">Any status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="submit" className="h-10 rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body hover:bg-uk-surface-2">Show</button>
      </form>
      <DbError message={dbError && `Could not read the log (${dbError}).`} />
      {failedJobs.length > 0 && (
        <section aria-labelledby="failed-jobs" className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
          <h2 id="failed-jobs" className="font-heading text-base font-semibold text-uk-heading">Failed background jobs ({failedJobs.length})</h2>
          <p className="mt-1 text-xs text-uk-muted">Work that stopped after its retries: question writing, evaluations, calendar updates, link closing. Fix the cause (API key, mail server), then run it again.</p>
          <ul className="mt-3 divide-y divide-uk-line">
            {failedJobs.map((j) => (
              <li key={j._id} className="flex flex-wrap items-start justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0">
                  <span className="font-medium text-uk-heading">{JOB_LABEL[j.kind] ?? j.kind}</span>{" "}
                  <Link href={`/admin/ai-interviews/${j.interviewId}`} className="text-uk-blue hover:underline">open interview</Link>
                  <span className="block text-xs text-uk-muted">{fmt(j.updatedAt)} · {j.attempts} tries{j.lastError ? ` · ${j.lastError}` : ""}</span>
                </span>
                <RetryButton id={j._id} job label="Run again" />
              </li>
            ))}
          </ul>
        </section>
      )}
      {!dbError && items.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-uk-line bg-uk-card p-10 text-center">
          <BellRing className="mx-auto mb-3 h-8 w-8 text-uk-muted" />
          <h2 className="font-heading text-lg font-semibold text-uk-heading">No notifications {channel || status ? "match" : "yet"}</h2>
        </section>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-uk-line bg-uk-card">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-uk-line text-left text-xs uppercase tracking-wide text-uk-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Sent / updated</th>
                <th className="px-4 py-3 font-medium">Candidate</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-4 py-3 font-medium">Recipient</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Tries</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-uk-line">
              {items.map((n) => (
                <tr key={n.id} className="align-top">
                  <td className="px-4 py-3 text-uk-body">{fmt(n.sentAt ?? n.updatedAt)}</td>
                  <td className="px-4 py-3"><Link href={`/admin/ai-interviews/${n.interviewId}`} className="text-uk-heading hover:text-uk-blue">{n.candidateName}</Link></td>
                  <td className="px-4 py-3 text-uk-body">{isNotificationKind(n.kind) ? notificationKindLabel[n.kind] : n.kind.replace("_", " ")}{n.detail ? <span className="block text-xs text-uk-muted">{n.detail}</span> : null}</td>
                  <td className="px-4 py-3 text-uk-body">{n.channel}</td>
                  <td className="px-4 py-3 text-uk-body">{n.recipient}</td>
                  <td className="px-4 py-3">
                    <span className={n.status === "failed" ? "font-medium text-red-700 dark:text-red-400" : n.status === "skipped" ? "text-uk-muted" : "text-uk-body"}>{n.status}</span>
                    {n.error && <span className="block max-w-xs text-xs text-uk-muted">{n.error}</span>}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-uk-body">{n.attempts}</td>
                  <td className="px-4 py-3 text-right">{n.status === "failed" && <RetryButton id={n.id} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <nav aria-label="Pages" className="mt-4 flex items-center justify-between text-sm text-uk-muted">
          <span>Page {page} of {pages}</span>
          <span className="flex gap-2">
            {page > 1 && <Link href={link(page - 1)} className="rounded-lg border border-uk-line px-3 py-1.5">Previous</Link>}
            {page < pages && <Link href={link(page + 1)} className="rounded-lg border border-uk-line px-3 py-1.5">Next</Link>}
          </span>
        </nav>
      )}
    </>
  );
}
