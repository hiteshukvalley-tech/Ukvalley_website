import { unstable_cache } from "next/cache";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { caseStudies as builtInCases, type CaseStudy } from "@/lib/site-data";
import type { CaseInput, CaseRecord } from "@/lib/cases-validation";

export const CASES_TAG = "case-studies";
const COLLECTION = "caseStudies";

/** Mongo document: the slug is the _id, so it is unique and never changes. */
type CaseDoc = Omit<CaseRecord, "slug"> & { _id: string; updatedAt?: Date };

const col = () => getDb().collection<CaseDoc>(COLLECTION);

function toRecord({ _id, updatedAt, ...rest }: CaseDoc): CaseRecord {
  void updatedAt;
  return { ...rest, slug: _id };
}

/** Strips the admin-only fields, leaving what the public pages use. */
function toPublic({ published, order, ...study }: CaseRecord): CaseStudy {
  void published;
  void order;
  return study;
}

/** The built-in case studies, in the record shape the admin works with. */
export const builtInRecords: CaseRecord[] = builtInCases.map((c, order) => ({
  ...c,
  published: true,
  order,
}));

async function readPublished(): Promise<CaseStudy[]> {
  const docs = await col().find({ published: true }).sort({ order: 1 }).toArray();
  return docs.map((d) => toPublic(toRecord(d)));
}

// Throws on DB errors so a failure is never cached; callers fall back.
const cachedPublished = unstable_cache(readPublished, ["cases-published-v1"], {
  tags: [CASES_TAG],
  revalidate: 60,
});

const cachedHasAny = unstable_cache(
  async () => (await col().estimatedDocumentCount()) > 0,
  ["cases-has-any-v1"],
  { tags: [CASES_TAG], revalidate: 60 }
);

/**
 * Case studies for the public site, in the order set in the admin. Uses the
 * built-in list until the admin has imported/created some, and whenever the
 * database can't be read.
 */
export async function getCaseStudies(): Promise<CaseStudy[]> {
  if (!hasDatabaseUrl()) return builtInCases;
  try {
    if (!(await cachedHasAny())) return builtInCases;
    // Drafts are never shown, even when every item is a draft.
    const published = await cachedPublished();
    return published;
  } catch {
    return builtInCases;
  }
}

/** Uncached list for the admin (drafts included), in display order. */
export async function listCasesForAdmin(): Promise<{ items: CaseRecord[]; dbError?: string }> {
  if (!hasDatabaseUrl()) return { items: [], dbError: "MONGODB_URI is not set." };
  try {
    const docs = await col().find({}).sort({ order: 1, _id: 1 }).toArray();
    return { items: docs.map(toRecord) };
  } catch (e) {
    return { items: [], dbError: e instanceof Error ? e.message : "Could not read case studies." };
  }
}

export async function getCaseForAdmin(slug: string): Promise<CaseRecord | null> {
  if (!hasDatabaseUrl()) return null;
  try {
    const doc = await col().findOne({ _id: slug });
    return doc ? toRecord(doc) : null;
  } catch {
    return null;
  }
}

/** Copies the built-in case studies into the database. Only when it is empty. */
export async function importBuiltInCases(): Promise<number> {
  if ((await col().estimatedDocumentCount()) > 0) return 0;
  const now = new Date();
  await col().insertMany(builtInRecords.map(({ slug, ...rest }) => ({ _id: slug, ...rest, updatedAt: now })));
  return builtInRecords.length;
}

/** Returns false when the slug is already taken. New case studies go to the top. */
export async function createCase(value: CaseInput): Promise<boolean> {
  const { slug, ...rest } = value;
  const first = await col().find({}, { projection: { order: 1 } }).sort({ order: 1 }).limit(1).toArray();
  const order = (first[0]?.order ?? 1) - 1;
  try {
    await col().insertOne({ _id: slug, ...rest, order, updatedAt: new Date() });
    return true;
  } catch (e) {
    if ((e as { code?: number }).code === 11000) return false;
    throw e;
  }
}

/** Returns false when the case study no longer exists. */
export async function updateCase(value: CaseInput): Promise<boolean> {
  const { slug, ...rest } = value;
  const res = await col().updateOne({ _id: slug }, { $set: { ...rest, updatedAt: new Date() } });
  return res.matchedCount > 0;
}

export async function setCasePublished(slug: string, published: boolean) {
  await col().updateOne({ _id: slug }, { $set: { published, updatedAt: new Date() } });
}

export async function deleteCase(slug: string) {
  await col().deleteOne({ _id: slug });
}

/**
 * Saves a drag-and-drop order. `slugs` must be exactly the current set of
 * case studies in their new order; anything else is rejected so a stale page
 * can't scramble the list. Returns false when the list is out of date.
 */
export async function reorderCases(slugs: string[]): Promise<boolean> {
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
