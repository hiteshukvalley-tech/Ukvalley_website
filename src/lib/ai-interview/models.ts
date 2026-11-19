// AI interviews: the normalized data models.
//
// The live interview runs on one session document (aiInterviews, see store.ts):
// the portal changes it many times a minute and every change must be atomic
// (the current question, the device lock, the test deadline). Each session is
// also written out as separate, queryable model collections, so reports, BI
// tools and other services can read questions, answers, scores, transcripts,
// recordings and HR reviews on their own:
//
//   model                     collection                     key
//   ------------------------  -----------------------------  -------------------------------
//   Users                     adminUsers                     (existing, users-store)
//   Jobs                      careers                        slug         (existing)
//   Applications              applications                   id           (existing)
//   Candidates                aiCandidates                   candidateId  (from the email)
//   InterviewConfigurations   aiInterviewConfigurations      configId     (hash of the settings)
//   InterviewSessions         aiInterviews                   interviewId  (source of truth)
//   InterviewSchedules        aiInterviewSchedules           interviewId
//   InterviewQuestions        aiInterviewQuestions           interviewId:questionId
//   InterviewAnswers          aiInterviewAnswers             interviewId:questionId
//   InterviewTranscripts      aiInterviewTranscripts         interviewId
//   InterviewRecordings       aiInterviewRecordingSets       interviewId  (chunks: aiInterviewRecordings)
//   InterviewEvaluations      aiInterviewEvaluations         interviewId  ("Score")
//   HRInterviewReviews        aiHrInterviewReviews           interviewId
//   NotificationTemplates     aiInterviewSettings            _id "global" (templates field)
//   NotificationLogs          aiNotificationLogs             (existing)
//   CalendarIntegrations      aiIntegrations                 _id "google-calendar"
//   InterviewAuditLogs        aiInterviewAudit               (existing, append-only)
//
// Every model document carries interviewId, applicationId, candidateId, jobId
// and configId, plus sourceUpdatedAt: the session's updatedAt it was built
// from, so an older write can never overwrite a newer one.
//
// This file is pure (no database), so the unit tests can check the mapping.

import { createHash } from "node:crypto";
import type { InterviewRecord } from "./store";
import {
  CRITERIA_KEYS, SECTION_KEYS, criterionLabel, recommendationLabel, sectionLabel,
  type AiInterviewSettings, type Recommendation, type SectionKey,
} from "./types.ts";

export const MODEL_COLLECTIONS = {
  candidates: "aiCandidates",
  configurations: "aiInterviewConfigurations",
  schedules: "aiInterviewSchedules",
  questions: "aiInterviewQuestions",
  answers: "aiInterviewAnswers",
  transcripts: "aiInterviewTranscripts",
  recordings: "aiInterviewRecordingSets",
  evaluations: "aiInterviewEvaluations",
  reviews: "aiHrInterviewReviews",
} as const;

export type ModelKey = keyof typeof MODEL_COLLECTIONS;

// --- ids ----------------------------------------------------------------------------------

const hash = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 24);

/** JSON with sorted keys, so the same settings always give the same hash. */
export function stableJson(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stableJson).join(",")}]`;
  if (v && typeof v === "object" && !(v instanceof Date)) {
    return `{${Object.keys(v)
      .sort()
      .filter((k) => (v as Record<string, unknown>)[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${stableJson((v as Record<string, unknown>)[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v ?? null);
}

/** One candidate per email address, across all their applications. */
export const candidateIdFor = (email: string) => `cand_${hash(email.trim().toLowerCase())}`;

/** One configuration per distinct set of interview settings. */
export const configIdFor = (config: AiInterviewSettings) => `cfg_${hash(stableJson(config))}`;

/** The job opening: its slug in "careers", or a stand-in for applications without one. */
export const jobIdFor = (i: Pick<InterviewRecord, "careerSlug" | "position">) =>
  i.careerSlug ?? `position:${i.position.trim().toLowerCase().slice(0, 150)}`;

// --- documents ----------------------------------------------------------------------------

export type Links = {
  interviewId: string;
  applicationId: string;
  candidateId: string;
  jobId: string;
  configId: string;
  attempt: number;
};

type Synced = Links & { _id: string; sourceUpdatedAt: Date };

export type CandidateModel = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  experience: string;
  experienceType: InterviewRecord["experienceType"];
  currentCompany: string;
  skills: string[];
  education: string;
  whatsappOptIn: boolean;
  timeZone: string;
};

export type ConfigurationModel = {
  _id: string;
  settings: AiInterviewSettings;
  /** the parts HR compares most often, for queries */
  durationMinutes: number;
  questionCount: number;
  passingScore: number;
  sectionWeights: AiInterviewSettings["sectionWeights"];
  criteriaWeights: AiInterviewSettings["criteriaWeights"];
};

export type ScheduleModel = Synced & {
  status: InterviewRecord["status"];
  startsAt: Date | null;
  closesAt: Date | null;
  durationMinutes: number;
  timeZone: string;
  /** bumps on every reschedule */
  version: number;
  reminders: { offsetMinutes: number; dueAt: Date }[];
  channels: AiInterviewSettings["channels"];
  calendar: InterviewRecord["calendar"];
};

export type QuestionModel = Synced & {
  questionId: string;
  kind: "spoken" | "mcq";
  order: number;
  section: SectionKey | null;
  sectionLabel: string | null;
  text: string;
  /** spoken: what a good answer covers (evaluator only) */
  intent?: string;
  followUpOf?: string | null;
  askedAt?: Date | null;
  /** mcq only */
  options?: string[];
  correctIndex?: number;
  topic?: string;
};

export type AnswerModel = Synced & {
  questionId: string;
  kind: "spoken" | "mcq";
  /** spoken */
  text?: string;
  input?: "speech" | "typed" | "speech_edited";
  skipped?: boolean;
  startedAt?: Date | null;
  endedAt?: Date | null;
  durationMs?: number | null;
  offsetMs?: number | null;
  /** recording part the offset is in */
  segment?: number | null;
  /** mcq */
  chosenIndex?: number | null;
  correct?: boolean;
  /** the AI's score for this answer, when evaluated */
  score?: number | null;
  comment?: string;
  evidence?: string;
};

export type TranscriptEntry = {
  questionId: string;
  speaker: "interviewer" | "candidate";
  text: string;
  at: Date | null;
  offsetMs: number | null;
  /** recording part the offset is in */
  segment?: number | null;
  section: SectionKey;
  followUp: boolean;
  skipped?: boolean;
};

export type TranscriptModel = Synced & {
  language: string;
  mode: InterviewRecord["mode"];
  startedAt: Date | null;
  completedAt: Date | null;
  entries: TranscriptEntry[];
  wordCount: number;
};

export type RecordingModel = Synced & {
  storage: InterviewRecord["recording"]["storage"];
  encrypted: true;
  segments: number;
  chunks: number;
  bytes: number;
  lastChunkAt: Date | null;
  startedAt: Date | null;
  endedAt: Date | null;
  /** consent the candidate gave before anything was recorded */
  consent: InterviewRecord["consent"];
  deleteAfter: Date | null;
  deletedAt: Date | null;
  status: "none" | "recording" | "stored" | "deleted";
};

export type EvaluationModel = Synced & {
  state: InterviewRecord["evaluation"]["state"];
  attempts: number;
  error: string | null;
  model: string | null;
  evaluatedAt: Date | null;
  overall: number | null;
  passingScore: number | null;
  passed: boolean | null;
  criteria: { key: string; label: string; weight: number; score: number; evidence: string }[];
  sections: { key: SectionKey; label: string; score: number }[];
  testScore: number | null;
  aiRecommendation: Recommendation | null;
  /** after the consistency check against the passing score */
  recommendation: Recommendation | null;
  /** HR's override when there is one, else the AI's */
  finalRecommendation: Recommendation | null;
  finalRecommendationLabel: string | null;
  strengths: string[];
  weaknesses: string[];
  skillGaps: string[];
  training: string[];
  summary: string;
  caveats: string[];
  flags: { kind: string; count: number }[];
};

export type ReviewModel = Synced & {
  comments: InterviewRecord["hr"]["comments"];
  decisions: InterviewRecord["hr"]["decisions"];
  latestDecision: InterviewRecord["hr"]["decisions"][number] | null;
  recommendationOverride: Recommendation | null;
  overrideReason: string | null;
};

export type InterviewModels = {
  links: Links;
  candidate: CandidateModel;
  configuration: ConfigurationModel;
  schedule: ScheduleModel;
  questions: QuestionModel[];
  answers: AnswerModel[];
  transcript: TranscriptModel;
  recording: RecordingModel;
  evaluation: EvaluationModel;
  review: ReviewModel;
};

const list = (s: string) =>
  s
    .split(/[,;\n]/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 100);

const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

/** Every model document for one interview session. */
export function buildModels(i: InterviewRecord): InterviewModels {
  const links: Links = {
    interviewId: i.id,
    applicationId: i.applicationId,
    candidateId: candidateIdFor(i.candidate.email),
    jobId: jobIdFor(i),
    configId: configIdFor(i.config),
    attempt: i.attempt,
  };
  const base = (id: string): Synced => ({ _id: id, ...links, sourceUpdatedAt: i.updatedAt });

  const candidate: CandidateModel = {
    _id: links.candidateId,
    name: i.candidate.name,
    email: i.candidate.email.trim().toLowerCase(),
    phone: i.candidate.phone,
    location: i.candidate.location,
    experience: i.candidate.experience,
    experienceType: i.experienceType,
    currentCompany: i.candidate.currentCompany,
    skills: list(i.candidate.skills),
    education: i.candidate.education,
    whatsappOptIn: i.candidate.whatsappOptIn,
    timeZone: i.candidate.timeZone,
  };

  const configuration: ConfigurationModel = {
    _id: links.configId,
    settings: i.config,
    durationMinutes: i.config.durationMinutes,
    questionCount: i.config.questionCount,
    passingScore: i.config.passingScore,
    sectionWeights: i.config.sectionWeights,
    criteriaWeights: i.config.criteriaWeights,
  };

  const schedule: ScheduleModel = {
    ...base(i.id),
    status: i.status,
    startsAt: i.schedule?.startsAt ?? null,
    closesAt: i.schedule?.closesAt ?? null,
    durationMinutes: i.config.durationMinutes,
    timeZone: i.candidate.timeZone,
    version: i.schedule?.version ?? 0,
    reminders: i.schedule
      ? i.config.reminders.map((m) => ({ offsetMinutes: m, dueAt: new Date(i.schedule!.startsAt.getTime() - m * 60_000) }))
      : [],
    channels: i.config.channels,
    calendar: i.calendar,
  };

  const result = i.evaluation.result;
  const scoreOf = new Map(result?.questions.map((q) => [q.questionId, q]) ?? []);
  const answerOf = new Map(i.answers.map((a) => [a.questionId, a]));

  const questions: QuestionModel[] = i.questions.map((q, n) => ({
    ...base(`${i.id}:${q.id}`),
    questionId: q.id,
    kind: "spoken",
    order: n,
    section: q.section,
    sectionLabel: sectionLabel[q.section],
    text: q.text,
    intent: q.intent,
    followUpOf: q.followUpOf ?? null,
    askedAt: q.askedAt ?? null,
  }));
  const mcq = i.mcq?.questions ?? [];
  mcq.forEach((m, n) =>
    questions.push({
      ...base(`${i.id}:${m.id}`),
      questionId: m.id,
      kind: "mcq",
      order: i.questions.length + n,
      section: null,
      sectionLabel: null,
      text: m.question,
      options: m.options,
      correctIndex: m.correctIndex,
      topic: m.topic,
    })
  );

  const answers: AnswerModel[] = i.answers.map((a) => {
    const s = scoreOf.get(a.questionId);
    return {
      ...base(`${i.id}:${a.questionId}`),
      questionId: a.questionId,
      kind: "spoken",
      text: a.text,
      input: a.input,
      skipped: !!a.skipped,
      startedAt: a.startedAt ?? null,
      endedAt: a.endedAt ?? null,
      durationMs: a.startedAt && a.endedAt ? Math.max(0, a.endedAt.getTime() - a.startedAt.getTime()) : null,
      offsetMs: a.offsetMs ?? null,
      segment: a.segment ?? null,
      score: s?.score ?? null,
      comment: s?.comment ?? "",
      evidence: s?.evidence ?? "",
    };
  });
  if (i.mcq?.submittedAt) {
    for (const m of mcq) {
      const chosen = i.mcq.answers?.[m.id] ?? null;
      answers.push({
        ...base(`${i.id}:${m.id}`),
        questionId: m.id,
        kind: "mcq",
        chosenIndex: chosen,
        correct: chosen === m.correctIndex,
        endedAt: i.mcq.submittedAt,
      });
    }
  }

  const entries: TranscriptEntry[] = [];
  for (const q of i.questions) {
    const a = answerOf.get(q.id);
    if (!q.askedAt && !a) continue;
    entries.push({ questionId: q.id, speaker: "interviewer", text: q.text, at: q.askedAt ?? null, offsetMs: null, section: q.section, followUp: !!q.followUpOf });
    if (a) {
      entries.push({
        questionId: q.id,
        speaker: "candidate",
        text: a.skipped ? "" : a.text,
        at: a.startedAt ?? null,
        offsetMs: a.offsetMs ?? null,
        segment: a.segment ?? null,
        section: q.section,
        followUp: !!q.followUpOf,
        ...(a.skipped ? { skipped: true } : {}),
      });
    }
  }
  const transcript: TranscriptModel = {
    ...base(i.id),
    language: i.config.language,
    mode: i.mode,
    startedAt: i.startedAt ?? null,
    completedAt: i.completedAt ?? null,
    entries,
    wordCount: entries.filter((e) => e.speaker === "candidate").reduce((n, e) => n + words(e.text), 0),
  };

  const rec = i.recording;
  const recording: RecordingModel = {
    ...base(i.id),
    storage: rec.storage,
    encrypted: true,
    segments: rec.segments,
    chunks: rec.chunks,
    bytes: rec.bytes,
    lastChunkAt: rec.lastChunkAt ?? null,
    startedAt: i.startedAt ?? null,
    endedAt: i.completedAt ?? null,
    consent: i.consent,
    deleteAfter: rec.deleteAfter ?? null,
    deletedAt: rec.deletedAt ?? null,
    status: rec.deletedAt ? "deleted" : rec.chunks === 0 ? "none" : i.status === "in_progress" ? "recording" : "stored",
  };

  const flagCounts = new Map<string, number>();
  for (const f of i.flags) flagCounts.set(f.kind, (flagCounts.get(f.kind) ?? 0) + 1);
  const final = i.hr.recommendationOverride ?? result?.recommendation ?? null;
  const evaluation: EvaluationModel = {
    ...base(i.id),
    state: i.evaluation.state,
    attempts: i.evaluation.attempts,
    error: i.evaluation.error ?? null,
    model: i.evaluation.model ?? null,
    evaluatedAt: i.evaluation.at ?? null,
    overall: result?.overall ?? null,
    passingScore: result?.passingScore ?? null,
    passed: result ? result.overall >= result.passingScore : null,
    criteria: result
      ? CRITERIA_KEYS.map((k) => ({
          key: k,
          label: criterionLabel[k],
          weight: i.config.criteriaWeights[k] ?? 0,
          score: result.criteria[k]?.score ?? 0,
          evidence: result.criteria[k]?.evidence ?? "",
        }))
      : [],
    sections: result
      ? SECTION_KEYS.filter((k) => typeof result.sections[k] === "number").map((k) => ({ key: k, label: sectionLabel[k], score: result.sections[k]! }))
      : [],
    testScore: result?.testScore ?? i.mcq?.score ?? null,
    aiRecommendation: result?.aiRecommendation ?? null,
    recommendation: result?.recommendation ?? null,
    finalRecommendation: final,
    finalRecommendationLabel: final ? recommendationLabel[final] : null,
    strengths: result?.strengths ?? [],
    weaknesses: result?.weaknesses ?? [],
    skillGaps: result?.skillGaps ?? [],
    training: result?.training ?? [],
    summary: result?.summary ?? "",
    caveats: result?.caveats ?? [],
    flags: [...flagCounts].map(([kind, count]) => ({ kind, count })),
  };

  const decisions = i.hr.decisions;
  const review: ReviewModel = {
    ...base(i.id),
    comments: i.hr.comments,
    decisions,
    latestDecision: decisions.length ? decisions[decisions.length - 1] : null,
    recommendationOverride: i.hr.recommendationOverride ?? null,
    overrideReason: i.hr.overrideReason ?? null,
  };

  return { links, candidate, configuration, schedule, questions, answers, transcript, recording, evaluation, review };
}

// --- validation (MongoDB $jsonSchema) ---------------------------------------------------------

const str = { bsonType: "string" };
const date = { bsonType: "date" };
const dateOrNull = { bsonType: ["date", "null"] };
const num = { bsonType: ["int", "long", "double", "decimal"] };
const numOrNull = { bsonType: ["int", "long", "double", "decimal", "null"] };

const linked = {
  _id: str,
  interviewId: str,
  applicationId: str,
  candidateId: str,
  jobId: str,
  configId: str,
  attempt: num,
  sourceUpdatedAt: date,
};
const linkedRequired = Object.keys(linked);

const schema = (required: string[], properties: Record<string, unknown>) => ({
  $jsonSchema: { bsonType: "object", required, properties },
});

/** The validator each model collection is created (or updated) with. */
export const MODEL_VALIDATORS: Record<ModelKey, Record<string, unknown>> = {
  candidates: schema(["_id", "name", "email"], {
    _id: str,
    name: str,
    email: str,
    phone: str,
    experienceType: { enum: ["fresher", "experienced"] },
    skills: { bsonType: "array", items: str },
    applicationIds: { bsonType: "array", items: str },
    interviewIds: { bsonType: "array", items: str },
  }),
  configurations: schema(["_id", "settings", "durationMinutes", "questionCount", "passingScore"], {
    _id: str,
    settings: { bsonType: "object" },
    durationMinutes: num,
    questionCount: num,
    passingScore: num,
  }),
  schedules: schema([...linkedRequired, "status"], {
    ...linked,
    status: str,
    startsAt: dateOrNull,
    closesAt: dateOrNull,
    timeZone: str,
    version: num,
    reminders: { bsonType: "array" },
  }),
  questions: schema([...linkedRequired, "questionId", "kind", "order", "text"], {
    ...linked,
    questionId: str,
    kind: { enum: ["spoken", "mcq"] },
    order: num,
    text: str,
  }),
  answers: schema([...linkedRequired, "questionId", "kind"], {
    ...linked,
    questionId: str,
    kind: { enum: ["spoken", "mcq"] },
    text: str,
    score: numOrNull,
  }),
  transcripts: schema([...linkedRequired, "entries"], {
    ...linked,
    entries: { bsonType: "array" },
    wordCount: num,
  }),
  recordings: schema([...linkedRequired, "storage", "segments", "chunks", "bytes", "status"], {
    ...linked,
    storage: { enum: ["gridfs", "s3"] },
    segments: num,
    chunks: num,
    bytes: num,
    status: { enum: ["none", "recording", "stored", "deleted"] },
    deleteAfter: dateOrNull,
  }),
  evaluations: schema([...linkedRequired, "state"], {
    ...linked,
    state: { enum: ["none", "pending", "running", "done", "failed"] },
    overall: numOrNull,
    criteria: { bsonType: "array" },
  }),
  reviews: schema([...linkedRequired, "comments", "decisions"], {
    ...linked,
    comments: { bsonType: "array" },
    decisions: { bsonType: "array" },
  }),
};

/** Indexes for each model collection (besides _id). */
export const MODEL_INDEXES: Record<ModelKey, { key: Record<string, 1 | -1>; unique?: boolean }[]> = {
  candidates: [{ key: { email: 1 }, unique: true }, { key: { lastAppliedAt: -1 } }],
  configurations: [{ key: { createdAt: -1 } }],
  schedules: [{ key: { status: 1, startsAt: 1 } }, { key: { candidateId: 1 } }, { key: { jobId: 1, startsAt: -1 } }],
  questions: [{ key: { interviewId: 1, order: 1 } }, { key: { jobId: 1, kind: 1 } }],
  answers: [{ key: { interviewId: 1 } }, { key: { candidateId: 1 } }],
  transcripts: [{ key: { candidateId: 1 } }, { key: { applicationId: 1 } }],
  recordings: [{ key: { applicationId: 1 } }, { key: { status: 1, deleteAfter: 1 } }],
  evaluations: [{ key: { jobId: 1, overall: -1 } }, { key: { finalRecommendation: 1 } }, { key: { candidateId: 1 } }],
  reviews: [{ key: { applicationId: 1 } }, { key: { "latestDecision.kind": 1 } }],
};
