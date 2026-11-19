import "server-only";
import { randomUUID } from "node:crypto";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { integrationKey } from "@/lib/integration-keys";
import { ATTENTION_QUEUES, type AttentionQueue } from "./types";
import type {
  AiInterviewSettings, CheatFlagKind, CriterionKey, EvaluationState, ExperienceType, HrDecision, InterviewMode,
  InterviewStatus, Recommendation, SectionKey,
} from "./types";
import type { NotificationKind } from "./templates";

// AI interview records. Server-only. Collections:
//   aiInterviews          one interview session per application (and attempt);
//                         its questions, answers, test and evaluation are stored
//                         inside it: they are bounded (≈30 items) and always read together
//   aiInterviewAudit      every action on an interview (append-only)
//   aiNotificationLogs    every email / WhatsApp / calendar notification and its result
//   aiInterviewRecordings recording chunks (see recordings.ts)
//   aiInterviewJobs       background jobs (see jobs.ts)
// Each session is also written out to the normalized model collections
// (questions, answers, transcript, evaluation…): see models.ts and models-store.ts.
// The candidate's details come from the application ("applications"); a
// snapshot is kept so a deleted application still leaves a readable record.

export type InterviewQuestion = {
  id: string;
  section: SectionKey;
  text: string;
  /** what a good answer covers: for the evaluator, never shown to the candidate */
  intent: string;
  /** set on follow-up questions: the question it follows */
  followUpOf?: string;
  askedAt?: Date;
  /** one of HR's must-ask questions (settings), asked as written */
  fromHr?: boolean;
};

export type InterviewAnswer = {
  questionId: string;
  text: string;
  /** how the text was captured */
  input: "speech" | "typed" | "speech_edited";
  startedAt: Date;
  endedAt: Date;
  /** milliseconds from the start of the recording segment when the answer was submitted, for jumping to the answer */
  offsetMs?: number;
  /** the recording segment (part) that was running, so offsetMs points into the right file */
  segment?: number;
  /** the candidate skipped it ("I don't know", technical problem) */
  skipped?: boolean;
};

export type McqQuestion = { id: string; question: string; options: string[]; correctIndex: number; topic: string };

export type McqState = {
  questions: McqQuestion[];
  startedAt?: Date;
  deadline?: Date;
  submittedAt?: Date;
  /** chosen option per question id (null = unanswered) */
  answers?: Record<string, number | null>;
  autoSubmitted?: boolean;
  /** percentage correct */
  score?: number;
};

export type CriterionResult = { score: number; evidence: string };
export type QuestionResult = { questionId: string; score: number; comment: string; evidence: string };

export type EvaluationResult = {
  overall: number;
  criteria: Record<CriterionKey, CriterionResult>;
  /** average question score per section, 0–100 */
  sections: Partial<Record<SectionKey, number>>;
  questions: QuestionResult[];
  technicalAssessment: string;
  communicationAssessment: string;
  problemSolvingAssessment: string;
  strengths: string[];
  weaknesses: string[];
  skillGaps: string[];
  training: string[];
  summary: string;
  /** after the consistency check against the passing score */
  recommendation: Recommendation;
  /** what the AI itself said, before the check */
  aiRecommendation: Recommendation;
  recommendationReason: string;
  /** things HR should know: technical problems, short transcript… */
  caveats: string[];
  testScore?: number;
  passingScore: number;
};

export type HrComment = { by: string; at: Date; text: string };
export type HrDecisionRecord = { kind: HrDecision; by: string; at: Date; note: string; stage?: string };

export type InterviewRecord = {
  id: string;
  applicationId: string;
  careerSlug: string | null;
  /** 1 for the first interview; higher when HR asked for another assessment */
  attempt: number;
  candidate: {
    name: string;
    email: string;
    phone: string;
    location: string;
    experience: string;
    currentCompany: string;
    skills: string;
    education: string;
    whatsappOptIn: boolean;
    timeZone: string;
  };
  position: string;
  experienceType: ExperienceType;
  /** settings frozen when the interview was created: every candidate for a run gets the same rubric */
  config: AiInterviewSettings;
  status: InterviewStatus;
  mode: InterviewMode;
  schedule: { startsAt: Date; closesAt: Date; version: number } | null;
  tokenHash: string | null;
  /** the link's token, encrypted: reminders need the link again; lookups use only the hash */
  tokenEnc: string | null;
  device: { keyHash: string; boundAt: Date } | null;
  consent: { at: Date; ip: string; userAgent: string; items: string[]; version: string } | null;
  accommodation?: { requestedAt: Date; note: string; resolvedAt?: Date; resolution?: string };
  calendar: { status: "none" | "not_connected" | "created" | "cancelled" | "failed"; eventId?: string; htmlLink?: string; error?: string; version?: number };
  questions: InterviewQuestion[];
  answers: InterviewAnswer[];
  planModel?: string;
  followUpsUsed: number;
  mcq: McqState | null;
  flags: { kind: CheatFlagKind; at: Date; detail?: string }[];
  resumes: number;
  /** times the candidate picked another time themselves (interview page) */
  selfReschedules?: number;
  /** answers.length when the candidate last started or resumed; a resume only counts against maxResumes after progress since then */
  answersAtStart?: number;
  startedAt?: Date;
  completedAt?: Date;
  lastActivityAt?: Date;
  recording: { segments: number; chunks: number; bytes: number; storage: "gridfs" | "s3"; lastChunkAt?: Date; deletedAt?: Date; deleteAfter?: Date };
  evaluation: {
    state: EvaluationState; attempts: number; error?: string; result?: EvaluationResult; model?: string; at?: Date;
    /** when the current run started (a run older than a job lease counts as crashed) */
    runningSince?: Date;
    /** earlier results, newest last (kept when HR evaluates again) */
    history?: { at: Date; model: string; overall: number; recommendation: Recommendation }[];
  };
  hr: { comments: HrComment[]; decisions: HrDecisionRecord[]; recommendationOverride?: Recommendation; overrideReason?: string };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  /** links to the normalized models (models.ts), set by the model sync */
  candidateId?: string;
  jobId?: string;
  configId?: string;
  /** the session updatedAt the models were last written from */
  modelsSyncedAt?: Date;
};

type Doc = Omit<InterviewRecord, "id"> & { _id: string };

const COL = "aiInterviews";
export const col = () => getDb().collection<Doc>(COL);
const toRecord = ({ _id, ...rest }: Doc): InterviewRecord => ({ ...rest, id: _id });

// --- indexes ------------------------------------------------------------------------------

let indexes: Promise<void> | null = null;
/** Creates the indexes once per process (cheap no-ops when they exist). */
export function ensureIndexes(): Promise<void> {
  indexes ??= (async () => {
    const db = getDb();
    await Promise.all([
      col().createIndex({ applicationId: 1, attempt: -1 }),
      // One interview per application and attempt (a double click on "Create" can't make two).
      // Best effort: an older database that already holds a duplicate keeps working without it.
      col()
        .createIndex({ applicationId: 1, attempt: 1 }, { unique: true, name: "one_attempt_per_application" })
        .catch((e) => console.error("[ai-interview] unique attempt index not created:", e instanceof Error ? e.message : e)),
      col().createIndex({ tokenHash: 1 }, { unique: true, partialFilterExpression: { tokenHash: { $type: "string" } } }),
      col().createIndex({ status: 1, "schedule.startsAt": 1 }),
      col().createIndex({ position: 1, "evaluation.result.overall": -1 }),
      col().createIndex({ createdAt: -1 }),
      col().createIndex({ "recording.deleteAfter": 1 }, { partialFilterExpression: { "recording.deleteAfter": { $type: "date" } } }),
      db.collection(AUDIT).createIndex({ interviewId: 1, at: -1 }),
      db.collection(NOTIFY).createIndex({ interviewId: 1, createdAt: -1 }),
      db.collection(NOTIFY).createIndex({ createdAt: -1 }),
      db.collection(NOTIFY).createIndex({ providerId: 1 }, { partialFilterExpression: { providerId: { $type: "string" } } }),
    ]);
  })().catch((e) => {
    indexes = null;
    throw e;
  });
  return indexes;
}

// --- create / read -------------------------------------------------------------------------

export async function createInterview(
  input: Pick<InterviewRecord, "applicationId" | "careerSlug" | "candidate" | "position" | "experienceType" | "config" | "createdBy"> & {
    attempt?: number;
    mode?: InterviewMode;
  }
): Promise<InterviewRecord> {
  await ensureIndexes();
  const now = new Date();
  const doc: Doc = {
    _id: randomUUID(),
    attempt: input.attempt ?? 1,
    applicationId: input.applicationId,
    careerSlug: input.careerSlug,
    candidate: input.candidate,
    position: input.position,
    experienceType: input.experienceType,
    config: input.config,
    status: "unscheduled",
    mode: input.mode ?? (input.config.recordVideo ? "video" : "text"),
    schedule: null,
    tokenHash: null,
    tokenEnc: null,
    device: null,
    consent: null,
    calendar: { status: "none" },
    questions: [],
    answers: [],
    followUpsUsed: 0,
    mcq: null,
    flags: [],
    resumes: 0,
    recording: { segments: 0, chunks: 0, bytes: 0, storage: integrationKey("RECORDING_STORAGE") === "s3" ? "s3" : "gridfs" },
    evaluation: { state: "none", attempts: 0 },
    hr: { comments: [], decisions: [] },
    createdAt: now,
    updatedAt: now,
    createdBy: input.createdBy,
  };
  try {
    await col().insertOne(doc);
  } catch (e) {
    if ((e as { code?: number })?.code === 11000) throw new Error("This applicant already has this AI interview. Reload the page.");
    throw e;
  }
  queueModelSync(doc._id);
  return toRecord(doc);
}

export async function getInterview(id: string): Promise<InterviewRecord | null> {
  if (!hasDatabaseUrl() || typeof id !== "string" || id.length > 64) return null;
  const doc = await col().findOne({ _id: id });
  return doc ? toRecord(doc) : null;
}

export async function getInterviewByTokenHash(tokenHash: string): Promise<InterviewRecord | null> {
  if (!hasDatabaseUrl()) return null;
  const doc = await col().findOne({ tokenHash });
  return doc ? toRecord(doc) : null;
}

/** The latest interview for an application, or null. */
export async function latestForApplication(applicationId: string): Promise<InterviewRecord | null> {
  if (!hasDatabaseUrl()) return null;
  try {
    const doc = await col().findOne({ applicationId }, { sort: { attempt: -1 } });
    return doc ? toRecord(doc) : null;
  } catch {
    return null;
  }
}

export async function listForApplication(applicationId: string): Promise<InterviewRecord[]> {
  if (!hasDatabaseUrl()) return [];
  return (await col().find({ applicationId }).sort({ attempt: -1 }).toArray()).map(toRecord);
}

/**
 * Updates an interview. `expect` makes it conditional (e.g. only while still
 * "scheduled"), so two requests racing can't both move it. Returns the new
 * record, or null when nothing matched.
 */
export async function updateInterview(
  id: string,
  update: { $set?: Record<string, unknown>; $push?: Record<string, unknown>; $inc?: Record<string, number>; $unset?: Record<string, ""> },
  expect: Record<string, unknown> = {}
): Promise<InterviewRecord | null> {
  const doc = await col().findOneAndUpdate(
    { _id: id, ...expect },
    { ...update, $set: { ...(update.$set ?? {}), updatedAt: new Date() } } as never,
    { returnDocument: "after" }
  );
  if (doc) queueModelSync(id);
  return doc ? toRecord(doc) : null;
}

/** Brings the session's model collections up to date shortly (models-store.ts). Never throws. */
function queueModelSync(id: string) {
  // Imported lazily: models-store imports this file.
  void import("./models-store").then((m) => m.scheduleModelSync(id)).catch(() => {});
}

// --- lists for HR ---------------------------------------------------------------------------

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export type InterviewQuery = {
  status?: InterviewStatus | "";
  position?: string;
  experienceType?: ExperienceType | "";
  recommendation?: Recommendation | "";
  minScore?: number;
  q?: string;
  from?: Date;
  to?: Date;
  sort?: "schedule" | "score" | "created";
  /** a work queue ("needs attention" on the dashboard) */
  queue?: AttentionQueue | "";
  page?: number;
  pageSize?: number;
};

/** What puts an interview in each work queue (see ATTENTION_QUEUES in types.ts). */
export function queueFilter(queue: AttentionQueue): Record<string, unknown> {
  switch (queue) {
    case "awaiting_decision":
      return { status: "completed", "evaluation.state": "done", "hr.decisions.0": { $exists: false } };
    case "evaluation_failed":
      return { "evaluation.state": "failed" };
    case "accommodation":
      return { status: "accommodation" };
    case "missed":
      return { status: "missed" };
    case "unfinished":
      return { status: "expired", "answers.0": { $exists: true } };
    case "unscheduled":
      return { status: "unscheduled" };
  }
}

/** How many interviews wait in each work queue. */
export async function attentionCounts(): Promise<Record<AttentionQueue, number>> {
  const out = Object.fromEntries(ATTENTION_QUEUES.map((q) => [q, 0])) as Record<AttentionQueue, number>;
  if (!hasDatabaseUrl()) return out;
  try {
    const counts = await Promise.all(ATTENTION_QUEUES.map((q) => col().countDocuments(queueFilter(q))));
    ATTENTION_QUEUES.forEach((q, n) => (out[q] = counts[n]));
  } catch {
    // The dashboard shows zeros (and its own database error) when the database is unreachable.
  }
  return out;
}

/** Mongo filter for the list. Only the latest attempt per application matters to HR, so older attempts stay visible but last. */
function filterOf(q: InterviewQuery): Record<string, unknown> {
  const f: Record<string, unknown> = {};
  if (q.queue) f.$and = [queueFilter(q.queue)];
  if (q.status) f.status = q.status;
  if (q.experienceType) f.experienceType = q.experienceType;
  if (q.position?.trim()) f.position = { $regex: `^${escapeRegex(q.position.trim().slice(0, 150))}$`, $options: "i" };
  if (q.recommendation) {
    f.$or = [
      { "hr.recommendationOverride": q.recommendation },
      { "hr.recommendationOverride": { $exists: false }, "evaluation.result.recommendation": q.recommendation },
    ];
  }
  if (typeof q.minScore === "number" && q.minScore > 0) f["evaluation.result.overall"] = { $gte: q.minScore };
  if (q.from || q.to) {
    f["schedule.startsAt"] = { ...(q.from ? { $gte: q.from } : {}), ...(q.to ? { $lt: q.to } : {}) };
  }
  const needle = q.q?.trim();
  if (needle) {
    const rx = { $regex: escapeRegex(needle.slice(0, 100)), $options: "i" };
    const text = [{ "candidate.name": rx }, { "candidate.email": rx }, { "candidate.phone": rx }, { position: rx }];
    f.$and = [...((f.$and as unknown[]) ?? []), { $or: text }];
  }
  return f;
}

/** The fields the lists need (no transcript, no questions). */
const LIST_PROJECTION = {
  tokenEnc: 0,
  tokenHash: 0,
  questions: 0,
  answers: 0,
  "mcq.questions": 0,
  "evaluation.result.questions": 0,
  config: 0,
} as const;

export type InterviewListItem = Omit<InterviewRecord, "questions" | "answers" | "config">;

export async function listInterviews(q: InterviewQuery = {}): Promise<{ items: InterviewListItem[]; total: number; dbError?: string }> {
  if (!hasDatabaseUrl()) return { items: [], total: 0, dbError: "MONGODB_URI is not set." };
  const pageSize = Math.floor(Math.min(100, Math.max(5, q.pageSize ?? 25)));
  // Whole pages only (?page=1.5 must not reach skip()).
  const page = Math.max(1, Math.floor(q.page ?? 1) || 1);
  const sort: Record<string, 1 | -1> =
    q.sort === "score" ? { "evaluation.result.overall": -1, createdAt: -1 } : q.sort === "created" ? { createdAt: -1 } : { "schedule.startsAt": -1, createdAt: -1 };
  try {
    const filter = filterOf(q);
    const [docs, total] = await Promise.all([
      col().find(filter, { projection: LIST_PROJECTION }).sort(sort).skip((page - 1) * pageSize).limit(pageSize).toArray(),
      col().countDocuments(filter),
    ]);
    return {
      items: docs.map((d) => toRecord(d as Doc) as InterviewListItem),
      total,
    };
  } catch (e) {
    return { items: [], total: 0, dbError: e instanceof Error ? e.message : "Could not read interviews." };
  }
}

/** Upper bound for one CSV export. */
export const EXPORT_MAX = 5000;

/** Interviews for a CSV export: the list's filters, or exactly these ids. Throws when the database can't be read. */
export async function listForExport(q: InterviewQuery, ids?: string[]): Promise<InterviewListItem[]> {
  if (!hasDatabaseUrl()) return [];
  const filter = ids?.length ? { _id: { $in: ids.slice(0, EXPORT_MAX) } } : filterOf(q);
  const sort: Record<string, 1 | -1> =
    q.sort === "score" ? { "evaluation.result.overall": -1, createdAt: -1 } : q.sort === "created" ? { createdAt: -1 } : { "schedule.startsAt": -1, createdAt: -1 };
  const docs = await col().find(filter as never, { projection: LIST_PROJECTION }).sort(sort).limit(EXPORT_MAX).toArray();
  return docs.map((d) => toRecord(d as Doc) as InterviewListItem);
}

/** Every interview for one position, best first (for the comparison page). */
export async function listForPosition(position: string): Promise<InterviewListItem[]> {
  if (!hasDatabaseUrl() || !position.trim()) return [];
  const docs = await col()
    .find({ position: { $regex: `^${escapeRegex(position.trim().slice(0, 150))}$`, $options: "i" } }, { projection: LIST_PROJECTION })
    .sort({ "evaluation.result.overall": -1, createdAt: -1 })
    .limit(500)
    .toArray();
  // One row per applicant (a "reassess" makes a second attempt): their latest
  // evaluated attempt, or their latest attempt when none is evaluated yet.
  const pick = new Map<string, (typeof docs)[number]>();
  const rank = (d: (typeof docs)[number]) => (d.evaluation?.result ? 1_000_000 : 0) + (d.attempt ?? 1);
  for (const d of docs) {
    const cur = pick.get(d.applicationId);
    if (!cur || rank(d) > rank(cur)) pick.set(d.applicationId, d);
  }
  return docs.filter((d) => pick.get(d.applicationId) === d).map((d) => toRecord(d as Doc) as InterviewListItem);
}

export async function listPositions(): Promise<{ position: string; total: number }[]> {
  if (!hasDatabaseUrl()) return [];
  try {
    const rows = await col()
      .aggregate<{ _id: string; total: number }>([
        { $group: { _id: "$position", total: { $sum: 1 } } },
        { $sort: { total: -1, _id: 1 } },
        { $limit: 200 },
      ])
      .toArray();
    return rows.map((r) => ({ position: r._id, total: r.total }));
  } catch {
    return [];
  }
}

// --- "Awaiting decision" inbox and the recordings list (as in GrowthValley's HR panel) ---------

/** How many evaluated interviews wait for an HR decision (the sidebar badge). 0 when the database can't be read. */
export async function awaitingDecisionCount(): Promise<number> {
  if (!hasDatabaseUrl()) return 0;
  try {
    return await col().countDocuments(queueFilter("awaiting_decision"));
  } catch {
    return 0;
  }
}

/** Evaluated interviews with no HR decision yet: best score first, then the longest waiting. */
export async function listAwaitingDecision(position = ""): Promise<{ items: InterviewListItem[]; dbError?: string }> {
  if (!hasDatabaseUrl()) return { items: [], dbError: "MONGODB_URI is not set." };
  const filter: Record<string, unknown> = { ...queueFilter("awaiting_decision") };
  if (position.trim()) filter.position = { $regex: `^${escapeRegex(position.trim().slice(0, 150))}$`, $options: "i" };
  try {
    const docs = await col().find(filter, { projection: LIST_PROJECTION }).sort({ "evaluation.result.overall": -1, completedAt: 1 }).limit(200).toArray();
    return { items: docs.map((d) => toRecord(d as Doc) as InterviewListItem) };
  } catch (e) {
    return { items: [], dbError: e instanceof Error ? e.message : "Could not read interviews." };
  }
}

export type RecordingFilter = "all" | "yes" | "none" | "deleted";

/** Interviews by recording state, newest first, for the Recordings page. */
export async function listRecordings(q: { has?: RecordingFilter; position?: string; q?: string } = {}): Promise<{
  items: InterviewListItem[];
  counts: Record<RecordingFilter, number>;
  dbError?: string;
}> {
  const empty = { all: 0, yes: 0, none: 0, deleted: 0 };
  if (!hasDatabaseUrl()) return { items: [], counts: empty, dbError: "MONGODB_URI is not set." };
  // Only interviews that were started can have a recording (or be missing one).
  const base: Record<string, unknown> = { startedAt: { $exists: true } };
  if (q.position?.trim()) base.position = { $regex: `^${escapeRegex(q.position.trim().slice(0, 150))}$`, $options: "i" };
  const needle = q.q?.trim();
  if (needle) {
    const rx = { $regex: escapeRegex(needle.slice(0, 100)), $options: "i" };
    base.$or = [{ "candidate.name": rx }, { "candidate.email": rx }, { position: rx }];
  }
  const by: Record<RecordingFilter, Record<string, unknown>> = {
    all: {},
    yes: { "recording.chunks": { $gt: 0 }, "recording.deletedAt": { $exists: false } },
    none: { "recording.chunks": { $in: [0, null] }, "recording.deletedAt": { $exists: false } },
    deleted: { "recording.deletedAt": { $exists: true } },
  };
  const has = q.has ?? "all";
  try {
    const [docs, ...counts] = await Promise.all([
      col().find({ ...base, ...by[has] }, { projection: LIST_PROJECTION }).sort({ startedAt: -1 }).limit(300).toArray(),
      ...(["all", "yes", "none", "deleted"] as const).map((k) => col().countDocuments({ ...base, ...by[k] })),
    ]);
    return {
      items: docs.map((d) => toRecord(d as Doc) as InterviewListItem),
      counts: { all: counts[0], yes: counts[1], none: counts[2], deleted: counts[3] },
    };
  } catch (e) {
    return { items: [], counts: empty, dbError: e instanceof Error ? e.message : "Could not read recordings." };
  }
}

// --- dashboard numbers ------------------------------------------------------------------------

export type DashboardStats = {
  total: number;
  byStatus: Record<string, number>;
  byPosition: { position: string; total: number; completed: number }[];
  byExperience: Record<ExperienceType, number>;
  scoreBuckets: { label: string; count: number }[];
  averageScore: number | null;
  recommended: number;
  evaluated: number;
  upcoming: InterviewListItem[];
  recent: AuditEntry[];
  dbError?: string;
};

export async function dashboardStats(): Promise<DashboardStats> {
  const empty: DashboardStats = {
    total: 0, byStatus: {}, byPosition: [], byExperience: { fresher: 0, experienced: 0 }, scoreBuckets: [],
    averageScore: null, recommended: 0, evaluated: 0, upcoming: [], recent: [],
  };
  if (!hasDatabaseUrl()) return { ...empty, dbError: "MONGODB_URI is not set." };
  try {
    const [facets] = await col()
      .aggregate<{
        status: { _id: string; n: number }[];
        position: { _id: string; total: number; completed: number }[];
        experience: { _id: ExperienceType; n: number }[];
        scores: { _id: number | string; n: number }[];
        avg: { _id: null; avg: number; n: number }[];
        recommended: { n: number }[];
      }>([
        {
          $facet: {
            status: [{ $group: { _id: "$status", n: { $sum: 1 } } }],
            position: [
              { $group: { _id: "$position", total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } } } },
              { $sort: { total: -1 } },
              { $limit: 8 },
            ],
            experience: [{ $group: { _id: "$experienceType", n: { $sum: 1 } } }],
            scores: [
              { $match: { "evaluation.state": "done" } },
              {
                $bucket: {
                  groupBy: "$evaluation.result.overall",
                  boundaries: [0, 40, 60, 75, 90, 100.01],
                  default: "other",
                  output: { n: { $sum: 1 } },
                },
              },
            ],
            avg: [{ $match: { "evaluation.state": "done" } }, { $group: { _id: null, avg: { $avg: "$evaluation.result.overall" }, n: { $sum: 1 } } }],
            recommended: [
              {
                $match: {
                  $or: [
                    { "hr.recommendationOverride": { $in: ["strongly_recommended", "recommended"] } },
                    { "hr.recommendationOverride": { $exists: false }, "evaluation.result.recommendation": { $in: ["strongly_recommended", "recommended"] } },
                  ],
                },
              },
              { $count: "n" },
            ],
          },
        },
      ])
      .toArray();
    const byStatus: Record<string, number> = {};
    let total = 0;
    for (const s of facets.status) {
      byStatus[s._id] = s.n;
      total += s.n;
    }
    const labels: Record<string, string> = { 0: "0–39", 40: "40–59", 60: "60–74", 75: "75–89", 90: "90–100" };
    const scoreBuckets = ["0", "40", "60", "75", "90"].map((k) => ({
      label: labels[k],
      count: facets.scores.find((b) => String(b._id) === k)?.n ?? 0,
    }));
    const byExperience = { fresher: 0, experienced: 0 } as Record<ExperienceType, number>;
    for (const e of facets.experience) if (e._id in byExperience) byExperience[e._id] = e.n;
    const now = new Date();
    const [upcoming, recent] = await Promise.all([
      col()
        .find({ status: { $in: ["scheduled", "interrupted", "accommodation"] }, "schedule.closesAt": { $gte: now } }, { projection: LIST_PROJECTION })
        .sort({ "schedule.startsAt": 1 })
        .limit(8)
        .toArray(),
      listAudit({ limit: 10 }),
    ]);
    return {
      total,
      byStatus,
      byPosition: facets.position.map((p) => ({ position: p._id, total: p.total, completed: p.completed })),
      byExperience,
      scoreBuckets,
      averageScore: facets.avg[0] ? Math.round(facets.avg[0].avg * 10) / 10 : null,
      evaluated: facets.avg[0]?.n ?? 0,
      recommended: facets.recommended[0]?.n ?? 0,
      upcoming: upcoming.map((d) => toRecord(d as Doc) as InterviewListItem),
      recent,
    };
  } catch (e) {
    return { ...empty, dbError: e instanceof Error ? e.message : "Could not read interviews." };
  }
}

// --- audit trail ------------------------------------------------------------------------------

const AUDIT = "aiInterviewAudit";

export type AuditEntry = {
  id: string;
  interviewId: string;
  applicationId: string;
  candidateName: string;
  action: string;
  /** admin email, "system" or "candidate" */
  by: string;
  detail?: string;
  at: Date;
};

/** Appends to the audit trail. Never throws: a missing line must not fail the action. */
export async function audit(entry: Omit<AuditEntry, "id" | "at">): Promise<void> {
  if (!hasDatabaseUrl()) return;
  try {
    await getDb()
      .collection(AUDIT)
      .insertOne({ _id: randomUUID() as never, ...entry, detail: entry.detail?.slice(0, 2000), at: new Date() });
  } catch (e) {
    console.error("[ai-interview] audit write failed:", e instanceof Error ? e.message : e);
  }
}

export async function listAudit(q: { interviewId?: string; limit?: number } = {}): Promise<AuditEntry[]> {
  if (!hasDatabaseUrl()) return [];
  try {
    const docs = await getDb()
      .collection(AUDIT)
      .find(q.interviewId ? { interviewId: q.interviewId } : {})
      .sort({ at: -1 })
      .limit(Math.min(500, q.limit ?? 100))
      .toArray();
    return docs.map(({ _id, ...rest }) => ({ ...(rest as Omit<AuditEntry, "id">), id: String(_id) }));
  } catch {
    return [];
  }
}

// --- notification log ----------------------------------------------------------------------------

const NOTIFY = "aiNotificationLogs";
export type Channel = "email" | "whatsapp" | "calendar";
export type NotificationStatus = "queued" | "sent" | "delivered" | "read" | "failed" | "skipped";

export type NotificationLog = {
  id: string;
  interviewId: string;
  applicationId: string;
  candidateName: string;
  channel: Channel;
  /** hr_message: an email HR wrote to the candidate from the interview page */
  kind: NotificationKind | "calendar_create" | "calendar_update" | "calendar_cancel" | "hr_message";
  recipient: string;
  status: NotificationStatus;
  error?: string;
  attempts: number;
  /** id the provider gave the message (WhatsApp message id, calendar event id) */
  providerId?: string;
  /** reminder offset, for reminders */
  detail?: string;
  createdAt: Date;
  sentAt?: Date;
  updatedAt: Date;
};

export async function logNotification(
  entry: Omit<NotificationLog, "id" | "createdAt" | "updatedAt" | "attempts"> & { id?: string; attempts?: number }
): Promise<string> {
  const id = entry.id ?? randomUUID();
  if (!hasDatabaseUrl()) return id;
  try {
    const now = new Date();
    const { id: _ignored, attempts, ...rest } = entry;
    void _ignored;
    await getDb()
      .collection(NOTIFY)
      .updateOne(
        { _id: id as never },
        {
          $set: { ...rest, error: rest.error?.slice(0, 500), updatedAt: now, ...(rest.status === "sent" ? { sentAt: now } : {}) },
          $inc: { attempts: attempts ?? 1 },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true }
      );
  } catch (e) {
    console.error("[ai-interview] notification log failed:", e instanceof Error ? e.message : e);
  }
  return id;
}

/** WhatsApp delivery receipts (webhook) update the line by the provider's message id. */
export async function updateNotificationByProviderId(providerId: string, status: NotificationStatus, error?: string) {
  if (!hasDatabaseUrl()) return;
  // Receipts can arrive out of order: never move "read" back to "delivered".
  const rank: Record<string, number> = { queued: 0, sent: 1, delivered: 2, read: 3, failed: 4, skipped: 0 };
  const before = Object.keys(rank).filter((s) => rank[s] < rank[status] || status === "failed");
  await getDb()
    .collection(NOTIFY)
    .updateOne(
      { providerId, status: { $in: before } },
      { $set: { status, updatedAt: new Date(), ...(error ? { error: error.slice(0, 500) } : {}) } }
    );
}

export async function listNotifications(q: {
  interviewId?: string;
  channel?: Channel | "";
  status?: NotificationStatus | "";
  page?: number;
  pageSize?: number;
}): Promise<{ items: NotificationLog[]; total: number; dbError?: string }> {
  if (!hasDatabaseUrl()) return { items: [], total: 0, dbError: "MONGODB_URI is not set." };
  const f: Record<string, unknown> = {};
  if (q.interviewId) f.interviewId = q.interviewId;
  if (q.channel) f.channel = q.channel;
  if (q.status) f.status = q.status;
  const pageSize = Math.min(100, Math.max(10, q.pageSize ?? 50));
  const page = Math.max(1, Math.floor(q.page ?? 1) || 1);
  try {
    const c = getDb().collection(NOTIFY);
    const [docs, total] = await Promise.all([
      c.find(f).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).toArray(),
      c.countDocuments(f),
    ]);
    return { items: docs.map(({ _id, ...rest }) => ({ ...(rest as Omit<NotificationLog, "id">), id: String(_id) })), total };
  } catch (e) {
    return { items: [], total: 0, dbError: e instanceof Error ? e.message : "Could not read the notification log." };
  }
}

export async function getNotification(id: string): Promise<NotificationLog | null> {
  if (!hasDatabaseUrl()) return null;
  const doc = await getDb().collection(NOTIFY).findOne({ _id: id as never });
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { ...(rest as Omit<NotificationLog, "id">), id: String(_id) };
}

/** The recommendation HR sees: their override, else the AI's. */
export const effectiveRecommendation = (i: Pick<InterviewRecord, "hr" | "evaluation">): Recommendation | null =>
  i.hr.recommendationOverride ?? i.evaluation.result?.recommendation ?? null;
