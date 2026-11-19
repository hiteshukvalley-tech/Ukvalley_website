import Link from "@/components/site/intent-link";
import { Inbox } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin-session";
import { effectiveRecommendation, listAwaitingDecision, listPositions } from "@/lib/ai-interview/store";
import { DbError, ExperienceBadge, RecommendationBadge, fmt } from "../ui";
import { QuickDecision } from "./quick-decision";

export const metadata = { title: "Awaiting decision" };
export const dynamic = "force-dynamic";

const PATH = "/admin/ai-interviews/inbox";
const select = "h-10 rounded-lg border border-input bg-transparent px-3 text-sm text-uk-body outline-none focus-visible:border-ring";

type Props = { searchParams: Promise<{ position?: string }> };

/** "3 h", "2 days": how long an evaluated interview has waited for HR. */
function waited(since: Date | undefined): string {
  if (!since) return "";
  const h = Math.max(0, Math.round((Date.now() - since.getTime()) / 3600_000));
  return h < 48 ? `${h} h` : `${Math.round(h / 24)} days`;
}

/**
 * Completed, evaluated AI interviews that no one in HR has decided on yet
 * (GrowthValley's "Awaiting decision"): best score first, then the longest
 * waiting, each with one-click decisions.
 */
export default async function AwaitingDecisionPage({ searchParams }: Props) {
  await requireAdmin("ai-interviews");
  const position = ((await searchParams).position ?? "").trim();
  const [{ items, dbError }, positions] = await Promise.all([listAwaitingDecision(position), listPositions()]);

  return (
    <>
      <PageHeader
        title="Awaiting decision"
        crumbs={[{ label: "AI interviews", href: "/admin/ai-interviews" }, { label: "Awaiting decision" }]}
        description="Finished and scored AI interviews waiting for HR. Best score first, then the longest waiting. A decision moves the application's stage too."
      />

      <form method="get" className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-uk-line bg-uk-card p-4">
        <select name="position" defaultValue={position} className={select} aria-label="Job position">
          <option value="">Every job</option>
          {positions.map((p) => <option key={p.position} value={p.position}>{p.position}</option>)}
        </select>
        <button type="submit" className="h-10 rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body hover:bg-uk-surface-2">Show</button>
        {position && <Link href={PATH} className="pb-2.5 text-sm text-uk-muted hover:text-uk-heading">Reset</Link>}
        <span className="ml-auto pb-2.5 text-sm text-uk-muted">{items.length} waiting</span>
      </form>

      <DbError message={dbError && `Could not read interviews (${dbError}).`} />

      {!dbError && items.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-uk-line bg-uk-card p-10 text-center">
          <Inbox className="mx-auto mb-3 h-8 w-8 text-uk-muted" />
          <h2 className="font-heading text-lg font-semibold text-uk-heading">Nothing waiting</h2>
          <p className="mx-auto mt-1 max-w-lg text-sm text-uk-muted">Every scored interview has a decision. New ones appear here as soon as the AI finishes scoring them.</p>
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((i) => {
            const r = i.evaluation.result;
            const passed = r ? r.overall >= r.passingScore : false;
            return (
              <article key={i.id} className="rounded-2xl border border-uk-line bg-uk-card p-5">
                <div className="flex items-start gap-4">
                  <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl font-heading text-2xl font-bold tabular-nums ${passed ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" : "bg-uk-surface-2 text-uk-heading"}`} title={r ? `Passing score ${r.passingScore}` : undefined}>
                    {r?.overall ?? "—"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/ai-interviews/${i.id}`} className="font-heading text-base font-semibold text-uk-heading hover:text-uk-blue">{i.candidate.name}</Link>
                    <p className="text-sm text-uk-body">{i.position}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <RecommendationBadge rec={effectiveRecommendation(i)} overridden={!!i.hr.recommendationOverride} />
                      <ExperienceBadge type={i.experienceType} />
                      {i.flags.length > 0 && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300">{i.flags.length} warning{i.flags.length === 1 ? "" : "s"}</span>}
                      {typeof r?.testScore === "number" && <span className="rounded-full border border-uk-line px-2 py-0.5 text-xs text-uk-body">Test {r.testScore}%</span>}
                    </div>
                  </div>
                  <span className="shrink-0 text-right text-xs text-uk-muted">
                    Waiting {waited(i.completedAt)}
                    <span className="block">{fmt(i.completedAt)}</span>
                  </span>
                </div>
                {r?.summary && <p className="mt-3 line-clamp-2 text-sm text-uk-body">{r.summary}</p>}
                <div className="mt-2 flex gap-3 text-xs">
                  <Link href={`/admin/ai-interviews/${i.id}#evaluation`} className="text-uk-blue hover:underline">Full report</Link>
                  {i.recording.chunks > 0 && !i.recording.deletedAt && <Link href={`/admin/ai-interviews/${i.id}#recording`} className="text-uk-blue hover:underline">Recording</Link>}
                </div>
                <QuickDecision id={i.id} />
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
