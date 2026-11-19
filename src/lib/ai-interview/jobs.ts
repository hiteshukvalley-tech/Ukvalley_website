import "server-only";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { ensureIntegrationKeys } from "@/lib/integration-keys";

// Background jobs for AI interviews (invitations, reminders, calendar sync,
// evaluation, closing missed interviews, deleting old recordings). Server-only.
//
// Stored in MongoDB ("aiInterviewJobs") rather than Redis/BullMQ: the site runs
// as one long-lived Node server on Render with no Redis, and a database queue
// survives restarts and deploys. A job's _id is its dedupe key (for example
// "reminder:<interview>:v2:60"), so scheduling the same reminder twice is a
// no-op. Each job is claimed with an atomic update and a lease, so a second
// instance (or an overlapping tick) can't run it twice; a crashed run is
// picked up again when its lease runs out. Failed jobs retry with back-off.

export type JobKind = "notify" | "calendar" | "plan" | "evaluate" | "close_window" | "purge_recordings";

export type Job = {
  _id: string;
  kind: JobKind;
  interviewId: string;
  payload: Record<string, unknown>;
  runAt: Date;
  state: "pending" | "running" | "done" | "failed" | "cancelled";
  attempts: number;
  maxAttempts: number;
  lockedUntil?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
};

const COLLECTION = "aiInterviewJobs";
const col = () => getDb().collection<Job>(COLLECTION);

const LEASE_MS = 5 * 60_000;
/** How often a running job renews its lease. */
const HEARTBEAT_MS = 60_000;
/** Jobs one process runs at the same time, so a slow Claude call never holds up reminders. */
const PARALLEL = 4;
const BACKOFF_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * 3600_000];
const TICK_MS = 15_000;
/** Jobs per tick, so one tick can't run for minutes. */
const BATCH = 10;

type Handler = (job: Job) => Promise<void>;
const g = globalThis as unknown as { _aiJobHandlers?: Map<JobKind, Handler>; _aiJobTimer?: NodeJS.Timeout; _aiJobsInFlight?: number; _aiJobIndexes?: Promise<void> };
const handlers = () => (g._aiJobHandlers ??= new Map());

export function registerJobHandler(kind: JobKind, fn: Handler) {
  handlers().set(kind, fn);
}

function ensureIndexes() {
  g._aiJobIndexes ??= Promise.all([
    col().createIndex({ state: 1, runAt: 1 }),
    col().createIndex({ interviewId: 1, state: 1 }),
    // Finished jobs are kept 30 days for troubleshooting, then removed by MongoDB.
    col().createIndex({ updatedAt: 1 }, { expireAfterSeconds: 30 * 86400, partialFilterExpression: { state: { $in: ["done", "cancelled"] } } }),
  ]).then(
    () => undefined,
    (e) => {
      g._aiJobIndexes = undefined;
      throw e;
    }
  );
  return g._aiJobIndexes;
}

/**
 * Adds a job unless one with the same key exists. A key that was cancelled
 * (e.g. a reminder for an old time) is not revived: reschedules use a new key.
 */
export async function enqueue(key: string, kind: JobKind, interviewId: string, runAt: Date, payload: Record<string, unknown> = {}, maxAttempts = 4) {
  if (!hasDatabaseUrl()) return;
  await ensureIndexes();
  const now = new Date();
  await col().updateOne(
    { _id: key },
    { $setOnInsert: { kind, interviewId, payload, runAt, state: "pending", attempts: 0, maxAttempts, createdAt: now, updatedAt: now } },
    { upsert: true }
  );
}

/** Runs a job again now (HR "retry"), whatever its state. */
export async function requeue(key: string) {
  await col().updateOne({ _id: key }, { $set: { state: "pending", runAt: new Date(), attempts: 0, updatedAt: new Date() }, $unset: { lockedUntil: "", lastError: "" } });
}

/**
 * Cancels an interview's pending (and running) jobs whose key starts with one
 * of the prefixes (all when none given). A running job finishes its current
 * try, but its result can't put it back to "pending", so it never retries.
 */
export async function cancelJobs(interviewId: string, prefixes?: string[]) {
  if (!hasDatabaseUrl()) return;
  const filter: Record<string, unknown> = { interviewId, state: { $in: ["pending", "running"] } };
  if (prefixes?.length) filter.$or = prefixes.map((p) => ({ _id: { $regex: `^${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}` } }));
  await col().updateMany(filter, { $set: { state: "cancelled", updatedAt: new Date() } });
}

export async function listJobs(interviewId: string): Promise<Job[]> {
  if (!hasDatabaseUrl()) return [];
  return col().find({ interviewId }).sort({ runAt: 1 }).limit(100).toArray();
}

/** Claims the next due job (or one whose lease ran out). */
async function claim(): Promise<Job | null> {
  const now = new Date();
  return col().findOneAndUpdate(
    {
      $or: [
        { state: "pending", runAt: { $lte: now } },
        // A crashed run, while tries are left (the rest are marked failed by failExhausted).
        { state: "running", lockedUntil: { $lt: now }, $expr: { $lt: ["$attempts", "$maxAttempts"] } },
      ],
    },
    { $set: { state: "running", lockedUntil: new Date(now.getTime() + LEASE_MS), updatedAt: now }, $inc: { attempts: 1 } },
    { sort: { runAt: 1 }, returnDocument: "after" }
  );
}

async function runOne(job: Job) {
  const fn = handlers().get(job.kind);
  // Renew the lease while the job runs: a Claude call (with its retries) can
  // outlast LEASE_MS, and another worker must not claim the job meanwhile.
  const heartbeat = setInterval(() => {
    void col()
      .updateOne({ _id: job._id, state: "running" }, { $set: { lockedUntil: new Date(Date.now() + LEASE_MS) } })
      .catch(() => {});
  }, HEARTBEAT_MS);
  heartbeat.unref?.();
  // The final state is written only while the job is still ours ("running"):
  // a job cancelled meanwhile stays cancelled and is never retried.
  const mine = { _id: job._id, state: "running" as const };
  try {
    try {
      if (!fn) throw new Error(`No handler for job kind "${job.kind}"`);
      await fn(job);
      await col().updateOne(mine, { $set: { state: "done", updatedAt: new Date() }, $unset: { lockedUntil: "" } });
    } catch (e) {
      const message = (e instanceof Error ? e.message : String(e)).slice(0, 500);
      const permanent = e instanceof PermanentJobError;
      const last = permanent || job.attempts >= job.maxAttempts;
      const delay = BACKOFF_MS[Math.min(job.attempts - 1, BACKOFF_MS.length - 1)];
      await col().updateOne(mine, {
        $set: {
          state: last ? "failed" : "pending",
          lastError: message,
          updatedAt: new Date(),
          ...(last ? {} : { runAt: new Date(Date.now() + delay) }),
        },
        $unset: { lockedUntil: "" },
      });
      console.error(`[ai-interview] job ${job._id} ${last ? "failed" : "will retry"}: ${message}`);
    }
  } catch (e) {
    // The database failed while saving the job's state: its lease runs out and it is picked up again.
    console.error(`[ai-interview] job ${job._id}: could not save its state:`, e instanceof Error ? e.message : e);
  } finally {
    clearInterval(heartbeat);
  }
}

/** Jobs whose lease ran out with no tries left (the process died each time): marked failed, not retried forever. */
async function failExhausted() {
  const now = new Date();
  await col().updateMany(
    { state: "running", lockedUntil: { $lt: now }, $expr: { $gte: ["$attempts", "$maxAttempts"] } },
    { $set: { state: "failed", lastError: "Stopped responding on every try (the server restarted or ran out of memory).", updatedAt: now }, $unset: { lockedUntil: "" } }
  );
}

/** Failed jobs, newest first (Admin → AI interviews → Notifications → Failed background jobs). */
export async function listFailedJobs(limit = 50): Promise<Job[]> {
  if (!hasDatabaseUrl()) return [];
  return col().find({ state: "failed" }).sort({ updatedAt: -1 }).limit(limit).toArray();
}

export async function getJob(key: string): Promise<Job | null> {
  if (!hasDatabaseUrl()) return null;
  return col().findOne({ _id: key });
}

/** A failure retrying won't fix (bad template, missing contact details). */
export class PermanentJobError extends Error {}

/**
 * Claims due jobs and runs up to PARALLEL of them at once (counted across
 * ticks in g._aiJobsInFlight). With `wait` (the default) it returns when the
 * jobs it started have finished; the worker passes wait=false, so a slow job
 * (a long evaluation) keeps its slot while the next tick claims short jobs
 * like reminders into the free slots.
 */
export async function runDueJobs(limit = BATCH, wait = true): Promise<number> {
  if (!hasDatabaseUrl()) return 0;
  const running: Promise<void>[] = [];
  try {
    await ensureIndexes();
    await ensureIntegrationKeys();
    await failExhausted();
    while (running.length < limit && (g._aiJobsInFlight ?? 0) < PARALLEL) {
      const job = await claim();
      if (!job) break;
      g._aiJobsInFlight = (g._aiJobsInFlight ?? 0) + 1;
      running.push(
        runOne(job).finally(() => {
          g._aiJobsInFlight = Math.max(0, (g._aiJobsInFlight ?? 1) - 1);
        })
      );
    }
  } catch (e) {
    console.error("[ai-interview] job tick failed:", e instanceof Error ? e.message : e);
  }
  // runOne never rejects (it records failures on the job), so not awaiting is safe.
  if (wait) await Promise.all(running);
  return running.length;
}

/** Starts the worker loop (once per process). Called from instrumentation.ts. */
export function startJobWorker() {
  if (g._aiJobTimer || !hasDatabaseUrl()) return;
  let ticks = 0;
  let busy = false;
  const tick = async () => {
    // Ticks never overlap each other, but they don't wait for the jobs they
    // start: a long evaluation keeps running in its slot while later ticks
    // keep sending invites and reminders.
    if (busy) return;
    busy = true;
    try {
      await runDueJobs(BATCH, false);
      // Every fourth tick (about a minute; the first one at start-up): bring the
      // normalized model collections up to date (models-store.ts).
      if (ticks++ % 4 === 0) {
        const { reconcileModels } = await import("./models-store");
        await reconcileModels();
      }
    } catch (e) {
      console.error("[ai-interview] worker tick failed:", e instanceof Error ? e.message : e);
    } finally {
      busy = false;
    }
  };
  g._aiJobTimer = setInterval(() => void tick(), TICK_MS);
  g._aiJobTimer.unref?.();
}
