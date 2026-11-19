import { fail, hrApi, ok, readJson, refreshPanel, text } from "@/lib/ai-interview/http";
import { runBulk } from "@/lib/ai-interview/hr-tools";
import { BULK_ACTIONS, BULK_MAX, isBulkAction } from "@/lib/ai-interview/types";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

/**
 * POST /admin/api/ai-interviews/bulk: one action on many interviews.
 * Body: { ids: string[] (≤100), action, reason? }. Actions: remind,
 * resend_invite, auto_schedule, extend_24h, evaluate, shortlist, reject, cancel.
 * Interviews the action doesn't apply to are skipped with the reason; the
 * others still run. Answers { done, skipped: [{ id, name, reason }] }.
 */
export function POST(request: Request) {
  return hrApi(request, async (me) => {
    const b = await readJson(request);
    if (!isBulkAction(b.action)) return fail(`action must be one of: ${BULK_ACTIONS.join(", ")}.`, 422);
    const ids = Array.isArray(b.ids) ? b.ids.filter((x): x is string => typeof x === "string" && x.length > 0 && x.length <= 80) : [];
    if (!ids.length) return fail("ids must list at least one interview id.", 422);
    if (ids.length > BULK_MAX) return fail(`At most ${BULK_MAX} interviews at a time.`, 422);
    const result = await runBulk(ids, b.action, me.email, { reason: text(b.reason, 300) });
    refreshPanel();
    if (b.action === "shortlist" || b.action === "reject") revalidatePath("/admin/applications", "layout");
    return ok(result);
  });
}
