import { unstable_cache } from "next/cache";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { insights as builtInInsights, type Insight } from "@/lib/site-data";
import type { BlogInput, BlogRecord } from "@/lib/blog-validation";

export const BLOG_TAG = "blog";
const COLLECTION = "posts";

/** Mongo document: the slug is the _id, so it is unique and never changes. */
type PostDoc = Omit<BlogRecord, "slug"> & { _id: string; updatedAt?: Date };

const col = () => getDb().collection<PostDoc>(COLLECTION);

function toRecord({ _id, updatedAt, ...rest }: PostDoc): BlogRecord {
  void updatedAt;
  return { ...rest, slug: _id };
}

const newestFirst = (a: { date: string }, b: { date: string }) => b.date.localeCompare(a.date);

/** The built-in posts (newest first to start with), in the shape the admin works with. */
export const builtInRecords: BlogRecord[] = [...builtInInsights]
  .sort(newestFirst)
  .map((p, order) => ({ ...p, published: true, order }));

async function readPublished(): Promise<Insight[]> {
  const docs = await col().find({ published: true }).sort({ order: 1, date: -1 }).toArray();
  return docs.map(({ _id, category, title, excerpt, readTime, date, body }) => ({
    slug: _id, category, title, excerpt, readTime, date, body,
  }));
}

// Throws on DB errors so a failure is never cached; callers fall back.
const cachedPublished = unstable_cache(readPublished, ["blog-published-v1"], {
  tags: [BLOG_TAG],
  revalidate: 3600,
});

const cachedHasAny = unstable_cache(
  async () => (await col().estimatedDocumentCount()) > 0,
  ["blog-has-any-v1"],
  { tags: [BLOG_TAG], revalidate: 3600 }
);

/**
 * Posts for the public site, in the order set in the admin (drag and drop;
 * newest first until it is changed). Uses the built-in list until the
 * admin has imported/created posts, and whenever the database can't be read.
 */
export async function getPosts(): Promise<Insight[]> {
  const fallback = builtInRecords.map(({ published, order, ...post }) => (void published, void order, post));
  if (!hasDatabaseUrl()) return fallback;
  try {
    if (!(await cachedHasAny())) return fallback;
    // The public pages need at least one post, so all-draft shows the defaults.
    const published = await cachedPublished();
    return published.length ? published : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Posts saved before drag-and-drop ordering existed have no `order`. Number
 * them newest-first (the order the site already showed) so nothing jumps.
 */
async function ensureOrder() {
  if ((await col().countDocuments({ order: { $exists: false } }, { limit: 1 })) === 0) return;
  const docs = await col().find({}, { projection: { _id: 1 } }).sort({ date: -1, _id: 1 }).toArray();
  await col().bulkWrite(
    docs.map((d, order) => ({ updateOne: { filter: { _id: d._id }, update: { $set: { order } } } }))
  );
}

/** Uncached list for the admin (drafts included), in display order. */
export async function listPostsForAdmin(): Promise<{ items: BlogRecord[]; dbError?: string }> {
  if (!hasDatabaseUrl()) return { items: [], dbError: "MONGODB_URI is not set." };
  try {
    await ensureOrder();
    const docs = await col().find({}).sort({ order: 1, _id: 1 }).toArray();
    return { items: docs.map(toRecord) };
  } catch (e) {
    return { items: [], dbError: e instanceof Error ? e.message : "Could not read posts." };
  }
}

export async function getPostForAdmin(slug: string): Promise<BlogRecord | null> {
  if (!hasDatabaseUrl()) return null;
  try {
    const doc = await col().findOne({ _id: slug });
    return doc ? toRecord(doc) : null;
  } catch {
    return null;
  }
}

/** Copies the built-in posts into the database. Only when it is empty. */
export async function importBuiltInPosts(): Promise<number> {
  if ((await col().estimatedDocumentCount()) > 0) return 0;
  const now = new Date();
  await col().insertMany(builtInRecords.map(({ slug, ...rest }) => ({ _id: slug, ...rest, updatedAt: now })));
  return builtInRecords.length;
}

/** Returns false when the slug is already taken. New posts go to the top. */
export async function createPost(value: BlogInput): Promise<boolean> {
  const { slug, ...rest } = value;
  await ensureOrder();
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

/** Returns false when the post no longer exists. */
export async function updatePost(value: BlogInput): Promise<boolean> {
  const { slug, ...rest } = value;
  const res = await col().updateOne({ _id: slug }, { $set: { ...rest, updatedAt: new Date() } });
  return res.matchedCount > 0;
}

export async function setPostPublished(slug: string, published: boolean) {
  await col().updateOne({ _id: slug }, { $set: { published, updatedAt: new Date() } });
}

export async function deletePost(slug: string) {
  await col().deleteOne({ _id: slug });
}

/**
 * Saves a drag-and-drop order. `slugs` must be exactly the current set of
 * posts in their new order; anything else is rejected so a stale page can't
 * scramble the list. Returns false when the list is out of date.
 */
export async function reorderPosts(slugs: string[]): Promise<boolean> {
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
