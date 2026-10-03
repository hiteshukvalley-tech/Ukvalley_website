import { unstable_cache } from "next/cache";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { careers as builtInCareers, type Career } from "@/lib/site-data";
import type { CareerInput, CareerRecord } from "@/lib/careers-validation";
import { DEFAULT_HIRING_PROCESS, inferJobMode, isIsoDate, isJobMode } from "@/lib/careers-shared";

export const CAREERS_TAG = "careers";
const COLLECTION = "careers";

/** Mongo document: the slug is the _id, so it is unique and never changes. */
type CareerDoc = Omit<CareerRecord, "slug"> & { _id: string; updatedAt?: Date };

const col = () => getDb().collection<CareerDoc>(COLLECTION);

/** First "N+ years" / "N years" in the requirements, for roles saved before experience existed. */
function inferExperienceMin(requirements: string[] = []): number {
  for (const r of requirements) {
    const m = r.match(/(\d{1,2})\s*\+?\s*(?:years|yrs)/i);
    if (m) return Number(m[1]);
  }
  return 0;
}

/**
 * Roles saved before job mode, experience, published date and hiring process
 * were added lack those fields; fill them so every page can rely on them.
 */
function toRecord({ _id, updatedAt, ...rest }: CareerDoc): CareerRecord {
  const doc = rest as Partial<CareerDoc>;
  const dateFallback = updatedAt instanceof Date ? updatedAt.toISOString().slice(0, 10) : "2026-01-01";
  const max = doc.experienceMax;
  return {
    ...rest,
    slug: _id,
    mode: isJobMode(doc.mode) ? doc.mode : inferJobMode(rest.location ?? ""),
    experienceMin: typeof doc.experienceMin === "number" ? doc.experienceMin : inferExperienceMin(rest.requirements),
    experienceMax: typeof max === "number" ? max : undefined,
    postedAt: typeof doc.postedAt === "string" && isIsoDate(doc.postedAt) ? doc.postedAt : dateFallback,
    hiringProcess: Array.isArray(doc.hiringProcess) && doc.hiringProcess.length ? doc.hiringProcess : DEFAULT_HIRING_PROCESS,
  };
}

/** Strips the admin-only fields, leaving what the public pages use. */
function toPublic({ published, order, experienceMax, ...career }: CareerRecord): Career {
  void published;
  void order;
  // Leave "no maximum" out entirely rather than as undefined, so the role
  // survives the cache's JSON round trip unchanged.
  return experienceMax === undefined ? career : { ...career, experienceMax };
}

/** The built-in careers, in the record shape the admin works with. */
export const builtInRecords: CareerRecord[] = builtInCareers.map((c, order) => ({
  ...c,
  published: true,
  order,
}));

async function readPublished(): Promise<Career[]> {
  const docs = await col().find({ published: true }).sort({ order: 1 }).toArray();
  return docs.map((d) => toPublic(toRecord(d)));
}

// Throws on DB errors so a failure is never cached; callers fall back.
// v2: roles gained mode, experience, published date and hiring process.
const cachedPublished = unstable_cache(readPublished, ["careers-published-v2"], {
  tags: [CAREERS_TAG],
  revalidate: 60,
});

const cachedHasAny = unstable_cache(
  async () => (await col().estimatedDocumentCount()) > 0,
  ["careers-has-any-v1"],
  { tags: [CAREERS_TAG], revalidate: 60 }
);

/**
 * Open roles for the public site, in the order set in the admin. Uses the
 * built-in list until the admin has imported/created some, and whenever the
 * database can't be read. Once the admin manages roles, unpublishing all of
 * them correctly shows "no open roles" rather than the defaults.
 */
export async function getCareers(): Promise<Career[]> {
  if (!hasDatabaseUrl()) return builtInCareers;
  try {
    if (!(await cachedHasAny())) return builtInCareers;
    return await cachedPublished();
  } catch {
    return builtInCareers;
  }
}

/** Uncached list for the admin (drafts included), in display order. */
export async function listCareersForAdmin(): Promise<{ items: CareerRecord[]; dbError?: string }> {
  if (!hasDatabaseUrl()) return { items: [], dbError: "MONGODB_URI is not set." };
  try {
    const docs = await col().find({}).sort({ order: 1, _id: 1 }).toArray();
    return { items: docs.map(toRecord) };
  } catch (e) {
    return { items: [], dbError: e instanceof Error ? e.message : "Could not read careers." };
  }
}

export async function getCareerForAdmin(slug: string): Promise<CareerRecord | null> {
  if (!hasDatabaseUrl()) return null;
  try {
    const doc = await col().findOne({ _id: slug });
    return doc ? toRecord(doc) : null;
  } catch {
    return null;
  }
}

/** Copies the built-in careers into the database. Only when it is empty. */
export async function importBuiltInCareers(): Promise<number> {
  if ((await col().estimatedDocumentCount()) > 0) return 0;
  const now = new Date();
  await col().insertMany(builtInRecords.map(({ slug, ...rest }) => ({ _id: slug, ...rest, updatedAt: now })));
  return builtInRecords.length;
}

/**
 * Returns false when the slug is already taken. New roles go to the end.
 * With `autoSuffix` (the slug was made from the role name) a taken slug gets
 * -2, -3 … instead of failing.
 */
export async function createCareer(value: CareerInput, { autoSuffix = false } = {}): Promise<boolean> {
  const { slug: base, ...rest } = value;
  const last = await col().find({}, { projection: { order: 1 } }).sort({ order: -1 }).limit(1).toArray();
  const order = (last[0]?.order ?? -1) + 1;
  for (let i = 1; i <= (autoSuffix ? 20 : 1); i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    try {
      await col().insertOne({ _id: slug, ...rest, order, updatedAt: new Date() });
      return true;
    } catch (e) {
      if ((e as { code?: number }).code !== 11000) throw e;
    }
  }
  return false;
}

/** Returns false when the role no longer exists. */
export async function updateCareer(value: CareerInput): Promise<boolean> {
  const { slug, experienceMax, ...rest } = value;
  const res = await col().updateOne(
    { _id: slug },
    experienceMax === undefined
      ? { $set: { ...rest, updatedAt: new Date() }, $unset: { experienceMax: "" } }
      : { $set: { ...rest, experienceMax, updatedAt: new Date() } }
  );
  return res.matchedCount > 0;
}

export async function setCareerPublished(slug: string, published: boolean) {
  await col().updateOne({ _id: slug }, { $set: { published, updatedAt: new Date() } });
}

export async function deleteCareer(slug: string) {
  await col().deleteOne({ _id: slug });
}

/**
 * Saves a drag-and-drop order. `slugs` must be exactly the current set of
 * roles in their new order; anything else is rejected so a stale page can't
 * scramble the list. Returns false when the list is out of date.
 */
export async function reorderCareers(slugs: string[]): Promise<boolean> {
  const docs = await col().find({}, { projection: { _id: 1 } }).toArray();
  const existing = new Set(docs.map((d) => d._id));
  if (
    slugs.length !== existing.size ||
    new Set(slugs).size !== slugs.length ||
    !slugs.every((id) => existing.has(id))
  ) {
    return false;
  }
  await col().bulkWrite(
    slugs.map((id, order) => ({ updateOne: { filter: { _id: id }, update: { $set: { order } } } }))
  );
  return true;
}
