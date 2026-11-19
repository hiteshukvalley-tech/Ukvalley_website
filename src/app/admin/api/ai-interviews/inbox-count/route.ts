import { hrApi, ok } from "@/lib/ai-interview/http";
import { awaitingDecisionCount } from "@/lib/ai-interview/store";

export const dynamic = "force-dynamic";

/** GET /admin/api/ai-interviews/inbox-count: interviews awaiting an HR decision (the sidebar badge). */
export function GET(request: Request) {
  return hrApi(request, async () => ok({ count: await awaitingDecisionCount() }));
}
