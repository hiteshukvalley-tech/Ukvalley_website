import "server-only";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import {
  CRITERIA_KEYS, DEFAULT_SETTINGS, DIFFICULTIES, MUST_ASK_MAX, MUST_ASK_TEXT_MAX, REMINDER_OFFSETS, SECTION_KEYS, clamp, effectiveSettings, parseMustAsk, safeTimeZone,
  type AiInterviewSettings, type JobOverride, type QuestionTemplate, type ReminderOffset,
} from "./types";
import {
  DEFAULT_TEMPLATES, EMAIL_BODY_MAX, EMAIL_SUBJECT_MAX, NOTIFICATION_KINDS, WA_LANGUAGE, WA_NAME, isEmailOnlyKind, isPlaceholder,
  type NotificationTemplates,
} from "./templates";

// AI interview settings (one document) and per-job overrides. Server-only.
// Collection "aiInterviewSettings": _id "global" holds the settings and the
// notification templates; _id "job:<careerSlug>" holds one job's overrides.

const COLLECTION = "aiInterviewSettings";

type GlobalDoc = { _id: "global"; settings: AiInterviewSettings; templates: NotificationTemplates; updatedAt: Date; updatedBy: string };
type JobDoc = { _id: string; careerSlug: string; override: JobOverride; updatedAt: Date; updatedBy: string };

const col = () => getDb().collection<GlobalDoc | JobDoc>(COLLECTION);

// Read on every application and portal request: keep it 30 s in memory.
const CACHE_MS = 30_000;
const g = globalThis as unknown as { _aiSettingsCache?: { at: number; value: { settings: AiInterviewSettings; templates: NotificationTemplates } } };

/** Merges a stored value over the defaults, so settings saved before a new field existed still work. */
function withDefaults(saved: Partial<AiInterviewSettings> | undefined): AiInterviewSettings {
  const s = { ...DEFAULT_SETTINGS, ...(saved ?? {}) };
  return {
    ...s,
    sectionWeights: { ...DEFAULT_SETTINGS.sectionWeights, ...(saved?.sectionWeights ?? {}) },
    criteriaWeights: { ...DEFAULT_SETTINGS.criteriaWeights, ...(saved?.criteriaWeights ?? {}) },
    channels: { ...DEFAULT_SETTINGS.channels, ...(saved?.channels ?? {}) },
    fresher: { ...DEFAULT_SETTINGS.fresher, ...(saved?.fresher ?? {}) },
    experienced: { ...DEFAULT_SETTINGS.experienced, ...(saved?.experienced ?? {}) },
  };
}

function templatesWithDefaults(saved: Partial<NotificationTemplates> | undefined): NotificationTemplates {
  return {
    email: { ...DEFAULT_TEMPLATES.email, ...(saved?.email ?? {}) },
    whatsapp: { ...DEFAULT_TEMPLATES.whatsapp, ...(saved?.whatsapp ?? {}) },
  };
}

/** Global settings and templates (defaults when nothing is saved or the database can't be read). */
export async function getAiSettings(): Promise<{ settings: AiInterviewSettings; templates: NotificationTemplates }> {
  const hit = g._aiSettingsCache;
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
  let value = { settings: withDefaults(undefined), templates: templatesWithDefaults(undefined) };
  if (hasDatabaseUrl()) {
    try {
      const doc = (await col().findOne({ _id: "global" })) as GlobalDoc | null;
      if (doc) value = { settings: withDefaults(doc.settings), templates: templatesWithDefaults(doc.templates) };
    } catch {
      // The database is unreachable. Use the last good settings if there are
      // any, else the defaults (AI interviews off), and don't cache either:
      // the next call asks the database again, so a short outage doesn't turn
      // interviews off for every application in the next 30 seconds.
      return hit?.value ?? value;
    }
  }
  g._aiSettingsCache = { at: Date.now(), value };
  return value;
}

export const clearAiSettingsCache = () => {
  g._aiSettingsCache = undefined;
};

export async function getJobOverride(careerSlug: string | null | undefined): Promise<JobOverride | null> {
  if (!careerSlug || !hasDatabaseUrl()) return null;
  try {
    const doc = (await col().findOne({ _id: `job:${careerSlug}` })) as JobDoc | null;
    return doc?.override ?? null;
  } catch {
    return null;
  }
}

/** The settings an interview for this job runs with. */
export async function settingsForJob(careerSlug: string | null | undefined): Promise<AiInterviewSettings> {
  const [{ settings }, override] = await Promise.all([getAiSettings(), getJobOverride(careerSlug)]);
  return effectiveSettings(settings, override);
}

export async function listJobOverrides(): Promise<JobDoc[]> {
  if (!hasDatabaseUrl()) return [];
  try {
    return (await col().find({ _id: { $regex: "^job:" } }).toArray()) as JobDoc[];
  } catch {
    return [];
  }
}

export async function saveAiSettings(settings: AiInterviewSettings, templates: NotificationTemplates, by: string) {
  await col().updateOne(
    { _id: "global" },
    { $set: { settings, templates, updatedAt: new Date(), updatedBy: by } },
    { upsert: true }
  );
  clearAiSettingsCache();
}

export async function saveJobOverride(careerSlug: string, override: JobOverride, by: string) {
  await col().updateOne(
    { _id: `job:${careerSlug}` },
    { $set: { careerSlug, override, updatedAt: new Date(), updatedBy: by } },
    { upsert: true }
  );
}

export async function deleteJobOverride(careerSlug: string) {
  await col().deleteOne({ _id: `job:${careerSlug}` });
}

// --- reading the settings form ---------------------------------------------------------

export type FieldErrors = Record<string, string>;

const num = (f: FormData, k: string, lo: number, hi: number, e: FieldErrors, label: string, fallback: number): number => {
  const raw = String(f.get(k) ?? "").trim();
  if (raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < lo || n > hi) {
    e[k] = `${label} must be a number from ${lo} to ${hi}.`;
    return fallback;
  }
  return n;
};
const bool = (f: FormData, k: string) => f.get(k) === "on";
const lines = (raw: unknown, max: number) =>
  String(raw ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim().slice(0, 200))
    .filter(Boolean)
    .slice(0, max);

function readTemplate(f: FormData, prefix: string, fallback: QuestionTemplate, e: FieldErrors): QuestionTemplate {
  const focus = lines(f.get(`${prefix}.focus`), 20);
  const guidance = String(f.get(`${prefix}.guidance`) ?? "").trim().slice(0, 2000);
  const d = String(f.get(`${prefix}.difficulty`) ?? "");
  if (!focus.length) e[`${prefix}.focus`] = "Add at least one topic.";
  return {
    focus: focus.length ? focus : fallback.focus,
    guidance,
    difficulty: (DIFFICULTIES as readonly string[]).includes(d) ? (d as QuestionTemplate["difficulty"]) : fallback.difficulty,
  };
}

function readWeights<K extends string>(f: FormData, prefix: string, keys: readonly K[], e: FieldErrors, label: string): Record<K, number> {
  const out = {} as Record<K, number>;
  for (const k of keys) out[k] = num(f, `${prefix}.${k}`, 0, 100, e, label, 0);
  const sum = keys.reduce((s, k) => s + out[k], 0);
  if (sum !== 100) e[prefix] = `${label} must add up to 100 (now ${sum}).`;
  return out;
}

/** HR's must-ask questions: one per line, "section: question" or just the question. */
function readMustAsk(f: FormData, e: FieldErrors): string[] {
  const raw = String(f.get("mustAskQuestions") ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (raw.length > MUST_ASK_MAX) e.mustAskQuestions = `Up to ${MUST_ASK_MAX} questions.`;
  const long = raw.find((l) => l.length > MUST_ASK_TEXT_MAX + 20);
  if (long) e.mustAskQuestions = `Keep each question under ${MUST_ASK_TEXT_MAX} characters.`;
  const parsed = parseMustAsk(raw);
  if (raw.length && parsed.length < Math.min(raw.length, MUST_ASK_MAX)) e.mustAskQuestions = "Each line needs a question of at least 5 characters.";
  return raw.slice(0, MUST_ASK_MAX);
}

/** Reads the interview part of the form (shared by the global settings and a job override). */
export function readInterviewFields(f: FormData, base: AiInterviewSettings, e: FieldErrors) {
  return {
    durationMinutes: num(f, "durationMinutes", 5, 90, e, "Duration", base.durationMinutes),
    questionCount: num(f, "questionCount", 3, 30, e, "Question count", base.questionCount),
    maxFollowUps: num(f, "maxFollowUps", 0, 10, e, "Follow-up questions", base.maxFollowUps),
    passingScore: num(f, "passingScore", 0, 100, e, "Passing score", base.passingScore),
    sectionWeights: readWeights(f, "section", SECTION_KEYS, e, "Section weights"),
    criteriaWeights: readWeights(f, "criteria", CRITERIA_KEYS, e, "Evaluation weights"),
    fresher: readTemplate(f, "fresher", base.fresher, e),
    experienced: readTemplate(f, "experienced", base.experienced, e),
    technicalCategories: lines(f.get("technicalCategories"), 30),
    mustAskQuestions: readMustAsk(f, e),
    mcqEnabled: bool(f, "mcqEnabled"),
    mcqCount: num(f, "mcqCount", 1, 20, e, "Test questions", base.mcqCount),
    mcqMinutes: num(f, "mcqMinutes", 1, 60, e, "Test time", base.mcqMinutes),
    mcqWeight: num(f, "mcqWeight", 0, 100, e, "Test weight", base.mcqWeight),
    language: /^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(String(f.get("language") ?? "")) ? String(f.get("language")) : base.language,
  };
}

export function readSettingsForm(f: FormData, current: AiInterviewSettings): { value: AiInterviewSettings; errors: FieldErrors } {
  const e: FieldErrors = {};
  const reminders = REMINDER_OFFSETS.filter((o) => bool(f, `reminder.${o}`)) as ReminderOffset[];
  const value: AiInterviewSettings = {
    ...current,
    enabled: bool(f, "enabled"),
    autoSchedule: bool(f, "autoSchedule"),
    startRightAway: bool(f, "startRightAway"),
    inviteDelayMinutes: num(f, "inviteDelayMinutes", 0, 60, e, "Invitation delay", current.inviteDelayMinutes),
    linkOpenDays: num(f, "linkOpenDays", 1, 30, e, "Days to take it", current.linkOpenDays),
    scheduleDelayHours: num(f, "scheduleDelayHours", 0, 336, e, "Schedule delay", current.scheduleDelayHours),
    workdayStartHour: num(f, "workdayStartHour", 0, 22, e, "Working day start", current.workdayStartHour),
    workdayEndHour: num(f, "workdayEndHour", 1, 24, e, "Working day end", current.workdayEndHour),
    skipSundays: bool(f, "skipSundays"),
    joinWindowHours: num(f, "joinWindowHours", 1, 168, e, "Link open for", current.joinWindowHours),
    earlyJoinMinutes: num(f, "earlyJoinMinutes", 0, 120, e, "Early join", current.earlyJoinMinutes),
    fresherBelowYears: num(f, "fresherBelowYears", 0, 10, e, "Fresher threshold", current.fresherBelowYears),
    maxResumes: num(f, "maxResumes", 0, 10, e, "Resumes allowed", current.maxResumes),
    candidateReschedules: num(f, "candidateReschedules", 0, 5, e, "Candidate reschedules", current.candidateReschedules),
    recordVideo: bool(f, "recordVideo"),
    retentionDays: num(f, "retentionDays", 0, 3650, e, "Retention", current.retentionDays),
    channels: { email: bool(f, "channel.email"), whatsapp: bool(f, "channel.whatsapp"), calendar: bool(f, "channel.calendar") },
    reminders,
    notifyHrOnEvaluation: bool(f, "notifyHrOnEvaluation"),
    ...readInterviewFields(f, current, e),
  };
  if (value.workdayEndHour <= value.workdayStartHour) e.workdayEndHour = "The working day must end after it starts.";
  if (value.workdayEndHour - value.workdayStartHour < value.durationMinutes / 60) {
    e.workdayEndHour = "The working day is shorter than one interview.";
  }
  return { value, errors: e };
}

export function readTemplatesForm(f: FormData, current: NotificationTemplates): { value: NotificationTemplates; errors: FieldErrors } {
  const e: FieldErrors = {};
  const value: NotificationTemplates = { email: { ...current.email }, whatsapp: { ...current.whatsapp } };
  for (const kind of NOTIFICATION_KINDS) {
    const subject = String(f.get(`email.${kind}.subject`) ?? "").trim();
    const body = String(f.get(`email.${kind}.body`) ?? "").replace(/\r\n/g, "\n").trim();
    if (!subject) e[`email.${kind}.subject`] = "Enter a subject.";
    else if (subject.length > EMAIL_SUBJECT_MAX) e[`email.${kind}.subject`] = `Use ${EMAIL_SUBJECT_MAX} characters or fewer.`;
    if (!body) e[`email.${kind}.body`] = "Enter the message.";
    else if (body.length > EMAIL_BODY_MAX) e[`email.${kind}.body`] = `Use ${EMAIL_BODY_MAX} characters or fewer.`;
    if (subject && body) value.email[kind] = { subject, body };
    if (isEmailOnlyKind(kind)) continue;
    const name = String(f.get(`wa.${kind}.name`) ?? "").trim();
    const language = String(f.get(`wa.${kind}.language`) ?? "").trim();
    const params = String(f.get(`wa.${kind}.params`) ?? "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (!WA_NAME.test(name)) e[`wa.${kind}.name`] = "Lowercase letters, numbers and _ only (the template's name in Meta).";
    if (!WA_LANGUAGE.test(language)) e[`wa.${kind}.language`] = "A language code such as en or en_US.";
    const bad = params.filter((p) => !isPlaceholder(p));
    if (bad.length) e[`wa.${kind}.params`] = `Unknown placeholder: ${bad.join(", ")}.`;
    if (WA_NAME.test(name) && WA_LANGUAGE.test(language) && !bad.length) {
      value.whatsapp[kind] = { name, language, params: params.filter(isPlaceholder).slice(0, 10) };
    }
  }
  return { value, errors: e };
}

/** Keeps only valid numbers in a per-job override read from the form. */
export function readJobOverrideForm(f: FormData, base: AiInterviewSettings): { value: JobOverride; errors: FieldErrors } {
  const e: FieldErrors = {};
  const fields = readInterviewFields(f, base, e);
  // The job's interview must still fit in the general working day, or no time could ever be offered.
  const len = (fields as { durationMinutes?: number }).durationMinutes;
  if (typeof len === "number" && base.workdayEndHour - base.workdayStartHour < len / 60) {
    e.durationMinutes = `Longer than the working day (${base.workdayStartHour}:00–${base.workdayEndHour}:00 in Settings). Shorten it, or lengthen the working day first.`;
  }
  return { value: { enabled: bool(f, "enabled"), ...fields }, errors: e };
}

export { clamp, safeTimeZone };
