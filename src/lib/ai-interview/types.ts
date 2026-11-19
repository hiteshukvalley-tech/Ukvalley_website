// AI interviews: shared types, constants and defaults. Client-safe and free of
// imports, so the browser portal, the admin forms, the server and the unit
// tests (node --test) can all use it.

// --- candidate type -----------------------------------------------------------------

export type ExperienceType = "fresher" | "experienced";

export const experienceTypeLabel: Record<ExperienceType, string> = {
  fresher: "Fresher",
  experienced: "Experienced",
};

/**
 * The lowest number of years each answer on the application form stands for
 * (applications-validation.ts EXPERIENCE_OPTIONS). Matched on the leading text
 * so a changed dash or spacing still works.
 */
export function experienceYears(experience: string): number {
  const e = experience.trim().toLowerCase();
  if (!e || e.startsWith("fresher")) return 0;
  const n = Number(/^(\d+)/.exec(e)?.[1]);
  return Number.isFinite(n) ? n : 0;
}

/** Fresher when the years on the form are below the threshold (HR sets it; default 1). */
export function classifyExperience(experience: string, fresherBelowYears: number): ExperienceType {
  return experienceYears(experience) < fresherBelowYears ? "fresher" : "experienced";
}

// --- interview lifecycle -------------------------------------------------------------

export const INTERVIEW_STATUSES = [
  "unscheduled",
  "scheduled",
  "accommodation",
  "in_progress",
  "interrupted",
  "completed",
  "missed",
  "expired",
  "cancelled",
] as const;
export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];

export const interviewStatusLabel: Record<InterviewStatus, string> = {
  unscheduled: "Not scheduled",
  scheduled: "Scheduled",
  accommodation: "Accommodation requested",
  in_progress: "In progress",
  interrupted: "Interrupted",
  completed: "Completed",
  missed: "Missed (no-show)",
  expired: "Link expired",
  cancelled: "Cancelled",
};

export const isInterviewStatus = (v: unknown): v is InterviewStatus =>
  typeof v === "string" && (INTERVIEW_STATUSES as readonly string[]).includes(v);

/** Statuses where the candidate can still take the interview. */
export const OPEN_STATUSES: readonly InterviewStatus[] = ["scheduled", "accommodation", "in_progress", "interrupted"];

export type EvaluationState = "none" | "pending" | "running" | "done" | "failed";

export const RECOMMENDATIONS = ["strongly_recommended", "recommended", "hold", "not_recommended"] as const;
export type Recommendation = (typeof RECOMMENDATIONS)[number];
export const recommendationLabel: Record<Recommendation, string> = {
  strongly_recommended: "Strongly recommended",
  recommended: "Recommended",
  hold: "Hold for HR review",
  not_recommended: "Not recommended",
};
export const isRecommendation = (v: unknown): v is Recommendation =>
  typeof v === "string" && (RECOMMENDATIONS as readonly string[]).includes(v);

/** What HR decides after reviewing an interview. */
export const HR_DECISIONS = ["shortlist", "reject", "next_round", "move_stage", "reassess", "comment"] as const;
export type HrDecision = (typeof HR_DECISIONS)[number];
export const hrDecisionLabel: Record<HrDecision, string> = {
  shortlist: "Shortlist",
  reject: "Reject",
  next_round: "Schedule next round",
  move_stage: "Move to another stage",
  reassess: "Request another assessment",
  comment: "Comment only",
};
export const isHrDecision = (v: unknown): v is HrDecision =>
  typeof v === "string" && (HR_DECISIONS as readonly string[]).includes(v);

/** How the candidate takes the interview: recorded video, or typed answers (accommodation). */
export type InterviewMode = "video" | "text";

// --- interview structure (sections) ------------------------------------------------

export const SECTION_KEYS = ["intro", "technical", "problem_solving", "job_specific", "experience", "behavioral"] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export const sectionLabel: Record<SectionKey, string> = {
  intro: "Introduction & communication",
  technical: "Technical knowledge",
  problem_solving: "Practical problem solving",
  job_specific: "Job-specific questions",
  experience: "Experience & projects",
  behavioral: "Behavioural assessment",
};

export type SectionWeights = Record<SectionKey, number>;

export const DEFAULT_SECTION_WEIGHTS: SectionWeights = {
  intro: 10,
  technical: 30,
  problem_solving: 20,
  job_specific: 20,
  experience: 10,
  behavioral: 10,
};

// --- evaluation rubric ---------------------------------------------------------------

export const CRITERIA_KEYS = ["technical", "problem_solving", "communication", "job_knowledge", "practical_experience", "behavioral"] as const;
export type CriterionKey = (typeof CRITERIA_KEYS)[number];

export const criterionLabel: Record<CriterionKey, string> = {
  technical: "Technical knowledge",
  problem_solving: "Problem-solving skills",
  communication: "Communication",
  job_knowledge: "Job-specific knowledge",
  practical_experience: "Practical experience",
  behavioral: "Behavioural responses",
};

export type CriteriaWeights = Record<CriterionKey, number>;

export const DEFAULT_CRITERIA_WEIGHTS: CriteriaWeights = {
  technical: 30,
  problem_solving: 20,
  communication: 15,
  job_knowledge: 15,
  practical_experience: 10,
  behavioral: 10,
};

export type Difficulty = "easy" | "medium" | "hard";
export const DIFFICULTIES: readonly Difficulty[] = ["easy", "medium", "hard"];

/** Per experience type: what the questions focus on. HR edits these lines. */
export type QuestionTemplate = {
  /** topics to cover, one per line */
  focus: string[];
  /** extra guidance for the AI interviewer */
  guidance: string;
  difficulty: Difficulty;
};

export const DEFAULT_FRESHER_TEMPLATE: QuestionTemplate = {
  focus: [
    "Personal introduction",
    "Educational background",
    "Academic or personal projects",
    "Programming and technical fundamentals",
    "Core subject knowledge for the role",
    "Practical problem solving",
    "Logical reasoning",
    "Communication",
    "Learning ability",
    "Job-related situational questions",
  ],
  guidance:
    "The candidate has little or no professional experience. Ask about fundamentals, concepts and their own projects. Prefer clear, single-part questions. Do not expect production experience.",
  difficulty: "easy",
};

export const DEFAULT_EXPERIENCED_TEMPLATE: QuestionTemplate = {
  focus: [
    "Professional introduction",
    "Previous company and responsibilities",
    "Technical expertise in the required skills",
    "Real-world project experience",
    "System design and architecture",
    "Problem-solving scenarios and production issues",
    "Team collaboration",
    "Ownership, leadership and decision-making",
    "Advanced technical questions",
    "Role-specific situational questions",
  ],
  guidance:
    "The candidate has professional experience. Ask scenario-based and in-depth questions grounded in what their resume says they did. Ask how and why, not only what.",
  difficulty: "medium",
};

// --- settings ---------------------------------------------------------------------------

export type ReminderOffset = 1440 | 60 | 15 | 0;
export const REMINDER_OFFSETS: readonly ReminderOffset[] = [1440, 60, 15, 0];
export const reminderLabel: Record<ReminderOffset, string> = {
  1440: "24 hours before",
  60: "1 hour before",
  15: "15 minutes before",
  0: "At the interview time",
};

/** Everything HR configures. A job opening can override the interview part (JobOverride). */
export type AiInterviewSettings = {
  enabled: boolean;
  /** schedule an interview automatically when someone applies */
  autoSchedule: boolean;
  /**
   * Start right away: the interview starts `inviteDelayMinutes` after the
   * candidate applies, whatever the time of day, and the invitation is sent at
   * that moment, so the link opens as soon as the candidate clicks it. Off:
   * `scheduleDelayHours`, rounded up to the next working slot.
   */
  startRightAway: boolean;
  /** minutes after applying that the invitation (and a working link) goes out, when startRightAway is on */
  inviteDelayMinutes: number;
  /** with startRightAway: days the candidate has to take it; the link closes at 11:59 pm India time on the last day (GrowthValley's windowDays) */
  linkOpenDays: number;
  /** how long after applying the interview is set, in hours (rounded up to the next working slot) */
  scheduleDelayHours: number;
  /** working hours for automatic slots, India time, 0–23 */
  workdayStartHour: number;
  workdayEndHour: number;
  /** skip Sundays for automatic slots */
  skipSundays: boolean;
  /** how long the link stays usable after the scheduled start, in hours (candidate may be late) */
  joinWindowHours: number;
  /** how early the link opens before the start, in minutes */
  earlyJoinMinutes: number;
  /** below this many years of experience the candidate is a fresher */
  fresherBelowYears: number;
  durationMinutes: number;
  questionCount: number;
  /** follow-up questions the AI may add, in total */
  maxFollowUps: number;
  sectionWeights: SectionWeights;
  criteriaWeights: CriteriaWeights;
  passingScore: number;
  fresher: QuestionTemplate;
  experienced: QuestionTemplate;
  /** technical question categories to emphasise, one per line (optional) */
  technicalCategories: string[];
  /**
   * Questions HR wants asked word for word, one per line, optionally starting
   * with a section ("behavioral: Tell me about…"; no section = job-specific).
   * They take the place of AI questions in their section.
   */
  mustAskQuestions: string[];
  /** a short timed multiple-choice test after the spoken part */
  mcqEnabled: boolean;
  mcqCount: number;
  mcqMinutes: number;
  /** weight of the test score in the overall score (0 = shown, not counted) */
  mcqWeight: number;
  /** BCP-47 tag for speech recognition and the AI voice, e.g. en-IN */
  language: string;
  /** how many times a candidate may resume after an interruption */
  maxResumes: number;
  /** how many times a candidate may pick another time themselves from the interview page (0 = never) */
  candidateReschedules: number;
  recordVideo: boolean;
  /** recordings are deleted this many days after the interview (0 = keep) */
  retentionDays: number;
  channels: { email: boolean; whatsapp: boolean; calendar: boolean };
  reminders: ReminderOffset[];
  /** email the HR inbox when an evaluation is ready */
  notifyHrOnEvaluation: boolean;
};

export const DEFAULT_SETTINGS: AiInterviewSettings = {
  enabled: false,
  autoSchedule: true,
  startRightAway: true,
  inviteDelayMinutes: 2,
  linkOpenDays: 3,
  scheduleDelayHours: 24,
  workdayStartHour: 10,
  workdayEndHour: 18,
  skipSundays: true,
  joinWindowHours: 24,
  earlyJoinMinutes: 15,
  fresherBelowYears: 1,
  durationMinutes: 25,
  questionCount: 10,
  maxFollowUps: 3,
  sectionWeights: DEFAULT_SECTION_WEIGHTS,
  criteriaWeights: DEFAULT_CRITERIA_WEIGHTS,
  passingScore: 60,
  fresher: DEFAULT_FRESHER_TEMPLATE,
  experienced: DEFAULT_EXPERIENCED_TEMPLATE,
  technicalCategories: [],
  mustAskQuestions: [],
  mcqEnabled: true,
  mcqCount: 5,
  mcqMinutes: 5,
  mcqWeight: 0,
  language: "en-IN",
  maxResumes: 3,
  candidateReschedules: 1,
  recordVideo: true,
  retentionDays: 180,
  channels: { email: true, whatsapp: false, calendar: true },
  reminders: [1440, 60, 15, 0],
  notifyHrOnEvaluation: true,
};

/** Interview settings a single job opening may change. */
export type JobOverride = Partial<
  Pick<
    AiInterviewSettings,
    | "durationMinutes"
    | "questionCount"
    | "maxFollowUps"
    | "sectionWeights"
    | "criteriaWeights"
    | "passingScore"
    | "fresher"
    | "experienced"
    | "technicalCategories"
    | "mustAskQuestions"
    | "mcqEnabled"
    | "mcqCount"
    | "mcqMinutes"
    | "mcqWeight"
    | "language"
  >
> & { enabled?: boolean };

/** The settings one interview runs with: global settings with the job's overrides on top. */
export function effectiveSettings(global: AiInterviewSettings, override?: JobOverride | null): AiInterviewSettings {
  if (!override) return global;
  const { enabled, ...rest } = override;
  const merged = { ...global };
  for (const [k, v] of Object.entries(rest)) if (v !== undefined) (merged as Record<string, unknown>)[k] = v;
  if (enabled === false) merged.enabled = false;
  return merged;
}

/** How many questions each section gets: proportional to its weight, at least one for any weighted section. */
export function allocateQuestions(total: number, weights: SectionWeights): Record<SectionKey, number> {
  const out = Object.fromEntries(SECTION_KEYS.map((k) => [k, 0])) as Record<SectionKey, number>;
  const active = SECTION_KEYS.filter((k) => weights[k] > 0);
  if (!active.length || total <= 0) return out;
  const n = Math.max(total, active.length);
  const sum = active.reduce((s, k) => s + weights[k], 0);
  // Largest remainder: floor every share, then hand the rest to the biggest fractions.
  const shares = active.map((k) => ({ k, exact: (weights[k] / sum) * n }));
  for (const s of shares) out[s.k] = Math.max(1, Math.floor(s.exact));
  let left = n - active.reduce((t, k) => t + out[k], 0);
  for (const s of [...shares].sort((a, b) => (b.exact % 1) - (a.exact % 1))) {
    if (left <= 0) break;
    out[s.k]++;
    left--;
  }
  // Floors of 1 can overshoot on tiny totals: take back from the largest sections.
  while (left < 0) {
    const k = [...active].sort((a, b) => out[b] - out[a])[0];
    if (out[k] <= 1) break;
    out[k]--;
    left++;
  }
  return out;
}

/** Weighted overall score (0–100) from criterion scores, plus the test when it is weighted. */
export function overallScore(
  scores: Partial<Record<CriterionKey, number>>,
  weights: CriteriaWeights,
  test?: { score: number; weight: number } | null
): number {
  let total = 0;
  let weight = 0;
  for (const k of CRITERIA_KEYS) {
    const w = weights[k] ?? 0;
    const s = scores[k];
    if (w > 0 && typeof s === "number" && Number.isFinite(s)) {
      total += clamp(s, 0, 100) * w;
      weight += w;
    }
  }
  if (test && test.weight > 0 && Number.isFinite(test.score)) {
    total += clamp(test.score, 0, 100) * test.weight;
    weight += test.weight;
  }
  return weight ? Math.round((total / weight) * 10) / 10 : 0;
}

/**
 * Keeps the AI's recommendation consistent with the score: a candidate below the
 * passing score can't be "recommended", and a high score never reads "not recommended"
 * without HR looking. HR can still override either way.
 */
export function consistentRecommendation(ai: Recommendation, score: number, passing: number): Recommendation {
  if (score < passing && (ai === "strongly_recommended" || ai === "recommended")) return "hold";
  if (score >= passing + 15 && ai === "not_recommended") return "hold";
  return ai;
}

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

// --- scheduling -----------------------------------------------------------------------

const IST_OFFSET_MIN = 330;

/** 11:59 pm India time, `days` calendar days after `from` (the last day a right-away link is open). */
export function endOfDayAfter(from: Date, days: number): Date {
  const ist = new Date(from.getTime() + IST_OFFSET_MIN * 60_000);
  const end = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() + Math.max(0, Math.floor(days)), 23, 59, 0);
  return new Date(end - IST_OFFSET_MIN * 60_000);
}

/**
 * The first working slot at or after `from + delayHours`: a :00 or :30 start
 * within working hours (India time), leaving room for the interview, skipping
 * Sundays when asked. India has no daylight saving, so a fixed offset is exact.
 */
export function nextWorkingSlot(
  from: Date,
  opts: { delayHours: number; startHour: number; endHour: number; skipSundays: boolean; durationMinutes: number }
): Date {
  const startHour = clamp(Math.floor(opts.startHour), 0, 23);
  const endHour = clamp(Math.floor(opts.endHour), startHour + 1, 24);
  // Work in "India wall-clock as UTC" so getUTC* reads India time.
  let t = new Date(from.getTime() + opts.delayHours * 3600_000 + IST_OFFSET_MIN * 60_000);
  // Round up to the next half hour.
  const mins = t.getUTCMinutes();
  t.setUTCSeconds(0, 0);
  if (mins % 30 !== 0) t.setUTCMinutes(mins + (30 - (mins % 30)));
  for (let guard = 0; guard < 14 * 48; guard++) {
    const h = t.getUTCHours() + t.getUTCMinutes() / 60;
    const endsBy = h + opts.durationMinutes / 60;
    const sunday = t.getUTCDay() === 0;
    if (!(opts.skipSundays && sunday) && h >= startHour && endsBy <= endHour) break;
    if (h < startHour && !(opts.skipSundays && sunday)) {
      t.setUTCHours(startHour, 0, 0, 0);
      continue;
    }
    // Next day at the start hour.
    t = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() + 1, startHour, 0, 0));
  }
  return new Date(t.getTime() - IST_OFFSET_MIN * 60_000);
}

/** A valid IANA time zone, else the fallback. */
export function safeTimeZone(tz: string | null | undefined, fallback = "Asia/Kolkata"): string {
  const z = String(tz ?? "").trim();
  if (!z || z.length > 64) return fallback;
  try {
    new Intl.DateTimeFormat("en", { timeZone: z });
    return z;
  } catch {
    return fallback;
  }
}

/** "Mon, 24 Nov 2026, 11:00 am (IST)" in the given zone. */
export function formatInZone(d: Date, timeZone: string): string {
  const tz = safeTimeZone(timeZone);
  const text = new Intl.DateTimeFormat("en-IN", {
    timeZone: tz,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
  const name =
    new Intl.DateTimeFormat("en-IN", { timeZone: tz, timeZoneName: "short" }).formatToParts(d).find((p) => p.type === "timeZoneName")
      ?.value ?? tz;
  return `${text} (${tz === "Asia/Kolkata" ? "IST" : name})`;
}

/** When a reminder at `offset` minutes before `startsAt` is due. */
export const reminderDueAt = (startsAt: Date, offset: ReminderOffset) => new Date(startsAt.getTime() - offset * 60_000);

// --- what the portal and HR see ---------------------------------------------------------

// Integrity and technical flags: warnings HR reviews, never an automatic rejection,
// and never sent to the AI evaluator (only technical problems are, so they don't
// count against the answers).
export type CheatFlagKind =
  | "tab_hidden" | "window_blur" | "fullscreen_exit" | "camera_lost" | "mic_lost" | "paste" | "resumed"
  | "multiple_faces" | "no_face" | "offline";
export const cheatFlagLabel: Record<CheatFlagKind, string> = {
  tab_hidden: "Switched tab or minimised the window",
  window_blur: "Left the interview window",
  fullscreen_exit: "Left full screen",
  camera_lost: "Camera stopped or permission revoked",
  mic_lost: "Microphone stopped or permission revoked",
  paste: "Pasted text into an answer",
  resumed: "Resumed after an interruption",
  multiple_faces: "More than one face in the camera (browser face detection)",
  no_face: "No face in the camera for a while (browser face detection)",
  offline: "Lost the internet connection",
};
export const isCheatFlag = (v: unknown): v is CheatFlagKind => typeof v === "string" && Object.hasOwn(cheatFlagLabel, v);

/** The question the portal shows (never carries scoring hints). */
export type PortalQuestion = {
  id: string;
  index: number;
  total: number;
  section: SectionKey;
  text: string;
  followUp: boolean;
};

/** A test question as the candidate sees it (no answer key). */
export type PortalMcq = { id: string; question: string; options: string[] };

/** Text limits shared by the portal and the server. */
export const ANSWER_MAX = 6000;
export const ACCOMMODATION_NOTE_MAX = 1000;
export const HR_COMMENT_MAX = 3000;

// --- consent --------------------------------------------------------------------------------

export const CONSENT_VERSION = "2026-11";
/** What the candidate agrees to (shown on the portal, stored with the consent). Recording items are left out of a written (accommodation) interview. */
export const CONSENT_ITEMS = {
  audio: "Recording of my audio",
  video: "Recording of my video",
  transcription: "Automatic transcription of my answers (speech-to-text)",
  ai: "AI analysis of my answers to produce a score and report for the HR team, who make the hiring decision",
  storage: "Secure storage of the recording and transcript for the retention period, then deletion",
} as const;
export type ConsentItem = keyof typeof CONSENT_ITEMS;

// --- must-ask questions ------------------------------------------------------------------------

export const MUST_ASK_MAX = 15;
export const MUST_ASK_TEXT_MAX = 500;

/**
 * Reads HR's must-ask lines: "section: question" or just "question"
 * (job-specific). A section can be its key or its label's first word
 * ("technical", "behavioural", "problem_solving"…). Empty lines are dropped.
 */
export function parseMustAsk(lines: readonly string[]): { section: SectionKey; text: string }[] {
  const out: { section: SectionKey; text: string }[] = [];
  const alias: Record<string, SectionKey> = {
    intro: "intro", introduction: "intro", technical: "technical", problem_solving: "problem_solving", problem: "problem_solving",
    "problem solving": "problem_solving", job_specific: "job_specific", "job specific": "job_specific", job: "job_specific",
    experience: "experience", behavioral: "behavioral", behavioural: "behavioral",
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const m = /^([a-z _]{3,20}):\s*(.+)$/i.exec(line);
    const section = m ? alias[m[1].trim().toLowerCase()] : undefined;
    const text = (section ? m![2] : line).trim().slice(0, MUST_ASK_TEXT_MAX);
    if (text.length >= 5) out.push({ section: section ?? "job_specific", text });
    if (out.length >= MUST_ASK_MAX) break;
  }
  return out;
}

// --- picking times ---------------------------------------------------------------------------------

export type SlotRules = { startHour: number; endHour: number; skipSundays: boolean; durationMinutes: number };

/** Whether a time is a slot an interview may start at: on the half hour, in working hours, not on a skipped Sunday. */
export function isWorkingSlot(t: Date, rules: SlotRules): boolean {
  if (t.getTime() % (30 * 60_000) !== 0) return false;
  return nextWorkingSlot(t, { ...rules, delayHours: 0 }).getTime() === t.getTime();
}

/**
 * The next `count` working slots from `from` (plus `minLeadHours`), at least
 * `gapHours` apart, so a candidate sees a spread of times rather than six
 * half-hours in a row. Slots never go past `maxDays` ahead.
 */
export function workingSlots(from: Date, rules: SlotRules, count: number, opts: { minLeadHours?: number; gapHours?: number; maxDays?: number } = {}): Date[] {
  const gap = (opts.gapHours ?? 3) * 3600_000;
  const until = from.getTime() + (opts.maxDays ?? 14) * 86400_000;
  const out: Date[] = [];
  let t = nextWorkingSlot(from, { ...rules, delayHours: opts.minLeadHours ?? 2 });
  while (out.length < count && t.getTime() <= until) {
    out.push(t);
    t = nextWorkingSlot(new Date(t.getTime() + gap), { ...rules, delayHours: 0 });
  }
  return out;
}

// --- work queues and bulk actions (admin) --------------------------------------------------------

/** Lists of interviews waiting for HR, shown as "Needs attention" on the dashboard. */
export const ATTENTION_QUEUES = ["awaiting_decision", "accommodation", "evaluation_failed", "unfinished", "missed", "unscheduled"] as const;
export type AttentionQueue = (typeof ATTENTION_QUEUES)[number];
export const isAttentionQueue = (v: unknown): v is AttentionQueue => typeof v === "string" && (ATTENTION_QUEUES as readonly string[]).includes(v);

export const attentionQueueInfo: Record<AttentionQueue, { label: string; hint: string }> = {
  awaiting_decision: { label: "Awaiting your decision", hint: "Evaluated, with no HR decision yet. Shortlist, reject or move them on." },
  accommodation: { label: "Accommodation requests", hint: "Candidates who asked for another way to interview. Allow a written interview or arrange one." },
  evaluation_failed: { label: "Evaluation failed", hint: "The AI couldn't score these. Evaluate again." },
  unfinished: { label: "Unfinished (link expired)", hint: "Started but not finished in time. Evaluate what was answered, or give a new time." },
  missed: { label: "Missed", hint: "The link closed without the interview being started. Give a new time or cancel." },
  unscheduled: { label: "Not scheduled", hint: "Created without a time. Schedule them to send the invitation." },
};

/** What HR can do to many interviews at once (Schedule → select → action). */
export const BULK_ACTIONS = ["remind", "resend_invite", "auto_schedule", "extend_24h", "evaluate", "shortlist", "reject", "cancel"] as const;
export type BulkAction = (typeof BULK_ACTIONS)[number];
export const isBulkAction = (v: unknown): v is BulkAction => typeof v === "string" && (BULK_ACTIONS as readonly string[]).includes(v);
export const BULK_MAX = 100;

export const bulkActionLabel: Record<BulkAction, string> = {
  remind: "Send a reminder",
  resend_invite: "Send the invitation again",
  auto_schedule: "Schedule at the next free time",
  extend_24h: "Keep the link open 24 hours longer",
  evaluate: "Evaluate (again)",
  shortlist: "Shortlist",
  reject: "Reject",
  cancel: "Cancel the interview",
};

/** Limits for HR's own message to a candidate. */
export const HR_MESSAGE_SUBJECT_MAX = 150;
export const HR_MESSAGE_BODY_MAX = 4000;
/** Hours the link window can be extended by in one go. */
export const EXTEND_HOURS = [2, 6, 24, 48, 72] as const;
