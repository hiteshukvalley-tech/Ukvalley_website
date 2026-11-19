import { fail, hrApi, isoDate, ok, readJson, refreshPanel, text } from "@/lib/ai-interview/http";
import { detailView } from "@/lib/ai-interview/api-views";
import {
  addComment, applyDecision, cancelInterview, overrideRecommendation, requestEvaluation, scheduleInterview, sendReminderNow,
} from "@/lib/ai-interview/lifecycle";
import { readInterviewModels } from "@/lib/ai-interview/models-store";
import { listSegments } from "@/lib/ai-interview/recordings";
import { effectiveRecommendation, getInterview, listAudit } from "@/lib/ai-interview/store";
import { HR_COMMENT_MAX, isHrDecision, isRecommendation } from "@/lib/ai-interview/types";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; action: string }> };

// Per-interview actions of the HR REST API:
//
//   GET  …/{id}/evaluation    the AI evaluation (scores, evidence, recommendation) and HR's final word
//   GET  …/{id}/transcript    the transcript with timestamps
//   GET  …/{id}/questions     questions and answers with per-question scores
//   GET  …/{id}/recordings    recording segments with HR-only playback URLs
//   GET  …/{id}/audit         the audit trail
//   POST …/{id}/evaluate      queue an (re-)evaluation
//   POST …/{id}/reminder      send a reminder now
//   PUT  …/{id}/reschedule    { startsAt }: new time, new link, calendar and reminders updated
//   PUT  …/{id}/cancel        { reason? }: cancels, tells the candidate, cancels the calendar event
//   PUT  …/{id}/decision      { decision, note?, stage? } and/or { override, reason }: HR decision
//   GET  …/{id}/link          the candidate's interview link (logged), to pass on another way
//   POST …/{id}/resend        send the invitation again (current link)
//   POST …/{id}/auto-schedule schedule at the next free working time
//   POST …/{id}/resume        allow one more resume after the limit
//   POST …/{id}/regenerate    new questions (only before the candidate answers)
//   POST …/{id}/message       { subject, body }: HR's own email to the candidate
//   PUT  …/{id}/extend        { hours: 2|6|24|48|72 }: keep the link open longer (reopens a missed/expired one)

const tools = () => import("@/lib/ai-interview/hr-tools");

export function GET(request: Request, { params }: Ctx) {
  return hrApi(request, async (me) => {
    const { id, action } = await params;
    const i = await getInterview(id);
    if (!i) return fail("Interview not found.", 404);

    switch (action) {
      case "evaluation": {
        const m = await readInterviewModels(id);
        return ok({
          state: i.evaluation.state,
          error: i.evaluation.error ?? null,
          result: i.evaluation.result ?? null,
          model: m?.evaluation ?? null,
          finalRecommendation: effectiveRecommendation(i),
          override: i.hr.recommendationOverride ? { recommendation: i.hr.recommendationOverride, reason: i.hr.overrideReason ?? "" } : null,
          flags: i.flags,
          advisory: "AI scores are recommendations only. HR makes every hiring decision.",
        });
      }
      case "transcript": {
        const m = await readInterviewModels(id);
        return ok(m?.transcript ?? null);
      }
      case "questions": {
        const m = await readInterviewModels(id, { withIntent: true });
        return ok({ questions: m?.questions ?? [], answers: m?.answers ?? [] });
      }
      case "recordings": {
        if (i.recording.deletedAt) return ok({ deleted: true, deletedAt: i.recording.deletedAt, segments: [] });
        const segments = await listSegments(id);
        return ok({
          deleted: false,
          storage: i.recording.storage,
          deleteAfter: i.recording.deleteAfter ?? null,
          segments: segments.map((s) => ({ ...s, url: `/admin/ai-interviews/${id}/recording/${s.segment}`, downloadUrl: `/admin/ai-interviews/${id}/recording/${s.segment}?download=1` })),
        });
      }
      case "audit":
        return ok(await listAudit({ interviewId: id, limit: 200 }));
      case "link":
        return ok({ link: await tools().then((t) => t.revealCandidateLink(id, me.email)) });
      default:
        return fail("Unknown action.", 404);
    }
  });
}

export function POST(request: Request, { params }: Ctx) {
  return hrApi(request, async (me) => {
    const { id, action } = await params;
    if (!(await getInterview(id))) return fail("Interview not found.", 404);
    if (action === "evaluate") {
      await requestEvaluation(id, me.email);
      refreshPanel(id);
      return ok({ queued: true }, 202);
    }
    if (action === "resend" || action === "auto-schedule" || action === "resume" || action === "regenerate") {
      const t = await tools();
      if (action === "resend") await t.resendInvitation(id, me.email);
      else if (action === "resume") await t.grantExtraResume(id, me.email);
      else if (action === "regenerate") await t.regenerateQuestions(id, me.email);
      else await t.autoSchedule(id, me.email);
      refreshPanel(id);
      const updated = await getInterview(id);
      return ok(updated ? detailView(updated) : null, action === "resend" || action === "regenerate" ? 202 : 200);
    }
    if (action === "message") {
      const b = await readJson(request);
      await (await tools()).messageCandidate(id, text(b.subject, 200), text(b.body, 5000), me.email);
      refreshPanel(id);
      return ok({ sent: true });
    }
    if (action === "reminder") {
      await sendReminderNow(id, me.email);
      refreshPanel(id);
      return ok({ queued: true }, 202);
    }
    return fail("Unknown action.", 404);
  });
}

export function PUT(request: Request, { params }: Ctx) {
  return hrApi(request, async (me) => {
    const { id, action } = await params;
    if (!(await getInterview(id))) return fail("Interview not found.", 404);
    const b = await readJson(request);

    if (action === "reschedule") {
      const startsAt = isoDate(b.startsAt);
      if (!startsAt) return fail("startsAt must be an ISO date-time, e.g. 2026-11-24T11:00:00+05:30.", 422);
      if (startsAt.getTime() < Date.now() - 5 * 60_000) return fail("startsAt must be in the future.", 422);
      const updated = await scheduleInterview(id, startsAt, me.email);
      if (!updated) return fail("The interview could not be scheduled.", 409);
      refreshPanel(id);
      return ok(detailView(updated));
    }

    if (action === "extend") {
      const updated = await (await tools()).extendLinkWindow(id, Number(b.hours), me.email);
      refreshPanel(id);
      return ok(detailView(updated));
    }

    if (action === "cancel") {
      const updated = await cancelInterview(id, me.email, text(b.reason, 300));
      if (!updated) return fail("Interview not found.", 404);
      refreshPanel(id);
      return ok(detailView(updated));
    }

    if (action === "decision") {
      const note = text(b.note, HR_COMMENT_MAX);
      const did: string[] = [];
      // Check the whole request before changing anything, so a bad field never leaves half of it applied.
      if (b.override !== undefined && b.override !== null && !isRecommendation(b.override)) {
        return fail("override must be strongly_recommended, recommended, hold, not_recommended or null.", 422);
      }
      // 400, as before this check moved up front (overrideRecommendation refuses it the same way).
      if (b.override && text(b.reason, 1000).trim().length < 5) return fail("Give a reason for the override.", 400);
      if (b.decision !== undefined) {
        if (!isHrDecision(b.decision)) return fail("decision must be shortlist, reject, next_round, move_stage, reassess or comment.", 422);
        if (b.decision === "comment" && !note) return fail("note is required for a comment.", 422);
      }
      // The decision first: it is the part that can still be refused (reassess with an open
      // interview, a deleted application). The override can't fail once validated above.
      if (b.decision !== undefined && isHrDecision(b.decision)) {
        if (b.decision === "comment") {
          await addComment(id, note, me.email);
        } else {
          await applyDecision(id, b.decision, note, me.email, text(b.stage, 40) || undefined);
        }
        did.push(b.decision);
      }
      if (b.override !== undefined) {
        await overrideRecommendation(id, b.override as Parameters<typeof overrideRecommendation>[1], text(b.reason, 1000), me.email);
        did.push(b.override ? "override" : "override_removed");
      }
      if (!did.length) return fail("Send a decision and/or an override.", 422);
      refreshPanel(id);
      revalidatePath("/admin/applications", "layout");
      const updated = await getInterview(id);
      return ok({ applied: did, interview: updated ? detailView(updated) : null });
    }

    return fail("Unknown action.", 404);
  });
}
