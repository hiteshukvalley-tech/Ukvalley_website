import "server-only";
import type { AnyBulkWriteOperation, Document } from "mongodb";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { col, getInterview, type InterviewRecord } from "./store";
import {
  MODEL_COLLECTIONS, MODEL_INDEXES, MODEL_VALIDATORS, buildModels,
  type AnswerModel, type CandidateModel, type ConfigurationModel, type EvaluationModel, type ModelKey, type QuestionModel,
  type RecordingModel, type ReviewModel, type ScheduleModel, type TranscriptModel,
} from "./models";

// Writes each interview session out to the normalized model collections
// (models.ts) and keeps them current:
//   - store.ts calls scheduleModelSync() after every change; changes that come
//     close together (recording chunks) are merged into one sync;
//   - the job worker calls reconcileModels() every minute, which re-syncs any
//     session whose models are behind (a crash, a restart, a failed write) and
//     fills in sessions created before the models existed.
// A model write never fails the interview itself: errors are logged and the
// next reconcile retries.

/** Model documents use string ids (models.ts), not ObjectIds. */
type ModelDoc = Document & { _id: string };
const coll = <T extends ModelDoc = ModelDoc>(k: ModelKey) => getDb().collection<T>(MODEL_COLLECTIONS[k]);

// --- collections, validators, indexes ------------------------------------------------------------

const g = globalThis as typeof globalThis & {
  _aiModelsReady?: Promise<void> | null;
  _aiModelsReadyAt?: number;
  _aiModelSyncTimers?: Map<string, ReturnType<typeof setTimeout>>;
};

/** Re-checked this often, so a collection dropped or restored from a backup gets its validator back. */
const ENSURE_TTL_MS = 30 * 60_000;

/** Creates the model collections with their validators and indexes (cheap no-ops when they exist). */
export function ensureModelCollections(): Promise<void> {
  if (g._aiModelsReady && Date.now() - (g._aiModelsReadyAt ?? 0) > ENSURE_TTL_MS) g._aiModelsReady = null;
  if (!g._aiModelsReady) g._aiModelsReadyAt = Date.now();
  g._aiModelsReady ??= (async () => {
    const db = getDb();
    const existing = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name));
    for (const key of Object.keys(MODEL_COLLECTIONS) as ModelKey[]) {
      const name = MODEL_COLLECTIONS[key];
      const validator = MODEL_VALIDATORS[key];
      // "moderate": documents written before a validator change are not re-checked until they are updated.
      if (!existing.has(name)) {
        await db.createCollection(name, { validator, validationLevel: "moderate", validationAction: "error" }).catch((e) => {
          if ((e as { codeName?: string }).codeName !== "NamespaceExists") throw e;
        });
      } else {
        await db.command({ collMod: name, validator, validationLevel: "moderate", validationAction: "error" }).catch((e) => {
          // A database user without collMod rights still gets working collections, just without the newest validator.
          console.warn(`[ai-interview] could not update the validator on ${name}:`, e instanceof Error ? e.message : e);
        });
      }
      await Promise.all(MODEL_INDEXES[key].map((ix) => db.collection(name).createIndex(ix.key, ix.unique ? { unique: true } : {})));
    }
    await Promise.all([
      col().createIndex({ candidateId: 1 }),
      col().createIndex({ jobId: 1, createdAt: -1 }),
      col().createIndex({ modelsSyncedAt: 1 }),
    ]);
  })().catch((e) => {
    g._aiModelsReady = null;
    throw e;
  });
  return g._aiModelsReady;
}

// --- sync --------------------------------------------------------------------------------------------

const DUPLICATE_KEY = 11000;

/** Upserts that only replace a document built from an older (or the same) session version. */
function guardedUpserts<T extends { _id: string; sourceUpdatedAt: Date }>(docs: T[]): AnyBulkWriteOperation<ModelDoc>[] {
  return docs.map((d) => ({
    replaceOne: {
      filter: { _id: d._id, $or: [{ sourceUpdatedAt: { $lte: d.sourceUpdatedAt } }, { sourceUpdatedAt: { $exists: false } }] },
      replacement: { ...d, syncedAt: new Date() },
      upsert: true,
    },
  }));
}

/**
 * A newer version already stored makes the guarded filter miss, so the upsert
 * tries to insert the same _id and gets a duplicate-key error: that's the
 * "skip, a newer write won" case, not a failure.
 */
async function bulk(k: ModelKey, ops: AnyBulkWriteOperation<ModelDoc>[]) {
  if (!ops.length) return;
  try {
    await coll(k).bulkWrite(ops, { ordered: false });
  } catch (e) {
    const errs = (e as { writeErrors?: { code: number }[] | { code: number } }).writeErrors;
    const list = Array.isArray(errs) ? errs : errs ? [errs] : null;
    if (!list || list.some((w) => w.code !== DUPLICATE_KEY)) throw e;
  }
}

/** Writes every model document for one session. Returns false when the session no longer exists. */
export async function syncInterviewModels(idOrRecord: string | InterviewRecord): Promise<boolean> {
  if (!hasDatabaseUrl()) return false;
  await ensureModelCollections();
  // Always build from what is stored now, so a late sync never writes stale data.
  const i = typeof idOrRecord === "string" ? await getInterview(idOrRecord) : await getInterview(idOrRecord.id);
  if (!i) return false;
  const m = buildModels(i);
  const ts = i.updatedAt;
  const now = new Date();
  const { _id: candidateId, ...candidate } = m.candidate;

  await Promise.all([
    coll<CandidateModel>("candidates").updateOne(
      { _id: candidateId },
      {
        $set: { ...candidate, updatedAt: now },
        $addToSet: { applicationIds: i.applicationId, interviewIds: i.id },
        $max: { lastAppliedAt: i.createdAt },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    ),
    coll<ConfigurationModel>("configurations").updateOne(
      { _id: m.configuration._id },
      { $setOnInsert: { ...m.configuration, createdAt: now, firstInterviewId: i.id } },
      { upsert: true }
    ),
    bulk("schedules", guardedUpserts<ScheduleModel>([m.schedule])),
    bulk("questions", guardedUpserts<QuestionModel>(m.questions)),
    bulk("answers", guardedUpserts<AnswerModel>(m.answers)),
    bulk("transcripts", guardedUpserts<TranscriptModel>([m.transcript])),
    bulk("recordings", guardedUpserts<RecordingModel>([m.recording])),
    bulk("evaluations", guardedUpserts<EvaluationModel>([m.evaluation])),
    bulk("reviews", guardedUpserts<ReviewModel>([m.review])),
  ]);
  // Questions or answers the session no longer has (a regenerated plan).
  await Promise.all([
    coll("questions").deleteMany({ interviewId: i.id, _id: { $nin: m.questions.map((q) => q._id) }, sourceUpdatedAt: { $lte: ts } }),
    coll("answers").deleteMany({ interviewId: i.id, _id: { $nin: m.answers.map((a) => a._id) }, sourceUpdatedAt: { $lte: ts } }),
  ]);
  // Link the session to its models. Leaves updatedAt alone, so this is not a change that needs syncing.
  await col().updateOne(
    { _id: i.id },
    { $set: { candidateId: m.links.candidateId, jobId: m.links.jobId, configId: m.links.configId }, $max: { modelsSyncedAt: ts } }
  );
  return true;
}

const SYNC_DELAY_MS = 750;

/** Syncs a session's models shortly (changes within the delay are merged). Never throws. */
export function scheduleModelSync(id: string) {
  if (!hasDatabaseUrl()) return;
  const timers = (g._aiModelSyncTimers ??= new Map());
  if (timers.has(id)) return;
  const t = setTimeout(() => {
    timers.delete(id);
    syncInterviewModels(id).catch((e) => console.error(`[ai-interview] model sync for ${id} failed (the next reconcile retries):`, e instanceof Error ? e.message : e));
  }, SYNC_DELAY_MS);
  t.unref?.();
  timers.set(id, t);
}

/** Re-syncs sessions whose models are behind. Returns how many it synced. */
export async function reconcileModels(limit = 50): Promise<number> {
  if (!hasDatabaseUrl()) return 0;
  await ensureModelCollections();
  const behind = await col()
    .find(
      { $or: [{ modelsSyncedAt: { $exists: false } }, { $expr: { $lt: ["$modelsSyncedAt", "$updatedAt"] } }] } as never,
      { projection: { _id: 1 } }
    )
    .sort({ updatedAt: 1 })
    .limit(limit)
    .toArray();
  let n = 0;
  for (const d of behind) {
    try {
      if (await syncInterviewModels(String(d._id))) n++;
    } catch (e) {
      console.error(`[ai-interview] model reconcile for ${d._id} failed:`, e instanceof Error ? e.message : e);
    }
  }
  return n;
}

// --- reads (REST API, reports) ----------------------------------------------------------------------

export type InterviewModelBundle = {
  schedule: ScheduleModel | null;
  questions: QuestionModel[];
  answers: AnswerModel[];
  transcript: TranscriptModel | null;
  recording: RecordingModel | null;
  evaluation: EvaluationModel | null;
  review: ReviewModel | null;
  candidate: CandidateModel | null;
  configuration: ConfigurationModel | null;
};

/** Every model document of one interview, synced first so it is current. */
export async function readInterviewModels(id: string, opts: { withIntent?: boolean } = {}): Promise<InterviewModelBundle | null> {
  const ok = await syncInterviewModels(id);
  if (!ok) return null;
  const by = { interviewId: id };
  const [schedule, questions, answers, transcript, recording, evaluation, review] = await Promise.all([
    coll<ScheduleModel>("schedules").findOne({ _id: id }),
    coll<QuestionModel>("questions").find(by, { projection: opts.withIntent ? {} : { intent: 0 } }).sort({ order: 1 }).toArray(),
    coll<AnswerModel>("answers").find(by).toArray(),
    coll<TranscriptModel>("transcripts").findOne({ _id: id }),
    coll<RecordingModel>("recordings").findOne({ _id: id }),
    coll<EvaluationModel>("evaluations").findOne({ _id: id }),
    coll<ReviewModel>("reviews").findOne({ _id: id }),
  ]);
  const [candidate, configuration] = await Promise.all([
    schedule ? coll<CandidateModel>("candidates").findOne({ _id: schedule.candidateId }) : null,
    schedule ? coll<ConfigurationModel>("configurations").findOne({ _id: schedule.configId }) : null,
  ]);
  return { schedule, questions, answers, transcript, recording, evaluation, review, candidate, configuration };
}

/** How many documents each model collection holds (settings page, health checks). */
export async function modelCounts(): Promise<Record<ModelKey, number> | null> {
  if (!hasDatabaseUrl()) return null;
  try {
    const keys = Object.keys(MODEL_COLLECTIONS) as ModelKey[];
    const counts = await Promise.all(keys.map((k) => coll(k).estimatedDocumentCount()));
    return Object.fromEntries(keys.map((k, n) => [k, counts[n]])) as Record<ModelKey, number>;
  } catch {
    return null;
  }
}
