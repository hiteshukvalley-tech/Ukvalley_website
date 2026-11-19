import Link from "@/components/site/intent-link";
import { CalendarDays, Search } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin-session";
import { effectiveRecommendation, listInterviews, listPositions } from "@/lib/ai-interview/store";
import {
  INTERVIEW_STATUSES, RECOMMENDATIONS, attentionQueueInfo, interviewStatusLabel, isAttentionQueue, isInterviewStatus, isRecommendation,
  recommendationLabel, type ExperienceType,
} from "@/lib/ai-interview/types";
import { InterviewControls } from "../interview-controls";
import { BulkBar, SelectAll, SelectRow } from "../bulk-bar";
import { DbError, ExperienceBadge, RecommendationBadge, Score, StatusBadge, fmt } from "../ui";

export const metadata = { title: "Interview schedule" };
export const dynamic = "force-dynamic";

const PATH = "/admin/ai-interviews/schedule";
const PAGE_SIZE = 25;

type Props = { searchParams: Promise<Record<string, string | undefined>> };

const select = "h-10 rounded-lg border border-input bg-transparent px-3 text-sm text-uk-body outline-none focus-visible:border-ring";

/** Every AI interview, with filters; newest interview time first. */
export default async function SchedulePage({ searchParams }: Props) {
  await requireAdmin("ai-interviews");
  const sp = await searchParams;
  const status = isInterviewStatus(sp.status) ? sp.status : "";
  const recommendation = isRecommendation(sp.recommendation) ? sp.recommendation : "";
  const experienceType = sp.type === "fresher" || sp.type === "experienced" ? (sp.type as ExperienceType) : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const sort = sp.sort === "score" || sp.sort === "created" ? sp.sort : "schedule";
  const q = (sp.q ?? "").trim();
  const position = (sp.position ?? "").trim();
  const queue = isAttentionQueue(sp.queue) ? sp.queue : "";
  const [{ items, total, dbError }, positions] = await Promise.all([
    listInterviews({ status, recommendation, experienceType, position, q, sort, queue, page, pageSize: PAGE_SIZE }),
    listPositions(),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // The export takes the same filters (not the page number).
  const filters = new URLSearchParams(Object.entries({ status, recommendation, type: experienceType, position, q, sort, queue }).filter(([, v]) => v) as [string, string][]);
  const exportHref = `/admin/ai-interviews/export${filters.size ? `?${filters}` : ""}`;
  const link = (p: number) => `${PATH}?${new URLSearchParams(Object.entries({ ...sp, page: String(p) }).filter(([, v]) => v) as [string, string][])}`;

  return (
    <>
      <PageHeader
        title="Interview schedule"
        crumbs={[{ label: "AI interviews", href: "/admin/ai-interviews" }, { label: "Schedule" }]}
        description="Every AI interview. Times are India time. Open a candidate for the recording, transcript and evaluation."
      />

      <form method="get" className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-uk-line bg-uk-card p-4">
        <label className="relative min-w-52 flex-1">
          <span className="sr-only">Search</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-uk-muted" />
          <input type="search" name="q" defaultValue={q} placeholder="Name, email, phone or position" className="h-10 w-full rounded-lg border border-input bg-transparent pl-9 pr-3 text-sm outline-none focus-visible:border-ring" />
        </label>
        <select name="status" defaultValue={status} className={select} aria-label="Status">
          <option value="">Any status</option>
          {INTERVIEW_STATUSES.map((s) => <option key={s} value={s}>{interviewStatusLabel[s]}</option>)}
        </select>
        <select name="position" defaultValue={position} className={select} aria-label="Job position">
          <option value="">Any position</option>
          {positions.map((p) => <option key={p.position} value={p.position}>{p.position} ({p.total})</option>)}
        </select>
        <select name="type" defaultValue={experienceType} className={select} aria-label="Experience">
          <option value="">Freshers and experienced</option>
          <option value="fresher">Freshers</option>
          <option value="experienced">Experienced</option>
        </select>
        <select name="recommendation" defaultValue={recommendation} className={select} aria-label="Recommendation">
          <option value="">Any recommendation</option>
          {RECOMMENDATIONS.map((r) => <option key={r} value={r}>{recommendationLabel[r]}</option>)}
        </select>
        <select name="sort" defaultValue={sort} className={select} aria-label="Sort">
          <option value="schedule">Sort: interview time</option>
          <option value="score">Sort: highest score</option>
          <option value="created">Sort: newest</option>
        </select>
        <button type="submit" className="h-10 rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body hover:bg-uk-surface-2">Show</button>
        {queue && <input type="hidden" name="queue" value={queue} />}
        {Object.values(sp).some(Boolean) && <Link href={PATH} className="pb-2.5 text-sm text-uk-muted hover:text-uk-heading">Reset</Link>}
      </form>

      {queue && (
        <p className="mb-4 rounded-xl border border-uk-blue/30 bg-uk-blue/5 px-4 py-3 text-sm text-uk-body">
          <strong className="text-uk-heading">{attentionQueueInfo[queue].label}.</strong> {attentionQueueInfo[queue].hint}{" "}
          <Link href={PATH} className="text-uk-blue hover:underline">Show every interview</Link>
        </p>
      )}

      {!dbError && items.length > 0 && <BulkBar exportHref={exportHref} />}

      <DbError message={dbError && `Could not read interviews (${dbError}).`} />

      {!dbError && items.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-uk-line bg-uk-card p-10 text-center">
          <CalendarDays className="mx-auto mb-3 h-8 w-8 text-uk-muted" />
          <h2 className="font-heading text-lg font-semibold text-uk-heading">No interviews {q || status || position ? "match these filters" : "yet"}</h2>
          <p className="mx-auto mt-1 max-w-lg text-sm text-uk-muted">
            When AI interviews are on, each new applicant gets one automatically. To start one for an earlier applicant, open them in{" "}
            <Link href="/admin/applications/applicants" className="text-uk-blue hover:underline">Job applications</Link>.
          </p>
        </section>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-uk-line bg-uk-card">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="border-b border-uk-line text-left text-xs uppercase tracking-wide text-uk-muted">
              <tr>
                <th className="w-10 px-4 py-3"><SelectAll /></th>
                <th className="px-4 py-3 font-medium">Candidate</th>
                <th className="px-4 py-3 font-medium">Position</th>
                <th className="px-4 py-3 font-medium">Interview (IST)</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Calendar</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Recommendation</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-uk-line">
              {items.map((i) => (
                <tr key={i.id} className="align-top">
                  <td className="px-4 py-3"><SelectRow id={i.id} name={i.candidate.name} /></td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/ai-interviews/${i.id}`} className="font-medium text-uk-heading hover:text-uk-blue">{i.candidate.name}</Link>
                    <span className="block text-xs text-uk-muted">{i.candidate.email}</span>
                    <span className="block text-xs text-uk-muted">{i.candidate.phone}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block text-uk-body">{i.position}</span>
                    <span className="mt-1 inline-flex gap-1"><ExperienceBadge type={i.experienceType} />{i.attempt > 1 && <span className="text-xs text-uk-muted">attempt {i.attempt}</span>}</span>
                  </td>
                  <td className="px-4 py-3 text-uk-body">{i.schedule ? fmt(i.schedule.startsAt) : <span className="text-uk-muted">Not scheduled</span>}</td>
                  <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                  <td className="px-4 py-3 text-xs text-uk-muted">{{ none: "—", not_connected: "Calendar file only", created: "In Google Calendar", cancelled: "Cancelled", failed: "Failed" }[i.calendar.status]}</td>
                  <td className="px-4 py-3">
                    {i.evaluation.state === "done" ? <Score value={i.evaluation.result?.overall} passing={i.evaluation.result?.passingScore} /> : <span className="text-xs text-uk-muted">{{ none: "—", pending: "Queued", running: "Evaluating…", failed: "Failed", done: "" }[i.evaluation.state]}</span>}
                  </td>
                  <td className="px-4 py-3"><RecommendationBadge rec={effectiveRecommendation(i)} overridden={!!i.hr.recommendationOverride} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex gap-3 text-xs">
                        <Link href={`/admin/ai-interviews/${i.id}`} className="text-uk-blue hover:underline">View</Link>
                        {i.recording.chunks > 0 && !i.recording.deletedAt && <Link href={`/admin/ai-interviews/${i.id}#recording`} className="text-uk-blue hover:underline">Recording</Link>}
                        {i.evaluation.state === "done" && <Link href={`/admin/ai-interviews/${i.id}#evaluation`} className="text-uk-blue hover:underline">Evaluation</Link>}
                      </div>
                      <InterviewControls id={i.id} status={i.status} startsAt={i.schedule?.startsAt.toISOString() ?? null} compact />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" className="mt-4 flex items-center justify-between text-sm text-uk-muted">
          <span>Page {page} of {pages} · {total} interviews</span>
          <span className="flex gap-2">
            {page > 1 && <Link href={link(page - 1)} className="rounded-lg border border-uk-line px-3 py-1.5 hover:bg-uk-surface-2">Previous</Link>}
            {page < pages && <Link href={link(page + 1)} className="rounded-lg border border-uk-line px-3 py-1.5 hover:bg-uk-surface-2">Next</Link>}
          </span>
        </nav>
      )}
    </>
  );
}
