import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { GridFSBucket, ObjectId } from "mongodb";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import {
  APPLICATION_STATUSES, isApplicationStatus,
  type ApplicationInput, type ApplicationStatus,
} from "@/lib/applications-validation";

// Job applications from the Careers page. Resumes live in their own GridFS
// bucket ("resumes"), which — unlike the public media library — is only
// served to signed-in admins (/admin/applications/<id>/resume).

const COLLECTION = "applications";
const BUCKET = "resumes";

export type Application = ApplicationInput & {
  id: string;
  /** slug of the open role it matched when submitted, if any */
  careerSlug: string | null;
  resume: { fileId: string; name: string; size: number };
  status: ApplicationStatus;
  /** internal note, never shown to the applicant */
  note: string;
  /** whether the HR notification / applicant thank-you emails went out */
  emails?: { hr?: boolean; applicant?: boolean };
  createdAt: Date;
  updatedAt?: Date;
};

type ApplicationDoc = Omit<Application, "id"> & { _id: string };

const col = () => getDb().collection<ApplicationDoc>(COLLECTION);
const bucket = () => new GridFSBucket(getDb(), { bucketName: BUCKET });

const toApplication = ({ _id, ...rest }: ApplicationDoc): Application => ({ ...rest, id: _id });

const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT = 3;
const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Strips any path and control characters from an uploaded file name. */
function cleanName(raw: string): string {
  const base = raw.split(/[\\/]/).pop() ?? "";
  const name = base.replace(/[\u0000-\u001f\u007f"]/g, "").trim().slice(0, 120);
  return /\.pdf$/i.test(name) ? name : "resume.pdf";
}

/** Whether this email may apply now: not the same role twice in a day, and at most 3 an hour. */
export async function checkApplicationLimits(email: string, position: string): Promise<"ok" | "duplicate" | "limited"> {
  const now = Date.now();
  const recent = await col()
    .find({ email, createdAt: { $gte: new Date(now - DUPLICATE_WINDOW_MS) } })
    .project<{ position: string; createdAt: Date }>({ position: 1, createdAt: 1 })
    .toArray();
  if (recent.some((r) => r.position.toLowerCase() === position.toLowerCase())) return "duplicate";
  if (recent.filter((r) => now - r.createdAt.getTime() < RATE_WINDOW_MS).length >= RATE_LIMIT) return "limited";
  return "ok";
}

/** Saves the resume and the application. Returns the new application. */
export async function createApplication(
  input: ApplicationInput & { careerSlug: string | null },
  resume: { bytes: Uint8Array; name: string }
): Promise<Application> {
  const name = cleanName(resume.name);
  const upload = bucket().openUploadStream(name, { metadata: { contentType: "application/pdf" } });
  await new Promise<void>((resolve, reject) => {
    upload.once("finish", () => resolve());
    upload.once("error", reject);
    upload.end(Buffer.from(resume.bytes));
  });

  const doc: ApplicationDoc = {
    _id: randomUUID(),
    ...input,
    resume: { fileId: upload.id.toHexString(), name, size: resume.bytes.length },
    status: "new",
    note: "",
    createdAt: new Date(),
  };
  try {
    await col().insertOne(doc);
  } catch (e) {
    await bucket().delete(upload.id).catch(() => {});
    throw e;
  }
  return toApplication(doc);
}

export async function markEmailsSent(id: string, sent: { hr: boolean; applicant: boolean }) {
  await col().updateOne({ _id: id }, { $set: { emails: sent } });
}

export type ApplicationCounts = Record<ApplicationStatus | "all", number>;
export type RoleSummary = { position: string; total: number; new: number; latest: Date };

const emptyCounts = (): ApplicationCounts =>
  Object.fromEntries([["all", 0], ...APPLICATION_STATUSES.map((s) => [s, 0])]) as ApplicationCounts;

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export type ApplicationQuery = { status?: string; position?: string; q?: string; page?: number; pageSize?: number };

/**
 * Admin list, newest first, filtered by status, position and search text.
 * Also returns status counts (for the chosen position) and per-role totals.
 */
export async function listApplications(query: ApplicationQuery = {}): Promise<{
  items: Application[];
  total: number;
  counts: ApplicationCounts;
  roles: RoleSummary[];
  dbError?: string;
}> {
  if (!hasDatabaseUrl()) return { items: [], total: 0, counts: emptyCounts(), roles: [], dbError: "MONGODB_URI is not set." };

  const pageSize = query.pageSize ?? 25;
  const page = Math.max(1, query.page ?? 1);
  const base: Record<string, unknown> = {};
  const position = query.position?.trim();
  if (position) base.position = { $regex: `^${escapeRegex(position.slice(0, 100))}$`, $options: "i" };
  const filter: Record<string, unknown> = { ...base };
  if (isApplicationStatus(query.status)) filter.status = query.status;
  const needle = query.q?.trim();
  if (needle) {
    const rx = { $regex: escapeRegex(needle.slice(0, 100)), $options: "i" };
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }, { location: rx }, { position: rx }];
  }

  try {
    const [docs, total, byStatus, byRole] = await Promise.all([
      col().find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).toArray(),
      col().countDocuments(filter),
      col().aggregate<{ _id: string; n: number }>([{ $match: base }, { $group: { _id: "$status", n: { $sum: 1 } } }]).toArray(),
      col()
        .aggregate<{ _id: string; total: number; new: number; latest: Date }>([
          // Group case-insensitively, keeping the most recent spelling for display.
          { $sort: { createdAt: -1 } },
          {
            $group: {
              _id: { $toLower: "$position" },
              position: { $first: "$position" },
              total: { $sum: 1 },
              new: { $sum: { $cond: [{ $eq: ["$status", "new"] }, 1, 0] } },
              latest: { $first: "$createdAt" },
            },
          },
          { $sort: { total: -1, position: 1 } },
          { $project: { _id: "$position", total: 1, new: 1, latest: 1 } },
        ])
        .toArray(),
    ]);
    const counts = emptyCounts();
    for (const g of byStatus) {
      if (isApplicationStatus(g._id)) counts[g._id] = g.n;
      counts.all += g.n;
    }
    return {
      items: docs.map(toApplication),
      total,
      counts,
      roles: byRole.map((r) => ({ position: r._id, total: r.total, new: r.new, latest: r.latest })),
    };
  } catch (e) {
    return { items: [], total: 0, counts: emptyCounts(), roles: [], dbError: e instanceof Error ? e.message : "Could not read applications." };
  }
}

export async function getApplication(id: string): Promise<Application | null> {
  if (!hasDatabaseUrl()) return null;
  try {
    const doc = await col().findOne({ _id: id });
    return doc ? toApplication(doc) : null;
  } catch {
    return null;
  }
}

/** Number of applications still marked "new", or null when it can't be read. */
export async function countNewApplications(): Promise<number | null> {
  if (!hasDatabaseUrl()) return null;
  try {
    return await col().countDocuments({ status: "new" });
  } catch {
    return null;
  }
}

/** Returns false when the application no longer exists. */
export async function updateApplication(id: string, patch: { status: ApplicationStatus; note: string }): Promise<boolean> {
  const res = await col().updateOne({ _id: id }, { $set: { ...patch, updatedAt: new Date() } });
  return res.matchedCount > 0;
}

/** Deletes the application and its resume. */
export async function deleteApplication(id: string) {
  const doc = await col().findOneAndDelete({ _id: id });
  if (doc && ObjectId.isValid(doc.resume.fileId)) {
    await bucket().delete(new ObjectId(doc.resume.fileId)).catch(() => {});
  }
}

/** The resume of an application as a byte stream, or null when it is missing. */
export async function openResume(id: string): Promise<{ name: string; size: number; stream: ReadableStream<Uint8Array> } | null> {
  const app = await getApplication(id);
  if (!app || !ObjectId.isValid(app.resume.fileId)) return null;
  const oid = new ObjectId(app.resume.fileId);
  const file = await getDb().collection(`${BUCKET}.files`).findOne({ _id: oid });
  if (!file) return null;
  const stream = Readable.toWeb(bucket().openDownloadStream(oid)) as unknown as ReadableStream<Uint8Array>;
  return { name: app.resume.name, size: app.resume.size, stream };
}
