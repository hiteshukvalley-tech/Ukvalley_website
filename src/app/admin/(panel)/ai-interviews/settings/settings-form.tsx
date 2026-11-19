"use client";

import { startTransition, useActionState, useEffect, useState, type FormEvent } from "react";
import { toast } from "@/components/admin/toast";
import {
  CRITERIA_KEYS, DIFFICULTIES, MUST_ASK_MAX, REMINDER_OFFSETS, SECTION_KEYS, criterionLabel, reminderLabel, sectionLabel,
  type AiInterviewSettings,
} from "@/lib/ai-interview/types";
import { NOTIFICATION_KINDS, PLACEHOLDERS, isEmailOnlyKind, notificationKindLabel, type NotificationTemplates } from "@/lib/ai-interview/templates";
import { saveJobOverrideAction, saveSettingsAction, type ActionResult } from "../actions";

// The AI interview settings form and the per-job override form.

const input = "mt-1 block w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-uk-body outline-none focus-visible:border-ring aria-invalid:border-destructive";
const section = "rounded-2xl border border-uk-line bg-uk-card p-5 space-y-4";
const h2 = "font-heading text-base font-semibold text-uk-heading";

type Errors = Record<string, string>;
const errorsOf = (s: ActionResult | null): Errors => (s && !s.ok && s.errors ? s.errors : {});

/**
 * Submits through onSubmit instead of <form action>: React resets a form after
 * its action runs, so on "Please fix the highlighted fields" HR would see the
 * old values next to the errors. noValidate on the forms lets the server check
 * every field and name each problem; the browser's own min/max check blocked
 * the save with only a tooltip on one field.
 */
function submitWith(action: (f: FormData) => void) {
  return (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const submitter = (ev.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(ev.currentTarget, submitter instanceof HTMLButtonElement ? submitter : null);
    startTransition(() => action(data));
  };
}

function Err({ e, k }: { e: Errors; k: string }) {
  return e[k] ? <span role="alert" className="mt-1 block text-xs text-destructive">{e[k]}</span> : null;
}

function Num({ name, label, value, e, min, max, hint }: { name: string; label: string; value: number; e: Errors; min: number; max: number; hint?: string }) {
  return (
    <label className="block text-sm font-medium text-uk-heading">
      {label}
      <input type="number" name={name} defaultValue={value} min={min} max={max} className={input} aria-invalid={!!e[name] || undefined} />
      {hint && <span className="mt-1 block text-xs font-normal text-uk-muted">{hint}</span>}
      <Err e={e} k={name} />
    </label>
  );
}

function Check({ name, label, checked, hint }: { name: string; label: string; checked: boolean; hint?: string }) {
  return (
    <label className="flex items-start gap-2.5 text-sm text-uk-body">
      <input type="checkbox" name={name} defaultChecked={checked} className="mt-0.5 h-4 w-4 accent-[var(--uk-blue)]" />
      <span>
        {label}
        {hint && <span className="block text-xs text-uk-muted">{hint}</span>}
      </span>
    </label>
  );
}

/** The interview part: shared by the general settings and a job's override. */
export function InterviewFields({ s, e }: { s: AiInterviewSettings; e: Errors }) {
  const [sections, setSections] = useState(s.sectionWeights);
  const [criteria, setCriteria] = useState(s.criteriaWeights);
  const sum = (o: Record<string, number>) => Object.values(o).reduce((t, v) => t + (Number(v) || 0), 0);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Num name="durationMinutes" label="Duration (minutes)" value={s.durationMinutes} e={e} min={5} max={90} />
        <Num name="questionCount" label="Number of questions" value={s.questionCount} e={e} min={3} max={30} />
        <Num name="maxFollowUps" label="Follow-up questions (max)" value={s.maxFollowUps} e={e} min={0} max={10} />
        <Num name="passingScore" label="Passing score (0–100)" value={s.passingScore} e={e} min={0} max={100} />
        <label className="block text-sm font-medium text-uk-heading">
          Interview language
          <select name="language" defaultValue={s.language} className={input}>
            {["en-IN", "en-US", "en-GB", "hi-IN"].map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <span className="mt-1 block text-xs font-normal text-uk-muted">For speech recognition and the AI voice.</span>
        </label>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-uk-heading">Interview sections (questions are shared out by weight; must total 100, now {sum(sections)})</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {SECTION_KEYS.map((k) => (
            <label key={k} className="block text-xs text-uk-muted">
              {sectionLabel[k]} (%)
              <input type="number" name={`section.${k}`} min={0} max={100} value={sections[k]} onChange={(ev) => setSections({ ...sections, [k]: Number(ev.target.value) })} className={input} />
            </label>
          ))}
        </div>
        <Err e={e} k="section" />
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-uk-heading">Evaluation weights (must total 100, now {sum(criteria)})</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {CRITERIA_KEYS.map((k) => (
            <label key={k} className="block text-xs text-uk-muted">
              {criterionLabel[k]} (%)
              <input type="number" name={`criteria.${k}`} min={0} max={100} value={criteria[k]} onChange={(ev) => setCriteria({ ...criteria, [k]: Number(ev.target.value) })} className={input} />
            </label>
          ))}
        </div>
        <Err e={e} k="criteria" />
      </fieldset>

      <div className="grid gap-4 lg:grid-cols-2">
        {(["fresher", "experienced"] as const).map((kind) => (
          <fieldset key={kind} className="space-y-3 rounded-xl border border-uk-line p-4">
            <legend className="px-1 text-sm font-medium text-uk-heading">{kind === "fresher" ? "Fresher questions" : "Experienced questions"}</legend>
            <label className="block text-xs text-uk-muted">
              Topics to cover (one per line)
              <textarea name={`${kind}.focus`} rows={6} defaultValue={s[kind].focus.join("\n")} className={input} aria-invalid={!!e[`${kind}.focus`] || undefined} />
              <Err e={e} k={`${kind}.focus`} />
            </label>
            <label className="block text-xs text-uk-muted">
              Guidance for the AI interviewer
              <textarea name={`${kind}.guidance`} rows={3} defaultValue={s[kind].guidance} className={input} />
            </label>
            <label className="block text-xs text-uk-muted">
              Difficulty
              <select name={`${kind}.difficulty`} defaultValue={s[kind].difficulty} className={input}>
                {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
          </fieldset>
        ))}
      </div>

      <label className="block text-sm font-medium text-uk-heading">
        Technical question categories to emphasise (optional, one per line)
        <textarea name="technicalCategories" rows={3} defaultValue={s.technicalCategories.join("\n")} placeholder={"e.g. REST APIs\nDatabase design"} className={input} />
      </label>

      <label className="block text-sm font-medium text-uk-heading">
        Must-ask questions (optional, one per line, up to {MUST_ASK_MAX})
        <textarea
          name="mustAskQuestions"
          rows={4}
          defaultValue={(s.mustAskQuestions ?? []).join("\n")}
          placeholder={"behavioral: Tell me about a deadline you missed and what you changed afterwards.\nWhy do you want to work at Ukvalley?"}
          aria-describedby="mustAsk-hint"
          className={input}
        />
        <span id="mustAsk-hint" className="mt-1 block text-xs font-normal text-uk-muted">
          Asked word for word, in place of AI questions. Start a line with a section (intro, technical, problem_solving, job_specific, experience, behavioral) and a colon to place it; without one it is job-specific.
        </span>
        <Err e={e} k="mustAskQuestions" />
      </label>

      <fieldset className="space-y-3 rounded-xl border border-uk-line p-4">
        <legend className="px-1 text-sm font-medium text-uk-heading">Short multiple-choice test</legend>
        <Check name="mcqEnabled" label="Add a timed test after the spoken interview" checked={s.mcqEnabled} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Num name="mcqCount" label="Questions" value={s.mcqCount} e={e} min={1} max={20} />
          <Num name="mcqMinutes" label="Time (minutes)" value={s.mcqMinutes} e={e} min={1} max={60} />
          <Num name="mcqWeight" label="Weight in overall score" value={s.mcqWeight} e={e} min={0} max={100} hint="0 = shown to HR, not counted" />
        </div>
      </fieldset>
    </>
  );
}

export function SettingsForm({ settings: s, templates: t }: { settings: AiInterviewSettings; templates: NotificationTemplates }) {
  const [state, action, pending] = useActionState(saveSettingsAction, null);
  useEffect(() => void (state && toast.result(state, "Saved.")), [state]);
  const e = errorsOf(state);

  return (
    <form onSubmit={submitWith(action)} noValidate className="space-y-6">
      <section className={section}>
        <h2 className={h2}>General</h2>
        <Check name="enabled" label="AI interviews are on" checked={s.enabled} hint="When on, every new applicant gets an AI interview (a job opening can switch it off for itself below)." />
        <Check name="autoSchedule" label="Schedule automatically and send the invitation" checked={s.autoSchedule} hint="Off: interviews are created unscheduled and HR picks the time." />
        <div className="grid gap-4 sm:grid-cols-3">
          <Num name="fresherBelowYears" label="Fresher below (years)" value={s.fresherBelowYears} e={e} min={0} max={10} hint="From the experience on the form." />
          <Num name="maxResumes" label="Resumes after interruption" value={s.maxResumes} e={e} min={0} max={10} />
          <Num name="retentionDays" label="Keep recordings (days)" value={s.retentionDays} e={e} min={0} max={3650} hint="0 = keep until deleted by hand." />
        </div>
        <Check name="recordVideo" label="Record video and audio (off: written interviews only, nothing recorded)" checked={s.recordVideo} />
      </section>

      <section className={section}>
        <h2 className={h2}>Scheduling (India time)</h2>
        <Check name="startRightAway" label="Start right away: send a working interview link shortly after the candidate applies" checked={s.startRightAway} hint="The link opens as soon as it arrives, any time of day. Off: the interview is set at the next working slot below." />
        <div className="grid gap-4 sm:grid-cols-3">
          <Num name="inviteDelayMinutes" label="Send the link after applying (minutes)" value={s.inviteDelayMinutes} e={e} min={0} max={60} hint="Used when Start right away is on." />
          <Num name="linkOpenDays" label="Days to take the interview" value={s.linkOpenDays} e={e} min={1} max={30} hint="Start right away: the link stays open until 11:59 pm on the last day." />
          <Num name="scheduleDelayHours" label="Interview after applying (hours)" value={s.scheduleDelayHours} e={e} min={0} max={336} hint="When Start right away is off. Rounded up to the next working slot." />
          <Num name="workdayStartHour" label="Working day starts (hour)" value={s.workdayStartHour} e={e} min={0} max={22} />
          <Num name="workdayEndHour" label="Working day ends (hour)" value={s.workdayEndHour} e={e} min={1} max={24} />
          <Num name="joinWindowHours" label="Link stays open (hours after start)" value={s.joinWindowHours} e={e} min={1} max={168} />
          <Num name="earlyJoinMinutes" label="Link opens early (minutes)" value={s.earlyJoinMinutes} e={e} min={0} max={120} />
          <Num name="candidateReschedules" label="Candidate may pick a new time (times)" value={s.candidateReschedules ?? 0} e={e} min={0} max={5} hint="From the interview page, before starting or after missing it. 0 = only HR reschedules." />
        </div>
        <Check name="skipSundays" label="Skip Sundays" checked={s.skipSundays} />
      </section>

      <section className={section}>
        <h2 className={h2}>Interview structure and scoring</h2>
        <InterviewFields s={s} e={e} />
      </section>

      <section className={section}>
        <h2 className={h2}>Notifications</h2>
        <div className="flex flex-wrap gap-x-8 gap-y-2">
          <Check name="channel.email" label="Email" checked={s.channels.email} />
          <Check name="channel.whatsapp" label="WhatsApp (only candidates who agree)" checked={s.channels.whatsapp} />
          <Check name="channel.calendar" label="Google Calendar event" checked={s.channels.calendar} />
          <Check name="notifyHrOnEvaluation" label="Email HR when an evaluation is ready" checked={s.notifyHrOnEvaluation} />
        </div>
        <fieldset>
          <legend className="text-sm font-medium text-uk-heading">Reminders</legend>
          <div className="mt-2 flex flex-wrap gap-x-8 gap-y-2">
            {REMINDER_OFFSETS.map((o) => <Check key={o} name={`reminder.${o}`} label={reminderLabel[o]} checked={s.reminders.includes(o)} />)}
          </div>
        </fieldset>
      </section>

      <section className={section}>
        <h2 className={h2}>Message templates</h2>
        <p className="text-xs text-uk-muted">
          Placeholders: {Object.entries(PLACEHOLDERS).map(([k, v]) => <span key={k} title={v} className="mr-2 inline-block font-mono">{`{{${k}}}`}</span>)}
        </p>
        {NOTIFICATION_KINDS.map((kind) => (
          <details key={kind} className="rounded-xl border border-uk-line p-4" open={Object.keys(e).some((k) => k.includes(`.${kind}.`))}>
            <summary className="cursor-pointer text-sm font-medium text-uk-heading">{notificationKindLabel[kind]}</summary>
            <div className="mt-3 space-y-3">
              <label className="block text-xs text-uk-muted">
                Email subject
                <input name={`email.${kind}.subject`} defaultValue={t.email[kind].subject} maxLength={200} className={input} aria-invalid={!!e[`email.${kind}.subject`] || undefined} />
                <Err e={e} k={`email.${kind}.subject`} />
              </label>
              <label className="block text-xs text-uk-muted">
                Email message
                <textarea name={`email.${kind}.body`} rows={8} defaultValue={t.email[kind].body} maxLength={5000} className={`${input} font-mono text-xs`} aria-invalid={!!e[`email.${kind}.body`] || undefined} />
                <Err e={e} k={`email.${kind}.body`} />
              </label>
              {!isEmailOnlyKind(kind) && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="block text-xs text-uk-muted">
                    WhatsApp template name (approved in Meta)
                    <input name={`wa.${kind}.name`} defaultValue={t.whatsapp[kind].name} className={input} aria-invalid={!!e[`wa.${kind}.name`] || undefined} />
                    <Err e={e} k={`wa.${kind}.name`} />
                  </label>
                  <label className="block text-xs text-uk-muted">
                    Language code
                    <input name={`wa.${kind}.language`} defaultValue={t.whatsapp[kind].language} className={input} aria-invalid={!!e[`wa.${kind}.language`] || undefined} />
                    <Err e={e} k={`wa.${kind}.language`} />
                  </label>
                  <label className="block text-xs text-uk-muted">
                    Fills {"{{1}}, {{2}}…"} with (comma-separated)
                    <input name={`wa.${kind}.params`} defaultValue={t.whatsapp[kind].params.join(", ")} className={input} aria-invalid={!!e[`wa.${kind}.params`] || undefined} />
                    <Err e={e} k={`wa.${kind}.params`} />
                  </label>
                </div>
              )}
            </div>
          </details>
        ))}
      </section>

      {state && !state.ok && <p role="alert" className="text-sm text-destructive">{state.message}</p>}
      <div className="sticky bottom-4 flex justify-end">
        <button type="submit" disabled={pending} className="h-11 rounded-xl bg-uk-blue px-6 text-sm font-semibold text-uk-white shadow-lg disabled:opacity-60">
          {pending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}

export function JobOverrideForm({ careerSlug, role, base, enabled }: { careerSlug: string; role: string; base: AiInterviewSettings; enabled: boolean }) {
  const [state, action, pending] = useActionState(saveJobOverrideAction, null);
  useEffect(() => void (state && toast.result(state, "Saved.")), [state]);
  const e = errorsOf(state);
  return (
    <form onSubmit={submitWith(action)} noValidate className="space-y-4">
      <input type="hidden" name="careerSlug" value={careerSlug} />
      <p className="text-sm text-uk-muted">These settings replace the general ones for <strong className="text-uk-heading">{role}</strong>. Interviews already created keep the settings they started with.</p>
      <Check name="enabled" label="AI interviews on for this job" checked={enabled} />
      <InterviewFields s={base} e={e} />
      {state && !state.ok && <p role="alert" className="text-sm text-destructive">{state.message}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className="h-10 rounded-lg bg-uk-blue px-4 text-sm font-semibold text-uk-white disabled:opacity-60">{pending ? "Saving…" : "Save for this job"}</button>
        <button type="submit" name="remove" value="1" disabled={pending} className="h-10 rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body hover:bg-uk-surface-2">Use the general settings</button>
      </div>
    </form>
  );
}
