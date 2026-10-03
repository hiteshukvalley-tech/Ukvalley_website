import { unstable_cache } from "next/cache";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { solutions as builtInSolutions, type Solution } from "@/lib/solutions-data";
import type { SolutionInput, SolutionRecord } from "@/lib/solutions-validation";

export const SOLUTIONS_TAG = "solutions";
const COLLECTION = "solutions";

/** Mongo document: the slug is the _id, so it is unique and never changes. */
type SolutionDoc = Omit<SolutionRecord, "slug"> & { _id: string; updatedAt?: Date };

const col = () => getDb().collection<SolutionDoc>(COLLECTION);

function toRecord({ _id, updatedAt, ...rest }: SolutionDoc): SolutionRecord {
  void updatedAt;
  return { ...rest, slug: _id };
}

/** Strips the admin-only fields, leaving what the public pages use. */
function toPublic({ published, order, ...solution }: SolutionRecord): Solution {
  void published;
  void order;
  return solution;
}

/** The built-in solutions, in the record shape the admin works with. */
export const builtInRecords: SolutionRecord[] = builtInSolutions.map((s, order) => ({
  ...s,
  published: true,
  order,
}));

async function readPublished(): Promise<Solution[]> {
  const docs = await col().find({ published: true }).sort({ order: 1 }).toArray();
  return docs.map((d) => toPublic(toRecord(d)));
}

// Throws on DB errors so a failure is never cached; callers fall back.
const cachedPublished = unstable_cache(readPublished, ["solutions-published-v1"], {
  tags: [SOLUTIONS_TAG],
  revalidate: 60,
});

const cachedHasAny = unstable_cache(
  async () => (await col().estimatedDocumentCount()) > 0,
  ["solutions-has-any-v1"],
  { tags: [SOLUTIONS_TAG], revalidate: 60 }
);

/**
 * Solutions for the public site, in the order set in the admin. Uses the
 * built-in list until the admin has imported/created some, and whenever the
 * database can't be read.
 */
export async function getSolutions(): Promise<Solution[]> {
  if (!hasDatabaseUrl()) return builtInSolutions;
  try {
    if (!(await cachedHasAny())) return builtInSolutions;
    // Drafts are never shown, even when every item is a draft.
    const published = await cachedPublished();
    return published;
  } catch {
    return builtInSolutions;
  }
}

/** Uncached list for the admin (drafts included), in display order. */
export async function listSolutionsForAdmin(): Promise<{ items: SolutionRecord[]; dbError?: string }> {
  if (!hasDatabaseUrl()) return { items: [], dbError: "MONGODB_URI is not set." };
  try {
    const docs = await col().find({}).sort({ order: 1, _id: 1 }).toArray();
    return { items: docs.map(toRecord) };
  } catch (e) {
    return { items: [], dbError: e instanceof Error ? e.message : "Could not read solutions." };
  }
}

export async function getSolutionForAdmin(slug: string): Promise<SolutionRecord | null> {
  if (!hasDatabaseUrl()) return null;
  try {
    const doc = await col().findOne({ _id: slug });
    return doc ? toRecord(doc) : null;
  } catch {
    return null;
  }
}

/** Copies the built-in solutions into the database. Only when it is empty. */
export async function importBuiltInSolutions(): Promise<number> {
  if ((await col().estimatedDocumentCount()) > 0) return 0;
  const now = new Date();
  await col().insertMany(builtInRecords.map(({ slug, ...rest }) => ({ _id: slug, ...rest, updatedAt: now })));
  return builtInRecords.length;
}

/** Returns false when the slug is already taken. New solutions go to the end. */
export async function createSolution(value: SolutionInput): Promise<boolean> {
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

/** Returns false when the solution no longer exists. */
export async function updateSolution(value: SolutionInput): Promise<boolean> {
  const { slug, ...rest } = value;
  const res = await col().updateOne({ _id: slug }, { $set: { ...rest, updatedAt: new Date() } });
  return res.matchedCount > 0;
}

export async function setSolutionPublished(slug: string, published: boolean) {
  await col().updateOne({ _id: slug }, { $set: { published, updatedAt: new Date() } });
}

export async function deleteSolution(slug: string) {
  await col().deleteOne({ _id: slug });
}

/**
 * Saves a drag-and-drop order. `slugs` must be exactly the current set of
 * solutions in their new order; anything else is rejected so a stale page
 * can't scramble the list. Returns false when the list is out of date.
 */
export async function reorderSolutions(slugs: string[]): Promise<boolean> {
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
