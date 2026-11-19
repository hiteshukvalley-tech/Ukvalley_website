import { getSession } from "@/lib/admin-session";
import { canUseArea } from "@/lib/admin-access";
import { toCsv } from "@/lib/ai-interview/csv";
import { audit, effectiveRecommendation, listForExport } from "@/lib/ai-interview/store";
import {
  experienceTypeLabel, interviewStatusLabel, isAttentionQueue, isInterviewStatus, isRecommendation, recommendationLabel, type ExperienceType,
} from "@/lib/ai-interview/types";

export const dynamic = "force-dynamic";

/**
 * GET /admin/ai-interviews/export: the Schedule list as CSV, with the same
 * filters (status, position, type, recommendation, queue, q, sort), or the
 * selected interviews (?ids=a,b,c). HR with the AI interviews section only.
 * Exports hold personal data, so each one is written to the audit trail.
 */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!canUseArea(session.role, session.access, "ai-interviews")) return new Response("Forbidden", { status: 403 });
  const sp = new URL(request.url).searchParams;
  const ids = (sp.get("ids") ?? "").split(",").map((s) => s.trim()).filter((s) => /^[\w-]{1,80}$/.test(s));
  const type = sp.get("type");
  const sort = sp.get("sort");
  let items;
  try {
    items = await listForExport(
      {
        status: isInterviewStatus(sp.get("status")) ? (sp.get("status") as never) : "",
        recommendation: isRecommendation(sp.get("recommendation")) ? (sp.get("recommendation") as never) : "",
        experienceType: type === "fresher" || type === "experienced" ? (type as ExperienceType) : "",
        position: (sp.get("position") ?? "").trim(),
        queue: isAttentionQueue(sp.get("queue")) ? (sp.get("queue") as never) : "",
        q: (sp.get("q") ?? "").trim(),
        sort: sort === "score" || sort === "created" ? sort : "schedule",
      },
      ids
    );
  } catch {
    return new Response("Could not read the interviews right now.", { status: 503 });
  }

  const ist = (d?: Date | null) => (d ? new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }) : "");
  const rows: unknown[][] = [
    [
      "Candidate", "Email", "Phone", "Position", "Experience", "Attempt", "Status", "Interview time (IST)", "Completed (IST)",
      "Score", "Passing score", "Test score %", "Recommendation", "AI recommendation", "HR override", "Latest HR decision", "Resumes", "Interview ID",
    ],
    ...items.map((i) => {
      const r = i.evaluation.result;
      const last = i.hr.decisions.at(-1);
      const rec = effectiveRecommendation(i);
      return [
        i.candidate.name, i.candidate.email, i.candidate.phone, i.position, experienceTypeLabel[i.experienceType], i.attempt,
        interviewStatusLabel[i.status], ist(i.schedule?.startsAt), ist(i.completedAt),
        r?.overall ?? "", r?.passingScore ?? "", typeof i.mcq?.score === "number" ? i.mcq.score : "",
        rec ? recommendationLabel[rec] : "", r ? recommendationLabel[r.recommendation] : "",
        i.hr.recommendationOverride ? recommendationLabel[i.hr.recommendationOverride] : "",
        last ? `${last.kind.replace("_", " ")}${last.stage ? ` → ${last.stage}` : ""}` : "", i.resumes, i.id,
      ];
    }),
  ];
  await audit({ interviewId: "export", applicationId: "", candidateName: `${items.length} interview${items.length === 1 ? "" : "s"}`, action: "exported_csv", by: session.email, detail: ids.length ? `${ids.length} selected` : sp.toString().slice(0, 500) || "all" });

  const day = new Date().toISOString().slice(0, 10);
  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ai-interviews-${day}.csv"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
