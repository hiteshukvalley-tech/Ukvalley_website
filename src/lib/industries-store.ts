import { unstable_cache } from "next/cache";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { industries as builtInIndustries, type Industry } from "@/lib/site-data";
import { getCaseStudies } from "@/lib/cases-store";
import type { IndustryInput, IndustryRecord } from "@/lib/industries-validation";

export const INDUSTRIES_TAG = "industries";
const COLLECTION = "industries";

/** Mongo document: the slug is the _id, so it is unique and never changes. */
type IndustryDoc = Omit<IndustryRecord, "slug"> & { _id: string; updatedAt?: Date };

const col = () => getDb().collection<IndustryDoc>(COLLECTION);

function toRecord({ _id, updatedAt, ...rest }: IndustryDoc): IndustryRecord {
  void updatedAt;
  return { ...rest, slug: _id };
}

/** Strips the admin-only fields, leaving what the public pages use. */
function toPublic({ published, order, ...industry }: IndustryRecord): Industry {
  void published;
  void order;
  return industry;
}

/** The built-in industries, in the record shape the admin works with. */
export const builtInRecords: IndustryRecord[] = builtInIndustries.map((i, order) => ({
  ...i,
  published: true,
  order,
}));

async function readPublished(): Promise<Industry[]> {
  const docs = await col().find({ published: true }).sort({ order: 1 }).toArray();
  return docs.map((d) => toPublic(toRecord(d)));
}

// Throws on DB errors so a failure is never cached; callers fall back.
const cachedPublished = unstable_cache(readPublished, ["industries-published-v1"], {
  tags: [INDUSTRIES_TAG],
  revalidate: 60,
});

const cachedHasAny = unstable_cache(
  async () => (await col().estimatedDocumentCount()) > 0,
  ["industries-has-any-v1"],
  { tags: [INDUSTRIES_TAG], revalidate: 60 }
);

/**
 * Industries for the public site, in the order set in the admin. Uses the
 * built-in list until the admin has imported/created some, and whenever the
 * database can't be read.
 */
async function readIndustries(): Promise<Industry[]> {
  if (!hasDatabaseUrl()) return builtInIndustries;
  try {
    if (!(await cachedHasAny())) return builtInIndustries;
    // Drafts are never shown, even when every item is a draft.
    const published = await cachedPublished();
    return published;
  } catch {
    return builtInIndustries;
  }
}

/**
 * Industries for the public site. An industry's featured case study is dropped
 * when that case study is a draft or deleted, so the page never links to a 404.
 */
export async function getIndustries(): Promise<Industry[]> {
  const list = await readIndustries();
  const CASE = "/case-studies/";
  if (!list.some((i) => i.featuredCase?.href.startsWith(CASE))) return list;
  const live = new Set((await getCaseStudies()).map((c) => `${CASE}${c.slug}`));
  return list.map(({ featuredCase, ...rest }) =>
    featuredCase && featuredCase.href.startsWith(CASE) && !live.has(featuredCase.href) ? rest : { ...rest, featuredCase }
  );
}

/** Uncached list for the admin (drafts included), in display order. */
export async function listIndustriesForAdmin(): Promise<{ items: IndustryRecord[]; dbError?: string }> {
  if (!hasDatabaseUrl()) return { items: [], dbError: "MONGODB_URI is not set." };
  try {
    const docs = await col().find({}).sort({ order: 1, _id: 1 }).toArray();
    return { items: docs.map(toRecord) };
  } catch (e) {
    return { items: [], dbError: e instanceof Error ? e.message : "Could not read industries." };
  }
}

export async function getIndustryForAdmin(slug: string): Promise<IndustryRecord | null> {
  if (!hasDatabaseUrl()) return null;
  try {
    const doc = await col().findOne({ _id: slug });
    return doc ? toRecord(doc) : null;
  } catch {
    return null;
  }
}

/** Copies the built-in industries into the database. Only when it is empty. */
export async function importBuiltInIndustries(): Promise<number> {
  if ((await col().estimatedDocumentCount()) > 0) return 0;
  const now = new Date();
  await col().insertMany(builtInRecords.map(({ slug, ...rest }) => ({ _id: slug, ...rest, updatedAt: now })));
  return builtInRecords.length;
}

/** Returns false when the slug is already taken. New industries go to the end. */
export async function createIndustry(value: IndustryInput): Promise<boolean> {
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
 * Returns false when the industry no longer exists. The optional proof points
 * and featured case study are removed when the form leaves them empty.
 */
export async function updateIndustry(value: IndustryInput): Promise<boolean> {
  const { slug, proof, featuredCase, ...rest } = value;
  const unset: Record<string, ""> = {};
  if (!proof) unset.proof = "";
  if (!featuredCase) unset.featuredCase = "";
  const res = await col().updateOne(
    { _id: slug },
    {
      $set: {
        ...rest,
        ...(proof ? { proof } : {}),
        ...(featuredCase ? { featuredCase } : {}),
        updatedAt: new Date(),
      },
      ...(Object.keys(unset).length ? { $unset: unset } : {}),
    }
  );
  return res.matchedCount > 0;
}

export async function setIndustryPublished(slug: string, published: boolean) {
  await col().updateOne({ _id: slug }, { $set: { published, updatedAt: new Date() } });
}

export async function deleteIndustry(slug: string) {
  await col().deleteOne({ _id: slug });
}

/**
 * Saves a drag-and-drop order. `slugs` must be exactly the current set of
 * industries in their new order; anything else is rejected so a stale page
 * can't scramble the list. Returns false when the list is out of date.
 */
export async function reorderIndustries(slugs: string[]): Promise<boolean> {
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
