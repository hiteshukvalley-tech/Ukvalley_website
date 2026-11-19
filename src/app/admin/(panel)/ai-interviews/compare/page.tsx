import Link from "@/components/site/intent-link";
import { Scale } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin-session";
import { effectiveRecommendation, listForPosition, listPositions, type InterviewListItem } from "@/lib/ai-interview/store";
import { RECOMMENDATIONS, isRecommendation, recommendationLabel, type CriterionKey } from "@/lib/ai-interview/types";
import { ExperienceBadge, RecommendationBadge, Score, StatusBadge } from "../ui";

export const metadata = { title: "Compare candidates" };
export const dynamic = "force-dynamic";

const PATH = "/admin/ai-interviews/compare";
const SORTS = {
  overall: "Overall score",
  technical: "Technical",
  communication: "Communication",
  problem_solving: "Problem solving",
  test: "Test score",
} as const;
type SortKey = keyof typeof SORTS;

const value = (i: InterviewListItem, k: SortKey): number => {
  const r = i.evaluation.result;
  if (!r) return -1;
  if (k === "overall") return r.overall;
  if (k === "test") return r.testScore ?? -1;
  return r.criteria[k as CriterionKey]?.score ?? -1;
};

const select = "h-10 rounded-lg border border-input bg-transparent px-3 text-sm text-uk-body outline-none focus-visible:border-ring";

/** Candidates for one job side by side, ranked by the chosen score. Same rubric for everyone in a job. */
export default async function ComparePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin("ai-interviews");
  const sp = await searchParams;
  const positions = await listPositions();
  const position = (sp.position ?? positions[0]?.position ?? "").trim();
  const sort: SortKey = sp.sort && sp.sort in SORTS ? (sp.sort as SortKey) : "overall";
  const onlyDone = sp.done !== "0";
  const rec = isRecommendation(sp.rec) ? sp.rec : "";
  const type = sp.type === "fresher" || sp.type === "experienced" ? sp.type : "";
  let rows = position ? await listForPosition(position) : [];
  if (onlyDone) rows = rows.filter((r) => r.evaluation.state === "done");
  if (rec) rows = rows.filter((r) => effectiveRecommendation(r) === rec);
  if (type) rows = rows.filter((r) => r.experienceType === type);
  rows.sort((a, b) => value(b, sort) - value(a, sort));

  return (
    <>
      <PageHeader
        title="Compare candidates"
        crumbs={[{ label: "AI interviews", href: "/admin/ai-interviews" }, { label: "Compare" }]}
        description="Candidates for the same job, ranked by score. Every candidate for a job is scored with the same rubric; HR makes the decision."
      />
      <form method="get" className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-uk-line bg-uk-card p-4">
        <select name="position" defaultValue={position} className={`${select} min-w-56`} aria-label="Job position">
          {positions.length === 0 && <option value="">No interviews yet</option>}
          {positions.map((p) => <option key={p.position} value={p.position}>{p.position} ({p.total})</option>)}
        </select>
        <select name="sort" defaultValue={sort} className={select} aria-label="Rank by">
          {Object.entries(SORTS).map(([k, l]) => <option key={k} value={k}>Rank by: {l}</option>)}
        </select>
        <select name="type" defaultValue={type} className={select} aria-label="Experience">
          <option value="">Freshers and experienced</option>
          <option value="fresher">Freshers</option>
          <option value="experienced">Experienced</option>
        </select>
        <select name="rec" defaultValue={rec} className={select} aria-label="Recommendation">
          <option value="">Any recommendation</option>
          {RECOMMENDATIONS.map((r) => <option key={r} value={r}>{recommendationLabel[r]}</option>)}
        </select>
        <select name="done" defaultValue={onlyDone ? "1" : "0"} className={select} aria-label="Which interviews">
          <option value="1">Evaluated only</option>
          <option value="0">All interviews</option>
        </select>
        <button type="submit" className="h-10 rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body hover:bg-uk-surface-2">Show</button>
      </form>

      {rows.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-uk-line bg-uk-card p-10 text-center">
          <Scale className="mx-auto mb-3 h-8 w-8 text-uk-muted" />
          <h2 className="font-heading text-lg font-semibold text-uk-heading">No candidates to compare</h2>
          <p className="mt-1 text-sm text-uk-muted">Candidates appear here once their AI interview has been evaluated.</p>
        </section>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-uk-line bg-uk-card">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-uk-line text-left text-xs uppercase tracking-wide text-uk-muted">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Candidate</th>
                <th className="px-4 py-3 font-medium">Experience</th>
                <th className="px-4 py-3 font-medium">Technical</th>
                <th className="px-4 py-3 font-medium">Communication</th>
                <th className="px-4 py-3 font-medium">Problem solving</th>
                <th className="px-4 py-3 font-medium">Test</th>
                <th className="px-4 py-3 font-medium">Overall</th>
                <th className="px-4 py-3 font-medium">Recommendation</th>
                <th className="px-4 py-3 font-medium">Interview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-uk-line">
              {rows.map((i, n) => {
                const r = i.evaluation.result;
                return (
                  <tr key={i.id}>
                    <td className="px-4 py-3 text-uk-muted">{n + 1}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/ai-interviews/${i.id}`} className="font-medium text-uk-heading hover:text-uk-blue">{i.candidate.name}</Link>
                      <span className="block text-xs text-uk-muted">{i.candidate.experience}</span>
                    </td>
                    <td className="px-4 py-3"><ExperienceBadge type={i.experienceType} /></td>
                    <td className="px-4 py-3"><Score value={r?.criteria.technical?.score} /></td>
                    <td className="px-4 py-3"><Score value={r?.criteria.communication?.score} /></td>
                    <td className="px-4 py-3"><Score value={r?.criteria.problem_solving?.score} /></td>
                    <td className="px-4 py-3"><Score value={r?.testScore} /></td>
                    <td className="px-4 py-3"><Score value={r?.overall} passing={r?.passingScore} /></td>
                    <td className="px-4 py-3"><RecommendationBadge rec={effectiveRecommendation(i)} overridden={!!i.hr.recommendationOverride} /></td>
                    <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-uk-muted">
        <Link href={`${PATH}?position=${encodeURIComponent(position)}&done=0`} className="text-uk-blue hover:underline">Include interviews not yet evaluated</Link>
      </p>
    </>
  );
}
