import { notFound } from "next/navigation";
import Link from "@/components/site/intent-link";
import { AlertTriangle, Download, FileText, RefreshCw, Trash2, Unlock, Video } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin-session";
import { listSegments } from "@/lib/ai-interview/recordings";
import { effectiveRecommendation, getInterview, listAudit, listForApplication, listNotifications } from "@/lib/ai-interview/store";
import {
  CRITERIA_KEYS, cheatFlagLabel, criterionLabel, experienceTypeLabel, formatInZone, recommendationLabel, sectionLabel,
} from "@/lib/ai-interview/types";
import { notificationKindLabel, isNotificationKind } from "@/lib/ai-interview/templates";
import { InterviewControls, ToolButton } from "../interview-controls";
import { ExperienceBadge, Panel, RecommendationBadge, Score, StatusBadge, fmt } from "../ui";
import { ReviewPanel } from "./review-panel";
import { PlayFromHere, RecordingVideo } from "./recording-player";
import { QuickActions } from "./quick-actions";

export const metadata = { title: "AI interview" };
export const dynamic = "force-dynamic";

/**
 * Where an answer starts in the recording: the offset is taken when the answer
 * is submitted, so step back by how long the candidate took. Answers from
 * before parts were stored with them are in the first part.
 */
function answerStart(a: { offsetMs?: number; segment?: number; startedAt: Date; endedAt: Date }): { segment: number; ms: number } | null {
  if (typeof a.offsetMs !== "number") return null;
  const took = Math.max(0, new Date(a.endedAt).getTime() - new Date(a.startedAt).getTime());
  return { segment: a.segment ?? 0, ms: Math.max(0, a.offsetMs - took) };
}

/** One candidate's AI interview: profile, schedule, recording, transcript, evaluation, HR review, audit trail. */
export default async function InterviewDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("ai-interviews");
  const { id } = await params;
  const i = await getInterview(id);
  if (!i) notFound();
  const [segments, auditLog, notifications, attempts] = await Promise.all([
    i.recording.deletedAt ? Promise.resolve([]) : listSegments(id),
    listAudit({ interviewId: id, limit: 200 }),
    listNotifications({ interviewId: id, pageSize: 50 }),
    listForApplication(i.applicationId),
  ]);
  const r = i.evaluation.result;
  const answerOf = new Map(i.answers.map((a) => [a.questionId, a]));
  const scoreOf = new Map(r?.questions.map((q) => [q.questionId, q]) ?? []);
  const rec = effectiveRecommendation(i);
  // Parts that can be played on this page (not deleted, with chunks).
  const playable = new Set(segments.map((s) => s.segment));
  // Which quick actions apply now (hr-tools.ts checks again).
  const open = ["scheduled", "accommodation", "interrupted", "in_progress"].includes(i.status);
  const can = {
    copyLink: open && !!i.tokenEnc,
    resend: !!i.schedule && ["scheduled", "interrupted", "accommodation"].includes(i.status),
    extend: !!i.schedule && (open || i.status === "missed" || i.status === "expired"),
    grantResume: i.resumes > 0 && ["interrupted", "in_progress", "scheduled"].includes(i.status),
    regenerate: i.answers.length === 0 && !["in_progress", "completed", "cancelled"].includes(i.status),
    autoSchedule: ["unscheduled", "missed", "expired"].includes(i.status),
  };

  return (
    <>
      <PageHeader
        title={i.candidate.name}
        crumbs={[{ label: "AI interviews", href: "/admin/ai-interviews" }, { label: "Schedule", href: "/admin/ai-interviews/schedule" }, { label: i.candidate.name }]}
        description={`${i.position} · ${experienceTypeLabel[i.experienceType]} · attempt ${i.attempt}`}
        action={<span className="flex items-center gap-2"><StatusBadge status={i.status} /><RecommendationBadge rec={rec} overridden={!!i.hr.recommendationOverride} /></span>}
      />

      {/* min-w-0: a wide table (scores, evidence) scrolls inside its panel instead of pushing the column past a phone's edge. */}
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-6">
          {/* 1. profile and 2-4. resume, position, experience */}
          <Panel title="Candidate" action={<Link href={`/admin/applications/${i.applicationId}`} className="text-sm text-uk-blue hover:underline">Open application</Link>}>
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {[
                ["Email", i.candidate.email],
                ["Phone", `${i.candidate.phone}${i.candidate.whatsappOptIn ? " (WhatsApp OK)" : ""}`],
                ["Location", i.candidate.location],
                ["Time zone", i.candidate.timeZone],
                ["Applied for", i.position],
                ["Experience", `${i.candidate.experience} → ${experienceTypeLabel[i.experienceType]}`],
                ["Current company", i.candidate.currentCompany || "—"],
                ["Education", i.candidate.education || "—"],
                ["Skills", i.candidate.skills || "—"],
              ].map(([k, v]) => (
                <div key={k}><dt className="text-xs text-uk-muted">{k}</dt><dd className="break-words text-uk-body">{v}</dd></div>
              ))}
            </dl>
            <a href={`/admin/applications/${i.applicationId}/resume`} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm text-uk-blue hover:underline">
              <FileText className="h-4 w-4" /> Resume (PDF)
            </a>
          </Panel>

          {/* 5-6. schedule and status */}
          <Panel title="Schedule">
            <dl className="mb-4 grid gap-3 text-sm sm:grid-cols-3">
              <div><dt className="text-xs text-uk-muted">Interview time</dt><dd className="text-uk-body">{i.schedule ? formatInZone(i.schedule.startsAt, "Asia/Kolkata") : "Not scheduled"}</dd></div>
              <div><dt className="text-xs text-uk-muted">Candidate's time</dt><dd className="text-uk-body">{i.schedule ? formatInZone(i.schedule.startsAt, i.candidate.timeZone) : "—"}</dd></div>
              <div><dt className="text-xs text-uk-muted">Link open until</dt><dd className="text-uk-body">{fmt(i.schedule?.closesAt)}</dd></div>
              <div><dt className="text-xs text-uk-muted">Started</dt><dd className="text-uk-body">{fmt(i.startedAt)}</dd></div>
              <div><dt className="text-xs text-uk-muted">Completed</dt><dd className="text-uk-body">{fmt(i.completedAt)}</dd></div>
              <div>
                <dt className="text-xs text-uk-muted">Calendar</dt>
                <dd className="text-uk-body">
                  {i.calendar.htmlLink ? <a href={i.calendar.htmlLink} target="_blank" rel="noreferrer" className="text-uk-blue hover:underline">Google Calendar event</a> : { none: "—", not_connected: "Calendar file in the email", created: "Created", cancelled: "Cancelled", failed: `Failed: ${i.calendar.error ?? ""}` }[i.calendar.status]}
                </dd>
              </div>
              <div><dt className="text-xs text-uk-muted">Mode</dt><dd className="text-uk-body">{i.mode === "video" ? "Video (recorded)" : "Written (accommodation)"}</dd></div>
              <div><dt className="text-xs text-uk-muted">Consent</dt><dd className="text-uk-body">{i.consent ? `Given ${fmt(i.consent.at)}` : "Not yet"}</dd></div>
              <div><dt className="text-xs text-uk-muted">Resumed</dt><dd className="text-uk-body">{i.resumes} time{i.resumes === 1 ? "" : "s"}</dd></div>
            </dl>
            {i.accommodation && (
              <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
                <p className="font-medium">Accommodation requested {fmt(i.accommodation.requestedAt)}</p>
                <p className="mt-1">{i.accommodation.note || "(no note)"}</p>
                {i.accommodation.resolution && <p className="mt-1 text-xs">Resolved: {i.accommodation.resolution}</p>}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <InterviewControls id={i.id} status={i.status} startsAt={i.schedule?.startsAt.toISOString() ?? null} />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {i.mode === "video" && i.status !== "completed" && <ToolButton id={i.id} tool="text_mode" label="Allow written interview" confirm="Let this candidate answer in writing, without camera, microphone or recording?" />}
              {i.mode === "text" && i.status !== "completed" && <ToolButton id={i.id} tool="video_mode" label="Back to video interview" />}
              {i.device && i.status !== "completed" && <ToolButton id={i.id} tool="release" label="Unlock for another browser" icon={<Unlock className="h-3.5 w-3.5" />} />}
            </div>
          </Panel>

          {/* 7-9. recording */}
          <section id="recording">
            <Panel title="Recording">
              {i.recording.deletedAt ? (
                <p className="text-sm text-uk-muted">Deleted {fmt(i.recording.deletedAt)}. The transcript and evaluation are kept.</p>
              ) : segments.length === 0 ? (
                <p className="text-sm text-uk-muted">{i.mode === "text" ? "Written interview: nothing was recorded." : "No recording yet."}</p>
              ) : (
                <div className="space-y-4">
                  {segments.map((s) => (
                    <div key={s.segment}>
                      <p className="mb-1.5 text-xs text-uk-muted">
                        Part {s.segment + 1} · {fmt(s.from)} · {(s.bytes / 1048576).toFixed(1)} MB
                        {s.missing.length > 0 && <span className="text-amber-700 dark:text-amber-400"> · {s.missing.length} piece{s.missing.length === 1 ? "" : "s"} missing (connection loss)</span>}
                      </p>
                      {/* Audio and video play from the same file; the player has its own volume and full-screen controls. */}
                      <RecordingVideo segment={s.segment} src={`/admin/ai-interviews/${i.id}/recording/${s.segment}`} />
                      <a href={`/admin/ai-interviews/${i.id}/recording/${s.segment}?download`} className="mt-1.5 inline-flex items-center gap-1 text-xs text-uk-blue hover:underline"><Download className="h-3.5 w-3.5" /> Download</a>
                    </div>
                  ))}
                  <p className="text-xs text-uk-muted">The AI interviewer's voice isn't in the recording (browsers can't capture it); its questions are in the transcript below, with times.</p>
                  {i.recording.deleteAfter && <p className="text-xs text-uk-muted">Deleted automatically on {fmt(i.recording.deleteAfter)}.</p>}
                  <ToolButton id={i.id} tool="delete_recording" label="Delete recording now" icon={<Trash2 className="h-3.5 w-3.5" />} confirm="Delete this recording permanently? The transcript and evaluation stay." />
                </div>
              )}
            </Panel>
          </section>

          {/* 10-12. transcript, questions and answers, question scores */}
          <Panel title={`Transcript (${i.answers.length} of ${i.questions.length} answered)`}>
            {i.questions.length === 0 ? (
              <p className="text-sm text-uk-muted">The questions are generated before the interview starts.</p>
            ) : (
              <ol className="space-y-5">
                {i.questions.map((q, n) => {
                  const a = answerOf.get(q.id);
                  const s = scoreOf.get(q.id);
                  return (
                    <li key={q.id} className={q.followUpOf ? "ml-6 border-l-2 border-uk-line pl-4" : ""}>
                      <p className="text-xs text-uk-muted">
                        {n + 1}. {sectionLabel[q.section]}{q.followUpOf ? " · follow-up" : ""}{q.fromHr ? " · HR's question" : ""}
                      </p>
                      <p className="mt-0.5 font-medium text-uk-heading">{q.text}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-uk-body">
                        {!a ? <span className="text-uk-muted">(not answered)</span> : a.skipped ? <span className="text-uk-muted">(skipped)</span> : a.text}
                      </p>
                      {a && (
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-uk-muted">
                          <span>{a.input === "typed" ? "Typed" : a.input === "speech_edited" ? "Spoken, corrected by the candidate" : "Spoken (speech-to-text)"} · {Math.round((new Date(a.endedAt).getTime() - new Date(a.startedAt).getTime()) / 1000)} s</span>
                          {(() => {
                            const jump = answerStart(a);
                            return jump && playable.has(jump.segment) ? <PlayFromHere segment={jump.segment} ms={jump.ms} /> : null;
                          })()}
                        </p>
                      )}
                      {s && (
                        <p className="mt-1.5 rounded-lg bg-uk-surface-2 px-3 py-2 text-xs text-uk-body">
                          <strong className="text-uk-heading">{s.score}/10</strong> · {s.comment} {s.evidence && <span className="text-uk-muted">Evidence: {s.evidence}</span>}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-uk-muted">Looking for: {q.intent}</p>
                    </li>
                  );
                })}
              </ol>
            )}
            {i.mcq?.submittedAt && (
              <div className="mt-6 border-t border-uk-line pt-4 text-sm">
                <p className="font-medium text-uk-heading">Written test: {i.mcq.score}% correct{i.mcq.autoSubmitted ? " (submitted when time ran out)" : ""}</p>
                <ol className="mt-2 space-y-2">
                  {i.mcq.questions.map((m, n) => {
                    const chosen = i.mcq?.answers?.[m.id];
                    return (
                      <li key={m.id} className="text-uk-body">
                        {n + 1}. {m.question}{" "}
                        <span className={chosen === m.correctIndex ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}>
                          {chosen === null || chosen === undefined ? "Not answered" : `Chose “${m.options[chosen]}”`}{chosen === m.correctIndex ? " ✓" : ` · correct: “${m.options[m.correctIndex]}”`}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
          </Panel>

          {/* 13-15. score, report, recommendation */}
          <section id="evaluation">
            <Panel
              title="AI evaluation"
              action={i.status === "completed" || (i.answers.length > 0 && ["in_progress", "interrupted", "expired"].includes(i.status)) ? <ToolButton id={i.id} tool="evaluate" label={i.status === "completed" ? "Evaluate again" : "Evaluate what was answered"} icon={<RefreshCw className="h-3.5 w-3.5" />} confirm={i.status === "completed" ? undefined : "Close this unfinished interview and evaluate the answers so far?"} /> : undefined}
            >
              {i.evaluation.state === "failed" && <p className="mb-3 flex items-start gap-2 text-sm text-red-700 dark:text-red-400"><AlertTriangle className="mt-0.5 h-4 w-4" /> The evaluation failed: {i.evaluation.error}</p>}
              {(i.evaluation.state === "pending" || i.evaluation.state === "running") && <p className="text-sm text-uk-muted">Evaluating… this usually takes a minute or two. Reload to see the result.</p>}
              {!r ? (
                i.evaluation.state === "none" && <p className="text-sm text-uk-muted">The evaluation runs when the interview is completed.</p>
              ) : (
                <div className="space-y-5 text-sm">
                  <div className="flex flex-wrap items-end gap-6">
                    <div>
                      <p className="text-xs text-uk-muted">Overall score</p>
                      <p className="font-heading text-5xl font-bold text-uk-heading">{r.overall}<span className="text-xl text-uk-muted">/100</span></p>
                      <p className="text-xs text-uk-muted">Passing score {r.passingScore}{typeof r.testScore === "number" ? ` · test ${r.testScore}%` : ""}</p>
                    </div>
                    <div>
                      <p className="text-xs text-uk-muted">AI recommendation</p>
                      <RecommendationBadge rec={r.recommendation} />
                      {r.aiRecommendation !== r.recommendation && <p className="mt-1 text-xs text-uk-muted">The AI said “{recommendationLabel[r.aiRecommendation]}”; adjusted to match the score.</p>}
                    </div>
                  </div>
                  <p className="text-uk-body">{r.summary}</p>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px]">
                      <thead className="text-left text-xs text-uk-muted"><tr><th className="py-2 font-medium">Criterion (weight)</th><th className="py-2 font-medium">Score</th><th className="py-2 font-medium">Evidence</th></tr></thead>
                      <tbody className="divide-y divide-uk-line">
                        {CRITERIA_KEYS.map((k) => (
                          <tr key={k} className="align-top">
                            <td className="py-2 pr-3 text-uk-body">{criterionLabel[k]} ({i.config.criteriaWeights[k]}%)</td>
                            <td className="py-2 pr-3"><Score value={r.criteria[k]?.score} /></td>
                            <td className="py-2 text-xs text-uk-muted">{r.criteria[k]?.evidence}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {Object.keys(r.sections).length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-uk-muted">By section (average question score)</p>
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {Object.entries(r.sections).map(([k, v]) => (
                          <li key={k} className="flex items-center justify-between gap-2 rounded-lg bg-uk-surface-2 px-3 py-2"><span className="text-uk-body">{sectionLabel[k as keyof typeof sectionLabel]}</span><Score value={v} /></li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {[
                    ["Technical assessment", r.technicalAssessment],
                    ["Communication assessment", r.communicationAssessment],
                    ["Problem-solving assessment", r.problemSolvingAssessment],
                    ["Why this recommendation", r.recommendationReason],
                  ].map(([h, t]) => (
                    <div key={h}><p className="font-medium text-uk-heading">{h}</p><p className="mt-1 text-uk-body">{t}</p></div>
                  ))}
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      ["Strengths", r.strengths],
                      ["Weaknesses", r.weaknesses],
                      ["Skill gaps", r.skillGaps],
                      ["Recommended training", r.training],
                    ].map(([h, list]) => (
                      <div key={h as string}>
                        <p className="font-medium text-uk-heading">{h as string}</p>
                        <ul className="mt-1 list-disc space-y-1 pl-5 text-uk-body">{(list as string[]).map((x) => <li key={x}>{x}</li>)}</ul>
                      </div>
                    ))}
                  </div>
                  {r.caveats.length > 0 && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-900 dark:text-amber-200">
                      <p className="font-medium">Things to keep in mind</p>
                      <ul className="mt-1 list-disc pl-5">{r.caveats.map((c) => <li key={c}>{c}</li>)}</ul>
                    </div>
                  )}
                  <p className="text-xs text-uk-muted">Evaluated {fmt(i.evaluation.at)} by {i.evaluation.model}. The score is a recommendation only: it judges job-related answers, never appearance, voice or background.</p>
                  {(i.evaluation.history?.length ?? 0) > 0 && (
                    <details className="rounded-xl border border-uk-line p-3 text-sm" data-testid="evaluation-history">
                      <summary className="cursor-pointer font-medium text-uk-heading">Earlier evaluations ({i.evaluation.history!.length})</summary>
                      <ul className="mt-2 space-y-1 text-uk-body">
                        {[...i.evaluation.history!].reverse().map((h) => (
                          <li key={`${new Date(h.at).getTime()}-${h.overall}`} className="flex flex-wrap justify-between gap-2">
                            <span>{fmt(h.at)}{h.model ? ` · ${h.model}` : ""}</span>
                            <span className="tabular-nums">{h.overall}/100 · {recommendationLabel[h.recommendation] ?? h.recommendation}{" "}
                              <span className={h.overall === r.overall ? "text-uk-muted" : h.overall < r.overall ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}>
                                ({r.overall - h.overall >= 0 ? "+" : ""}{r.overall - h.overall} now)
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}
            </Panel>
          </section>

          {i.flags.length > 0 && (
            <Panel title="Session notes (warnings for HR, never an automatic rejection)">
              <ul className="space-y-1 text-sm">
                {i.flags.map((f, n) => <li key={n} className="text-uk-body">{fmt(f.at)} · {cheatFlagLabel[f.kind]}{f.detail ? ` (${f.detail})` : ""}</li>)}
              </ul>
            </Panel>
          )}

          <Panel title="Notifications">
            {notifications.items.length === 0 ? (
              <p className="text-sm text-uk-muted">None yet.</p>
            ) : (
              <ul className="divide-y divide-uk-line text-sm">
                {notifications.items.map((nt) => (
                  <li key={nt.id} className="flex flex-wrap justify-between gap-2 py-2">
                    <span className="text-uk-body">{nt.channel} · {isNotificationKind(nt.kind) ? notificationKindLabel[nt.kind] : nt.kind.replace("_", " ")}{nt.detail ? ` (${nt.detail})` : ""} → {nt.recipient}</span>
                    <span className={nt.status === "failed" ? "text-red-700 dark:text-red-400" : "text-uk-muted"}>{nt.status}{nt.error ? `: ${nt.error}` : ""} · {fmt(nt.updatedAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <aside className="min-w-0 space-y-6">
          <Panel title="Quick actions">
            <QuickActions id={i.id} candidateEmail={i.candidate.email} can={can} resumes={i.resumes} maxResumes={i.config.maxResumes} />
            {(i.selfReschedules ?? 0) > 0 && <p className="mt-3 text-xs text-uk-muted">The candidate moved this interview themselves {i.selfReschedules} time{i.selfReschedules === 1 ? "" : "s"}.</p>}
          </Panel>

          {/* 16. HR review */}
          <Panel title="HR review">
            <ReviewPanel id={i.id} aiRecommendation={r?.recommendation ?? null} override={i.hr.recommendationOverride ?? null} overrideReason={i.hr.overrideReason ?? ""} />
            {(i.hr.decisions.length > 0 || i.hr.comments.length > 0) && (
              <ul className="mt-6 space-y-3 border-t border-uk-line pt-4 text-sm">
                {[...i.hr.decisions.map((d) => ({ at: d.at, by: d.by, text: `${d.kind.replace("_", " ")}${d.stage ? ` → ${d.stage}` : ""}${d.note ? `: ${d.note}` : ""}` })), ...i.hr.comments.map((c) => ({ at: c.at, by: c.by, text: c.text }))]
                  .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
                  .map((x, n) => (
                    <li key={n}><p className="text-uk-body">{x.text}</p><p className="text-xs text-uk-muted">{x.by} · {fmt(x.at)}</p></li>
                  ))}
              </ul>
            )}
          </Panel>

          {attempts.length > 1 && (
            <Panel title="All AI interviews for this applicant">
              <ul className="space-y-2 text-sm">
                {attempts.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2">
                    <Link href={`/admin/ai-interviews/${a.id}`} className={a.id === i.id ? "font-semibold text-uk-heading" : "text-uk-blue hover:underline"}>Attempt {a.attempt}</Link>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <Panel title="Audit trail">
            <ol className="max-h-[32rem] space-y-2 overflow-y-auto text-xs">
              {auditLog.map((a) => (
                <li key={a.id}>
                  <span className="font-medium text-uk-heading">{a.action.replace(/[_:]/g, " ")}</span>
                  <span className="text-uk-muted"> · {a.by} · {fmt(a.at)}</span>
                  {a.detail && <p className="text-uk-body">{a.detail}</p>}
                </li>
              ))}
            </ol>
          </Panel>

          <p className="flex items-center gap-1.5 text-xs text-uk-muted"><Video className="h-3.5 w-3.5" /> <ExperienceBadge type={i.experienceType} /> {i.questions.length} questions · model {i.planModel ?? "—"}</p>
        </aside>
      </div>
    </>
  );
}
