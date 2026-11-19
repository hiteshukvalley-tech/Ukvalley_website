import { fail, hrApi, ok, text } from "@/lib/ai-interview/http";
import { effectiveRecommendation, listForPosition, listPositions } from "@/lib/ai-interview/store";
import { candidateIdFor } from "@/lib/ai-interview/models";

export const dynamic = "force-dynamic";

const SORTS = ["overall", "technical", "communication", "problem_solving", "test", "experience"] as const;
type Sort = (typeof SORTS)[number];

/**
 * GET /admin/api/ai-interviews/compare?position=…: candidates for one job,
 * ranked. Optional: sort (overall|technical|communication|problem_solving|test|experience),
 * experienceType, completedOnly=1, minScore. Without position: the positions
 * that have interviews.
 */
export function GET(request: Request) {
  return hrApi(request, async () => {
    const p = new URL(request.url).searchParams;
    const position = text(p.get("position"), 150);
    if (!position) return ok({ positions: await listPositions() });
    const sort: Sort = (SORTS as readonly string[]).includes(p.get("sort") ?? "") ? (p.get("sort") as Sort) : "overall";
    const exp = p.get("experienceType");
    const minScore = Math.min(100, Number(p.get("minScore")) || 0);
    const completedOnly = p.get("completedOnly") === "1";
    const rows = (await listForPosition(position))
      .filter((i) => (exp === "fresher" || exp === "experienced" ? i.experienceType === exp : true))
      .filter((i) => (completedOnly ? i.status === "completed" : true))
      .map((i) => {
        const r = i.evaluation.result;
        return {
          interviewId: i.id,
          applicationId: i.applicationId,
          candidateId: i.candidateId ?? candidateIdFor(i.candidate.email),
          name: i.candidate.name,
          experience: i.candidate.experience,
          experienceType: i.experienceType,
          status: i.status,
          completed: i.status === "completed",
          evaluation: i.evaluation.state,
          scores: {
            overall: r?.overall ?? null,
            technical: r?.criteria.technical?.score ?? null,
            communication: r?.criteria.communication?.score ?? null,
            problem_solving: r?.criteria.problem_solving?.score ?? null,
            job_knowledge: r?.criteria.job_knowledge?.score ?? null,
            practical_experience: r?.criteria.practical_experience?.score ?? null,
            behavioral: r?.criteria.behavioral?.score ?? null,
            test: r?.testScore ?? i.mcq?.score ?? null,
          },
          recommendation: effectiveRecommendation(i),
          aiRecommendation: r?.recommendation ?? null,
          overridden: !!i.hr.recommendationOverride,
          flags: i.flags.length,
        };
      })
      .filter((r) => (minScore > 0 ? (r.scores.overall ?? -1) >= minScore : true));
    const key = (r: (typeof rows)[number]) => (sort === "experience" ? (r.experienceType === "experienced" ? 1 : 0) : (r.scores[sort] ?? -1));
    rows.sort((a, b) => key(b) - key(a) || (b.scores.overall ?? -1) - (a.scores.overall ?? -1));
    if (!rows.length && !(await listPositions()).some((x) => x.position.toLowerCase() === position.toLowerCase())) {
      return fail("No interviews for that position.", 404);
    }
    return ok({ position, sort, candidates: rows.map((r, n) => ({ rank: n + 1, ...r })) });
  });
}
