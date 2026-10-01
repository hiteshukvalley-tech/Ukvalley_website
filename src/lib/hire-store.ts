import { unstable_cache } from "next/cache";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { hireRoles as builtInRoles, type HireRole } from "@/lib/hire-data";
import type { HireInput, HireRecord } from "@/lib/hire-validation";

export const HIRE_TAG = "hire-roles";
const COLLECTION = "hireRoles";

/** Mongo document: the slug is the _id, so it is unique and never changes. */
type HireDoc = Omit<HireRecord, "slug"> & { _id: string; updatedAt?: Date };

const col = () => getDb().collection<HireDoc>(COLLECTION);

function toRecord({ _id, updatedAt, ...rest }: HireDoc): HireRecord {
  void updatedAt;
  return { ...rest, slug: _id };
}

/** Strips the admin-only fields, leaving what the public pages use. */
function toPublic({ published, order, ...role }: HireRecord): HireRole {
  void published;
  void order;
  return role;
}

/** The built-in roles, in the record shape the admin works with. */
export const builtInRecords: HireRecord[] = builtInRoles.map((r, order) => ({
  ...r,
  published: true,
  order,
}));

async function readPublished(): Promise<HireRole[]> {
  const docs = await col().find({ published: true }).sort({ order: 1 }).toArray();
  return docs.map((d) => toPublic(toRecord(d)));
}

// Throws on DB errors so a failure is never cached; callers fall back.
const cachedPublished = unstable_cache(readPublished, ["hire-published-v1"], {
  tags: [HIRE_TAG],
  revalidate: 3600,
});

const cachedHasAny = unstable_cache(
  async () => (await col().estimatedDocumentCount()) > 0,
  ["hire-has-any-v1"],
  { tags: [HIRE_TAG], revalidate: 3600 }
);

/**
 * Hire roles for the public site, in the order set in the admin. Uses the
 * built-in list until the admin has imported/created some, and whenever the
 * database can't be read.
 */
export async function getHireRoles(): Promise<HireRole[]> {
  if (!hasDatabaseUrl()) return builtInRoles;
  try {
    if (!(await cachedHasAny())) return builtInRoles;
    // The public pages need at least one, so all-draft shows the defaults.
    const published = await cachedPublished();
    return published.length ? published : builtInRoles;
  } catch {
    return builtInRoles;
  }
}

/** Uncached list for the admin (drafts included), in display order. */
export async function listHireForAdmin(): Promise<{ items: HireRecord[]; dbError?: string }> {
  if (!hasDatabaseUrl()) return { items: [], dbError: "MONGODB_URI is not set." };
  try {
    const docs = await col().find({}).sort({ order: 1, _id: 1 }).toArray();
    return { items: docs.map(toRecord) };
  } catch (e) {
    return { items: [], dbError: e instanceof Error ? e.message : "Could not read hire roles." };
  }
}

export async function getHireForAdmin(slug: string): Promise<HireRecord | null> {
  if (!hasDatabaseUrl()) return null;
  try {
    const doc = await col().findOne({ _id: slug });
    return doc ? toRecord(doc) : null;
  } catch {
    return null;
  }
}

/** Copies the built-in roles into the database. Only when it is empty. */
export async function importBuiltInHire(): Promise<number> {
  if ((await col().estimatedDocumentCount()) > 0) return 0;
  const now = new Date();
  await col().insertMany(builtInRecords.map(({ slug, ...rest }) => ({ _id: slug, ...rest, updatedAt: now })));
  return builtInRecords.length;
}

/** Returns false when the slug is already taken. New roles go to the end. */
export async function createHire(value: HireInput): Promise<boolean> {
  const { slug, ...rest } = value;
  const last = await col().find({}, { projection: { order: 1 } }).sort({ order: -1 }).limit(1).toArray();
  const order = (last[0]?.order ?? -1) + 1;
  try {
    await col().insertOne({ _id: slug, ...rest, order, updatedAt: new Date() });
    return true;
  } catch (e) {
    if ((e as { code?: number }).code === 11000) return false;
    throw e;
  }
}

/**
 * Returns false when the role no longer exists. The optional `noun` is removed
 * when the form leaves it empty.
 */
export async function updateHire(value: HireInput): Promise<boolean> {
  const { slug, noun, ...rest } = value;
  const res = await col().updateOne(
    { _id: slug },
    noun
      ? { $set: { ...rest, noun, updatedAt: new Date() } }
      : { $set: { ...rest, updatedAt: new Date() }, $unset: { noun: "" } }
  );
  return res.matchedCount > 0;
}

export async function setHirePublished(slug: string, published: boolean) {
  await col().updateOne({ _id: slug }, { $set: { published, updatedAt: new Date() } });
}

export async function deleteHire(slug: string) {
  await col().deleteOne({ _id: slug });
}

/**
 * Saves a drag-and-drop order. `slugs` must be exactly the current set of
 * roles in their new order; anything else is rejected so a stale page can't
 * scramble the list. Returns false when the list is out of date.
 */
export async function reorderHire(slugs: string[]): Promise<boolean> {
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
