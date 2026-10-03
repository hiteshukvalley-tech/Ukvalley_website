import { unstable_cache } from "next/cache";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { slugify } from "@/lib/list-utils";
import { techStack as builtIn } from "@/lib/site-core";
import type { TechCategory, TechCategoryInput, TechCategoryRecord } from "@/lib/tech-stack-validation";

export const TECH_STACK_TAG = "techCategories";
const COLLECTION = "techCategories";

/** Mongo document: the generated slug is the _id. */
type Doc = Omit<TechCategoryRecord, "slug"> & { _id: string; updatedAt?: Date };

const col = () => getDb().collection<Doc>(COLLECTION);

function toRecord({ _id, updatedAt, ...rest }: Doc): TechCategoryRecord {
  void updatedAt;
  return { ...rest, slug: _id };
}

/** Strips the admin-only fields, leaving what the public pages use. */
function toPublic({ slug, published, order, ...rest }: TechCategoryRecord, index: number): TechCategory {
  void slug;
  void published;
  void order;
  void index;
  return rest;
}

const toStored = (m: TechCategory) => m;

/** Built-in items with generated ids, in the record shape the admin uses. */
export const builtInRecords: TechCategoryRecord[] = (() => {
  const used = new Set<string>();
  return builtIn.map((item, order) => {
    const stored = toStored(item);
    const base = slugify(stored.label);
    let slug = base;
    for (let i = 2; used.has(slug); i++) slug = `${base}-${i}`;
    used.add(slug);
    return { ...stored, slug, published: true, order };
  });
})();

async function readPublished(): Promise<TechCategory[]> {
  const docs = await col().find({ published: true }).sort({ order: 1 }).toArray();
  return docs.map((d, i) => toPublic(toRecord(d), i));
}

// Throws on DB errors so a failure is never cached; callers fall back.
const cachedPublished = unstable_cache(readPublished, ["techCategories-published-v1"], {
  tags: [TECH_STACK_TAG],
  revalidate: 60,
});

const cachedHasAny = unstable_cache(
  async () => (await col().estimatedDocumentCount()) > 0,
  ["techCategories-has-any-v1"],
  { tags: [TECH_STACK_TAG], revalidate: 60 }
);

/**
 * Items for the public site, in the order set in the admin. Uses the built-in
 * list until the admin has imported/created some, and whenever the database
 * can't be read. Drafts are never shown, even when all of them are drafts.
 */
export async function getTechStack(): Promise<TechCategory[]> {
  if (!hasDatabaseUrl()) return builtIn;
  try {
    if (!(await cachedHasAny())) return builtIn;
    const published = await cachedPublished();
    return published;
  } catch {
    return builtIn;
  }
}

/** Uncached list for the admin (drafts included), in display order. */
export async function listTechCategoriesForAdmin(): Promise<{ items: TechCategoryRecord[]; dbError?: string }> {
  if (!hasDatabaseUrl()) return { items: [], dbError: "MONGODB_URI is not set." };
  try {
    const docs = await col().find({}).sort({ order: 1, _id: 1 }).toArray();
    return { items: docs.map(toRecord) };
  } catch (e) {
    return { items: [], dbError: e instanceof Error ? e.message : "Could not read tech categories." };
  }
}

export async function getTechCategoryForAdmin(slug: string): Promise<TechCategoryRecord | null> {
  if (!hasDatabaseUrl()) return null;
  try {
    const doc = await col().findOne({ _id: slug });
    return doc ? toRecord(doc) : null;
  } catch {
    return null;
  }
}

/** Copies the built-in items into the database. Only when it is empty. */
export async function importBuiltInTechCategories(): Promise<number> {
  if ((await col().estimatedDocumentCount()) > 0) return 0;
  const now = new Date();
  await col().insertMany(builtInRecords.map(({ slug, ...rest }) => ({ _id: slug, ...rest, updatedAt: now })));
  return builtInRecords.length;
}

/** Adds an item at the end of the list; the id is made from its text. */
export async function createTechCategory(value: TechCategoryInput): Promise<void> {
  const last = await col().find({}, { projection: { order: 1 } }).sort({ order: -1 }).limit(1).toArray();
  const order = (last[0]?.order ?? -1) + 1;
  const base = slugify(value.label);
  // Two items can share text, so retry with -2, -3 … on a duplicate id.
  for (let i = 1; i <= 20; i++) {
    const id = i === 1 ? base : `${base}-${i}`;
    try {
      await col().insertOne({ _id: id, ...value, order, updatedAt: new Date() });
      return;
    } catch (e) {
      if ((e as { code?: number }).code !== 11000) throw e;
    }
  }
  throw new Error("Could not generate a unique id.");
}

/** Returns false when the item no longer exists. */
export async function updateTechCategory(slug: string, value: TechCategoryInput): Promise<boolean> {
  const res = await col().updateOne({ _id: slug }, { $set: { ...value, updatedAt: new Date() } });
  return res.matchedCount > 0;
}

export async function setTechCategoryPublished(slug: string, published: boolean) {
  await col().updateOne({ _id: slug }, { $set: { published, updatedAt: new Date() } });
}

export async function deleteTechCategory(slug: string) {
  await col().deleteOne({ _id: slug });
}

/**
 * Saves a drag-and-drop order. `slugs` must be exactly the current set of
 * items in their new order; anything else is rejected so a stale page can't
 * scramble the list. Returns false when the list is out of date.
 */
export async function reorderTechCategories(slugs: string[]): Promise<boolean> {
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
