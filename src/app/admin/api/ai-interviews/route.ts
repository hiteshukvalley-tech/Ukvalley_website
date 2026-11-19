import { hrApi, int, isoDate, ok, fail, readJson, refreshPanel, text } from "@/lib/ai-interview/http";
import { listView, detailView } from "@/lib/ai-interview/api-views";
import { createForApplication } from "@/lib/ai-interview/lifecycle";
import { listInterviews, type InterviewQuery } from "@/lib/ai-interview/store";
import { isAttentionQueue, isInterviewStatus, isRecommendation } from "@/lib/ai-interview/types";

export const dynamic = "force-dynamic";

/**
 * GET /admin/api/ai-interviews: the interview list.
 * Query: status, position, experienceType (fresher|experienced), recommendation,
 * minScore, q (name, email, phone, position), from, to (ISO), sort
 * (schedule|score|created), queue (awaiting_decision|accommodation|evaluation_failed|unfinished|missed|unscheduled),
 * page, pageSize (≤100).
 */
export function GET(request: Request) {
  return hrApi(request, async () => {
    const p = new URL(request.url).searchParams;
    const status = p.get("status");
    const exp = p.get("experienceType");
    const rec = p.get("recommendation");
    const sort = p.get("sort");
    const q: InterviewQuery = {
      status: isInterviewStatus(status) ? status : "",
      position: text(p.get("position"), 150),
      experienceType: exp === "fresher" || exp === "experienced" ? exp : "",
      recommendation: isRecommendation(rec) ? rec : "",
      minScore: Math.min(100, Number(p.get("minScore")) || 0),
      q: text(p.get("q"), 100),
      from: isoDate(p.get("from")) ?? undefined,
      to: isoDate(p.get("to")) ?? undefined,
      sort: sort === "score" || sort === "created" ? sort : "schedule",
      queue: isAttentionQueue(p.get("queue")) ? (p.get("queue") as InterviewQuery["queue"]) : "",
      page: int(p.get("page"), 1),
      // The list returns at least 5 per page; echo what is really used, so clients page correctly.
      pageSize: Math.max(5, int(p.get("pageSize"), 25, 100)),
    };
    const res = await listInterviews(q);
    if (res.dbError) return fail(res.dbError, 503);
    return ok({ items: res.items.map(listView), total: res.total, page: q.page, pageSize: q.pageSize });
  });
}

/**
 * POST /admin/api/ai-interviews: create (and optionally schedule) an AI
 * interview for an application. Body: { applicationId, startsAt?: ISO,
 * mode?: "video" | "text" }. Without startsAt the interview is created
 * unscheduled; schedule it with PUT …/{id}/reschedule.
 */
export function POST(request: Request) {
  return hrApi(request, async (me) => {
    const b = await readJson(request);
    const applicationId = text(b.applicationId, 64);
    if (!applicationId) return fail("applicationId is required.", 422);
    const startsAt = b.startsAt ? isoDate(b.startsAt) : null;
    if (b.startsAt && !startsAt) return fail("startsAt must be an ISO date-time.", 422);
    if (startsAt && startsAt.getTime() < Date.now() - 5 * 60_000) return fail("startsAt must be in the future.", 422);
    const mode = b.mode === "text" || b.mode === "video" ? b.mode : undefined;
    const i = await createForApplication(applicationId, me.email, startsAt, mode);
    refreshPanel(i.id);
    return ok(detailView(i), 201);
  });
}
