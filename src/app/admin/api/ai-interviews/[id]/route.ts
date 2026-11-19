import { fail, hrApi, ok } from "@/lib/ai-interview/http";
import { detailView } from "@/lib/ai-interview/api-views";
import { readInterviewModels } from "@/lib/ai-interview/models-store";
import { getInterview } from "@/lib/ai-interview/store";

export const dynamic = "force-dynamic";

/**
 * GET /admin/api/ai-interviews/{id}: one interview session with its linked
 * models (candidate, configuration, schedule, questions, answers, transcript,
 * recording, evaluation, HR review). ?models=0 returns the session only.
 */
export function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return hrApi(request, async () => {
    const { id } = await params;
    const i = await getInterview(id);
    if (!i) return fail("Interview not found.", 404);
    const withModels = new URL(request.url).searchParams.get("models") !== "0";
    return ok({
      session: detailView(i),
      ...(withModels ? { models: await readInterviewModels(id, { withIntent: true }) } : {}),
    });
  });
}
