import { unstable_cache } from "next/cache";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { products as builtInProducts, type Product } from "@/lib/site-data";
import type { ProductInput, ProductRecord } from "@/lib/products-validation";

export const PRODUCTS_TAG = "products";
const COLLECTION = "products";

/** The product whose rich storytelling card is used as the flagship. */
export const FLAGSHIP_SLUG = "televalley";

/** Mongo document: the slug is the _id, so it is unique and never changes. */
type ProductDoc = Omit<ProductRecord, "slug"> & { _id: string; updatedAt?: Date };

const col = () => getDb().collection<ProductDoc>(COLLECTION);

function toRecord({ _id, updatedAt, ...rest }: ProductDoc): ProductRecord {
  void updatedAt;
  return { ...rest, slug: _id };
}

/** Strips the admin-only fields, leaving what the public pages use. */
function toPublic({ published, order, ...product }: ProductRecord): Product {
  void published;
  void order;
  return product;
}

/** The built-in products, in the record shape the admin works with. */
export const builtInRecords: ProductRecord[] = builtInProducts.map((p, order) => ({
  ...p,
  published: true,
  order,
}));

async function readPublished(): Promise<Product[]> {
  const docs = await col().find({ published: true }).sort({ order: 1 }).toArray();
  return docs.map((d) => toPublic(toRecord(d)));
}

// Throws on DB errors so a failure is never cached; callers fall back.
const cachedPublished = unstable_cache(readPublished, ["products-published-v1"], {
  tags: [PRODUCTS_TAG],
  revalidate: 60,
});

const cachedHasAny = unstable_cache(
  async () => (await col().estimatedDocumentCount()) > 0,
  ["products-has-any-v1"],
  { tags: [PRODUCTS_TAG], revalidate: 60 }
);

/**
 * Products for the public site, in the order set in the admin. Uses the
 * built-in list until the admin has imported/created some, and whenever the
 * database can't be read.
 */
export async function getProducts(): Promise<Product[]> {
  if (!hasDatabaseUrl()) return builtInProducts;
  try {
    if (!(await cachedHasAny())) return builtInProducts;
    // Drafts are never shown, even when every item is a draft.
    const published = await cachedPublished();
    return published;
  } catch {
    return builtInProducts;
  }
}

/** Uncached list for the admin (drafts included), in display order. */
export async function listProductsForAdmin(): Promise<{ items: ProductRecord[]; dbError?: string }> {
  if (!hasDatabaseUrl()) return { items: [], dbError: "MONGODB_URI is not set." };
  try {
    const docs = await col().find({}).sort({ order: 1, _id: 1 }).toArray();
    return { items: docs.map(toRecord) };
  } catch (e) {
    return { items: [], dbError: e instanceof Error ? e.message : "Could not read products." };
  }
}

export async function getProductForAdmin(slug: string): Promise<ProductRecord | null> {
  if (!hasDatabaseUrl()) return null;
  try {
    const doc = await col().findOne({ _id: slug });
    return doc ? toRecord(doc) : null;
  } catch {
    return null;
  }
}

/** Copies the built-in products into the database. Only when it is empty. */
export async function importBuiltInProducts(): Promise<number> {
  if ((await col().estimatedDocumentCount()) > 0) return 0;
  const now = new Date();
  await col().insertMany(builtInRecords.map(({ slug, ...rest }) => ({ _id: slug, ...rest, updatedAt: now })));
  return builtInRecords.length;
}

/** Returns false when the slug is already taken. New products go to the end. */
export async function createProduct(value: ProductInput): Promise<boolean> {
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
 * Returns false when the product no longer exists. The optional headline metric
 * is removed when the form leaves it empty; `featured` and `order` are kept.
 */
export async function updateProduct(value: ProductInput): Promise<boolean> {
  const { slug, metric, ...rest } = value;
  const res = await col().updateOne(
    { _id: slug },
    metric
      ? { $set: { ...rest, metric, updatedAt: new Date() } }
      : { $set: { ...rest, updatedAt: new Date() }, $unset: { metric: "" } }
  );
  return res.matchedCount > 0;
}

export async function setProductPublished(slug: string, published: boolean) {
  await col().updateOne({ _id: slug }, { $set: { published, updatedAt: new Date() } });
}

export async function deleteProduct(slug: string) {
  await col().deleteOne({ _id: slug });
}

/**
 * Saves a drag-and-drop order. `slugs` must be exactly the current set of
 * products in their new order; anything else is rejected so a stale page can't
 * scramble the list. Returns false when the list is out of date.
 */
export async function reorderProducts(slugs: string[]): Promise<boolean> {
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

/**
 * The flagship card (large, TeleValley-specific storytelling) is only used for
 * TeleValley. If it is missing or unpublished, every product gets a normal card.
 */
export function splitFlagship(list: Product[]): { flagship?: Product; rest: Product[] } {
  const flagship = list.find((p) => p.slug === FLAGSHIP_SLUG);
  return { flagship, rest: flagship ? list.filter((p) => p !== flagship) : list };
}

/** Row template for the card column beside the flagship, sized to the card count. */
export const flagshipRowsClass: Record<number, string> = {
  1: "lg:grid-rows-1",
  2: "lg:grid-rows-2",
  3: "lg:grid-rows-3",
  4: "lg:grid-rows-4",
  5: "lg:grid-rows-5",
  6: "lg:grid-rows-6",
};
