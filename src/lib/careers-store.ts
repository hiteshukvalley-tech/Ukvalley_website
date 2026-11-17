import { randomUUID } from "node:crypto";
import { unstable_cache } from "next/cache";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { careers as builtInCareers, type Career } from "@/lib/site-data";
import type { CareerInput, CareerRecord } from "@/lib/careers-validation";
import { DEFAULT_HIRING_PROCESS, inferJobMode, isIsoDate, isJobMode, toJobType } from "@/lib/careers-shared";

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
 * were added lack those fields; fill them so every page can rely on them. Roles
 * saved when Type was free text get the closest job type.
 */
function toRecord({ _id, updatedAt, ...rest }: CareerDoc): CareerRecord {
  const doc = rest as Partial<CareerDoc>;
  const dateFallback = updatedAt instanceof Date ? updatedAt.toISOString().slice(0, 10) : "2026-01-01";
  const max = doc.experienceMax;
  return {
    ...rest,
    slug: _id,
    type: toJobType(doc.type),
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

/**
 * Whether the admin manages the roles: any role saved (published or draft) or
 * in the recycle bin. Deleting every role then shows "no open roles" instead of
 * bringing the built-in ones back (and reopening applications for them).
 */
async function rolesManaged(): Promise<boolean> {
  if ((await col().estimatedDocumentCount()) > 0) return true;
  return (await getDb().collection(RECYCLE).estimatedDocumentCount()) > 0;
}

const cachedHasAny = unstable_cache(
  rolesManaged,
  ["careers-has-any-v2"],
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

export type OpenCareerCheck =
  | { status: "open"; career: Career }
  | { status: "closed"; slug?: string }
  | { status: "unavailable" };

/**
 * Whether `position` (a role title, matched ignoring case and extra spaces) is
 * open right now. Uncached and read straight from the database, so a role moved
 * to drafts stops taking applications at once, even from a page (or shared
 * link) that was opened while it was still published. Never falls back to the
 * built-in list on a database error: an outage must not reopen closed roles.
 */
export async function findOpenCareer(position: string): Promise<OpenCareerCheck> {
  const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
  const wanted = norm(String(position ?? ""));
  if (!wanted) return { status: "closed" };
  if (!hasDatabaseUrl()) {
    // Local development without a database: the built-in roles are what the site shows.
    const c = builtInCareers.find((x) => norm(x.role) === wanted);
    return c ? { status: "open", career: c } : { status: "closed" };
  }
  try {
    if (!(await rolesManaged())) {
      // Roles never imported: the site still shows the built-in list.
      const c = builtInCareers.find((x) => norm(x.role) === wanted);
      return c ? { status: "open", career: c } : { status: "closed" };
    }
    const docs = await col().find({}, { projection: { role: 1, published: 1 } }).toArray();
    const match = docs.filter((d) => norm(String(d.role ?? "")) === wanted);
    const open = match.find((d) => d.published);
    if (!open) return { status: "closed", slug: match[0]?._id };
    const full = await col().findOne({ _id: open._id, published: true });
    return full ? { status: "open", career: toPublic(toRecord(full)) } : { status: "closed", slug: open._id };
  } catch {
    return { status: "unavailable" };
  }
}

/**
 * Whether `slug` is, or once was, a role's address: a built-in role, a role in
 * the admin (published or draft), one in the recycle bin, or one somebody
 * applied to. Only those get the "this opening is closed" notice; any other
 * address under /careers is a plain 404. True when the database can't be read,
 * so links shared for a real role keep working during an outage.
 */
export async function isKnownCareerSlug(slug: string): Promise<boolean> {
  if (builtInCareers.some((c) => c.slug === slug)) return true;
  if (!hasDatabaseUrl()) return false;
  try {
    const db = getDb();
    const [saved, recycled, applied] = await Promise.all([
      col().countDocuments({ _id: slug }, { limit: 1 }),
      db.collection(RECYCLE).countDocuments({ "role._id": slug }, { limit: 1 }),
      db.collection("applications").countDocuments({ careerSlug: slug }, { limit: 1 }),
    ]);
    return saved + recycled + applied > 0;
  } catch {
    return true;
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

/**
 * Every job opening for the admin's application counts: open (published)
 * and past (unpublished), in the Careers order. Until roles are managed in
 * the database, or when it can't be read, the open roles the site shows.
 */
export async function listCareerRolesForAdmin(): Promise<{ role: string; published: boolean }[]> {
  const { items, dbError } = await listCareersForAdmin();
  if (dbError || items.length === 0) return (await getCareers()).map((c) => ({ role: c.role, published: true }));
  return items.map((c) => ({ role: c.role, published: c.published }));
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
  const { slug, experienceMax, qualifications, ...rest } = value;
  // Optional fields left empty are removed, so an old value doesn't linger.
  const set: Record<string, unknown> = { ...rest, updatedAt: new Date() };
  const unset: Record<string, ""> = {};
  if (experienceMax === undefined) unset.experienceMax = "";
  else set.experienceMax = experienceMax;
  if (qualifications?.length) set.qualifications = qualifications;
  else unset.qualifications = "";
  const res = await col().updateOne({ _id: slug }, Object.keys(unset).length ? { $set: set, $unset: unset } : { $set: set });
  return res.matchedCount > 0;
}

export async function setCareerPublished(slug: string, published: boolean) {
  await col().updateOne({ _id: slug }, { $set: { published, updatedAt: new Date() } });
}

// Deleted roles go to "Recycle openings" (their own collection) instead of
// being erased, so they can be restored. Applications are never touched.
const RECYCLE = "careersRecycle";
type RecycledDoc = { _id: string; role: CareerDoc; deletedAt: Date; deletedBy: string };
const recycle = () => getDb().collection<RecycledDoc>(RECYCLE);

/** A deleted role as Recycle openings lists it. */
export type RecycledCareer = {
  /** id of the recycle entry (the same role can be deleted more than once) */
  id: string;
  slug: string;
  role: string;
  location: string;
  type: string;
  mode: string;
  published: boolean;
  deletedAt: Date;
  deletedBy: string;
};

/** Moves a role to Recycle openings. Returns false when it no longer exists. */
export async function deleteCareer(slug: string, deletedBy = ""): Promise<boolean> {
  const doc = await col().findOne({ _id: slug });
  if (!doc) return false;
  // Saved to the recycle bin first, so a failure never loses the role.
  await recycle().insertOne({ _id: randomUUID(), role: doc, deletedAt: new Date(), deletedBy });
  await col().deleteOne({ _id: slug });
  return true;
}

/** Every deleted role, most recently deleted first. */
export async function listRecycledCareers(): Promise<{ items: RecycledCareer[]; dbError?: string }> {
  if (!hasDatabaseUrl()) return { items: [], dbError: "MONGODB_URI is not set." };
  try {
    const docs = await recycle().find({}).sort({ deletedAt: -1 }).limit(500).toArray();
    return {
      items: docs.map((d) => {
        const c = toRecord(d.role);
        return {
          id: d._id, slug: c.slug, role: c.role, location: c.location, type: c.type, mode: c.mode,
          published: c.published, deletedAt: d.deletedAt, deletedBy: d.deletedBy,
        };
      }),
    };
  } catch (e) {
    return { items: [], dbError: e instanceof Error ? e.message : "Could not read deleted roles." };
  }
}

/**
 * Puts a deleted role back in Careers, at the end of the list and as it was
 * (published or draft). If its web address was taken since, it gets -2, -3 ….
 * Returns the role's slug, or null when the recycle entry no longer exists.
 */
export async function restoreCareer(id: string): Promise<string | null> {
  const entry = await recycle().findOne({ _id: id });
  if (!entry) return null;
  const { _id: slug, ...rest } = entry.role;
  const last = await col().find({}, { projection: { order: 1 } }).sort({ order: -1 }).limit(1).toArray();
  const order = (last[0]?.order ?? -1) + 1;
  for (let i = 1; i <= 20; i++) {
    const next = i === 1 ? slug : `${slug}-${i}`;
    try {
      await col().insertOne({ ...rest, _id: next, order, updatedAt: new Date() });
      await recycle().deleteOne({ _id: id });
      return next;
    } catch (e) {
      if ((e as { code?: number }).code !== 11000) throw e;
    }
  }
  throw new Error("Its web address is taken. Rename the role using it and try again.");
}

/** Erases a deleted role for good. */
export async function purgeRecycledCareer(id: string) {
  await recycle().deleteOne({ _id: id });
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
