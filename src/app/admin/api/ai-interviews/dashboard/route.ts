import { fail, hrApi, ok } from "@/lib/ai-interview/http";
import { listView } from "@/lib/ai-interview/api-views";
import { dashboardStats } from "@/lib/ai-interview/store";

export const dynamic = "force-dynamic";

/** GET /admin/api/ai-interviews/dashboard: the numbers and charts on Admin → AI interviews. */
export function GET(request: Request) {
  return hrApi(request, async () => {
    const s = await dashboardStats();
    if (s.dbError) return fail(s.dbError, 503);
    const by = s.byStatus;
    const completed = by.completed ?? 0;
    const finished = completed + (by.missed ?? 0) + (by.expired ?? 0);
    return ok({
      cards: {
        total: s.total,
        scheduled: by.scheduled ?? 0,
        pending: (by.unscheduled ?? 0) + (by.accommodation ?? 0) + (by.in_progress ?? 0) + (by.interrupted ?? 0),
        completed,
        cancelled: by.cancelled ?? 0,
        noShow: by.missed ?? 0,
        averageScore: s.averageScore,
        recommended: s.recommended,
        evaluated: s.evaluated,
      },
      completionRate: finished ? Math.round((completed / finished) * 1000) / 10 : null,
      byStatus: by,
      byPosition: s.byPosition,
      byExperience: s.byExperience,
      scoreDistribution: s.scoreBuckets,
      upcoming: s.upcoming.map(listView),
      recentActivity: s.recent,
    });
  });
}
