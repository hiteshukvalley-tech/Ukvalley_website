import Link from "@/components/site/intent-link";
import { Bot, CalendarCheck, CalendarClock, CalendarX, CheckCircle2, Gauge, Hourglass, Settings, Star, UserX } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { requireAdmin } from "@/lib/admin-session";
import { aiConfigured } from "@/lib/ai-interview/ai";
import { getAiSettings } from "@/lib/ai-interview/settings-store";
import { attentionCounts, dashboardStats } from "@/lib/ai-interview/store";
import { ATTENTION_QUEUES, attentionQueueInfo, interviewStatusLabel, isInterviewStatus } from "@/lib/ai-interview/types";
import { BarList, DbError, ExperienceBadge, Panel, StatusBadge, fmt } from "./ui";

export const metadata = { title: "AI interviews" };
export const dynamic = "force-dynamic";

/** AI Interview Management: numbers, charts, upcoming interviews and recent activity. */
export default async function AiInterviewsDashboard() {
  await requireAdmin("ai-interviews");
  const [s, { settings }, queues] = await Promise.all([dashboardStats(), getAiSettings(), attentionCounts()]);
  const waiting = ATTENTION_QUEUES.filter((q) => queues[q] > 0);
  const n = (k: string) => s.byStatus[k] ?? 0;
  const pending = n("unscheduled") + n("accommodation") + n("interrupted") + n("in_progress");
  const finished = n("completed") + n("missed") + n("expired");
  const completionRate = finished ? Math.round((n("completed") / finished) * 100) : null;

  return (
    <>
      <PageHeader
        title="AI interviews"
        crumbs={[{ label: "AI interviews" }]}
        description="First-round interviews run by the AI interviewer. Scores are recommendations: HR reviews every candidate and makes the decision."
        action={
          <Link href="/admin/ai-interviews/settings" className="inline-flex h-10 items-center gap-2 rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body hover:bg-uk-surface-2 hover:text-uk-heading">
            <Settings className="h-4 w-4" /> Settings
          </Link>
        }
      />

      {(!settings.enabled || !aiConfigured()) && (
        <div className="mb-6 rounded-2xl border border-uk-line bg-uk-card p-4 text-sm text-uk-body">
          <p className="font-medium text-uk-heading">
            {!settings.enabled ? "AI interviews are off: new applicants are not invited." : "The AI provider is not configured (ANTHROPIC_API_KEY)."}
          </p>
          <p className="mt-1 text-uk-muted">
            {!settings.enabled ? "Turn them on in " : "Add the key to the server's environment, then redeploy. See "}
            <Link href="/admin/ai-interviews/settings" className="text-uk-blue hover:underline">Settings</Link>.
          </p>
        </div>
      )}

      <DbError message={s.dbError && `Could not read interviews (${s.dbError}).`} />

      {/* What needs HR now: each queue opens the Schedule list filtered to it, where bulk actions apply. */}
      <section aria-labelledby="attention" className="mb-6 rounded-2xl border border-uk-line bg-uk-card p-5">
        <h2 id="attention" className="font-heading text-lg font-semibold text-uk-heading">Needs attention</h2>
        {waiting.length === 0 ? (
          <p className="mt-1 text-sm text-uk-muted">Nothing is waiting for you.</p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {waiting.map((q) => (
              <li key={q}>
                <Link href={`/admin/ai-interviews/schedule?queue=${q}`} className="flex items-start justify-between gap-3 rounded-xl border border-uk-line px-4 py-3 transition-colors hover:border-uk-blue/50 hover:bg-uk-surface-2">
                  <span>
                    <span className="block text-sm font-medium text-uk-heading">{attentionQueueInfo[q].label}</span>
                    <span className="mt-0.5 block text-xs text-uk-muted">{attentionQueueInfo[q].hint}</span>
                  </span>
                  <span className="rounded-full bg-uk-blue/10 px-2.5 py-0.5 text-sm font-semibold text-uk-blue">{queues[q]}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total interviews" value={s.total} icon={Bot} href="/admin/ai-interviews/schedule" />
        <StatCard label="Scheduled" value={n("scheduled")} icon={CalendarClock} href="/admin/ai-interviews/schedule?status=scheduled" />
        <StatCard label="Pending" value={pending} icon={Hourglass} hint="Not scheduled, in progress, interrupted or awaiting an alternative" />
        <StatCard label="Completed" value={n("completed")} icon={CheckCircle2} href="/admin/ai-interviews/schedule?status=completed" />
        <StatCard label="Cancelled" value={n("cancelled")} icon={CalendarX} href="/admin/ai-interviews/schedule?status=cancelled" />
        <StatCard label="No-shows" value={n("missed")} icon={UserX} href="/admin/ai-interviews/schedule?status=missed" />
        <StatCard label="Average score" value={s.averageScore ?? "—"} icon={Gauge} hint={s.evaluated ? `${s.evaluated} evaluated` : "No evaluations yet"} />
        <StatCard label="Recommended" value={s.recommended} icon={Star} hint="By the AI, or by HR's override" href="/admin/ai-interviews/schedule?recommendation=recommended" />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Interviews by job position">
          <BarList rows={s.byPosition.map((p) => ({ label: p.position, value: p.total, hint: `(${p.completed} done)` }))} />
        </Panel>
        <Panel title="Interview completion rate">
          {completionRate === null ? (
            <p className="py-6 text-center text-sm text-uk-muted">No interview has finished yet.</p>
          ) : (
            <div>
              <p className="font-heading text-5xl font-bold text-uk-heading">{completionRate}%</p>
              <p className="mt-1 text-sm text-uk-muted">
                of interviews whose time has passed were completed ({n("completed")} completed, {n("missed")} no-shows, {n("expired")} left unfinished).
              </p>
            </div>
          )}
        </Panel>
        <Panel title="Candidate score distribution">
          <BarList rows={s.scoreBuckets.map((b) => ({ label: `Score ${b.label}`, value: b.count }))} empty="No evaluations yet." />
        </Panel>
        <Panel title="Fresher and experienced candidates">
          <BarList rows={[{ label: "Fresher", value: s.byExperience.fresher }, { label: "Experienced", value: s.byExperience.experienced }]} />
        </Panel>
        <Panel title="Interview status overview">
          <BarList rows={Object.entries(s.byStatus).filter(([k]) => isInterviewStatus(k)).map(([k, v]) => ({ label: interviewStatusLabel[k as keyof typeof interviewStatusLabel], value: v })).sort((a, b) => b.value - a.value)} />
        </Panel>
        <Panel title="Upcoming interviews" action={<Link href="/admin/ai-interviews/schedule" className="text-sm text-uk-blue hover:underline">All</Link>}>
          {s.upcoming.length === 0 ? (
            <p className="py-6 text-center text-sm text-uk-muted">
              <CalendarCheck className="mx-auto mb-2 h-6 w-6" /> Nothing scheduled.
            </p>
          ) : (
            <ul className="divide-y divide-uk-line">
              {s.upcoming.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <Link href={`/admin/ai-interviews/${i.id}`} className="min-w-0">
                    <span className="block truncate font-medium text-uk-heading hover:text-uk-blue">{i.candidate.name}</span>
                    <span className="block truncate text-xs text-uk-muted">{i.position} · {fmt(i.schedule?.startsAt)}</span>
                  </Link>
                  <span className="flex items-center gap-2"><ExperienceBadge type={i.experienceType} /><StatusBadge status={i.status} /></span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Recent activity">
        {s.recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-uk-muted">No activity yet.</p>
        ) : (
          <ul className="divide-y divide-uk-line text-sm">
            {s.recent.map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                <span>
                  <Link href={`/admin/ai-interviews/${a.interviewId}`} className="font-medium text-uk-heading hover:text-uk-blue">{a.candidateName}</Link>
                  <span className="text-uk-body"> · {a.action.replace(/[_:]/g, " ")}</span>
                  {a.detail && <span className="text-uk-muted"> · {a.detail.slice(0, 120)}</span>}
                </span>
                <span className="text-xs text-uk-muted">{a.by} · {fmt(a.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
