import { unstable_cache } from "next/cache";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { services as builtInServices, type Service } from "@/lib/site-data";
import type { ServiceRecord } from "@/lib/services-validation";

export const SERVICES_TAG = "services";
const COLLECTION = "services";

/** Mongo document: the slug is the _id, so it is unique and never changes. */
type ServiceDoc = Omit<ServiceRecord, "slug"> & { _id: string; updatedAt?: Date };

const col = () => getDb().collection<ServiceDoc>(COLLECTION);

const slugOf = (s: Service) => s.href.split("/").pop() ?? "";

function toRecord({ _id, updatedAt, ...rest }: ServiceDoc): ServiceRecord {
  void updatedAt;
  return { ...rest, slug: _id };
}

/** The built-in services, in the record shape the admin works with. */
export const builtInRecords: ServiceRecord[] = builtInServices.map((s, order) => ({
  ...s,
  slug: slugOf(s),
  published: true,
  order,
}));

async function readPublished(): Promise<Service[]> {
  const docs = await col().find({ published: true }).sort({ order: 1 }).toArray();
  return docs.map(({ icon, title, blurb, bullets, href }) => ({ icon, title, blurb, bullets, href }));
}

// Throws on DB errors so a failure is never cached; callers fall back.
const cachedPublished = unstable_cache(readPublished, ["services-published-v1"], {
  tags: [SERVICES_TAG],
  revalidate: 60,
});

const cachedHasAny = unstable_cache(async () => (await col().estimatedDocumentCount()) > 0, ["services-has-any-v1"], {
  tags: [SERVICES_TAG],
  revalidate: 60,
});

/**
 * Services for the public site. Uses the built-in list until the admin has
 * imported/created services, and whenever the database can't be read.
 */
export async function getServices(): Promise<Service[]> {
  if (!hasDatabaseUrl()) return builtInServices;
  try {
    const hasAny = await cachedHasAny();
    if (!hasAny) return builtInServices;
    // The public sections need at least one card, so all-draft shows the defaults.
    const published = await cachedPublished();
    return published.length ? published : builtInServices;
  } catch {
    return builtInServices;
  }
}

/** Uncached list for the admin (drafts included). */
export async function listServicesForAdmin(): Promise<{
  items: ServiceRecord[];
  dbError?: string;
}> {
  if (!hasDatabaseUrl()) return { items: [], dbError: "MONGODB_URI is not set." };
  try {
    const docs = await col().find({}).sort({ order: 1 }).toArray();
    return { items: docs.map(toRecord) };
  } catch (e) {
    return { items: [], dbError: e instanceof Error ? e.message : "Could not read services." };
  }
}

export async function getServiceForAdmin(slug: string): Promise<ServiceRecord | null> {
  if (!hasDatabaseUrl()) return null;
  try {
    const doc = await col().findOne({ _id: slug });
    return doc ? toRecord(doc) : null;
  } catch {
    return null;
  }
}

/** Copies the built-in services into the database. Only when it is empty. */
export async function importBuiltInServices(): Promise<number> {
  if ((await col().estimatedDocumentCount()) > 0) return 0;
  const now = new Date();
  await col().insertMany(
    builtInRecords.map(({ slug, ...rest }) => ({ _id: slug, ...rest, updatedAt: now }))
  );
  return builtInRecords.length;
}

/** Returns false when the slug is already taken. */
export async function createService(value: Omit<ServiceRecord, "order">): Promise<boolean> {
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

/** Returns false when the service no longer exists. */
export async function updateService(value: Omit<ServiceRecord, "order">): Promise<boolean> {
  const { slug, ...rest } = value;
  const res = await col().updateOne({ _id: slug }, { $set: { ...rest, updatedAt: new Date() } });
  return res.matchedCount > 0;
}

export async function setServicePublished(slug: string, published: boolean) {
  await col().updateOne({ _id: slug }, { $set: { published, updatedAt: new Date() } });
}

export async function deleteService(slug: string) {
  await col().deleteOne({ _id: slug });
}

/**
 * Saves a drag-and-drop order. `slugs` must be exactly the current set of
 * services in their new order; anything else is rejected so a stale page can't
 * scramble the list. Returns false when the list is out of date.
 */
export async function reorderServices(slugs: string[]): Promise<boolean> {
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

/** Swaps a service with its neighbour, then renumbers so orders stay 0..n-1. */
export async function moveService(slug: string, direction: "up" | "down") {
  const docs = await col().find({}, { projection: { _id: 1 } }).sort({ order: 1 }).toArray();
  const ids = docs.map((d) => d._id);
  const from = ids.indexOf(slug);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from < 0 || to < 0 || to >= ids.length) return;
  [ids[from], ids[to]] = [ids[to], ids[from]];
  await col().bulkWrite(
    ids.map((id, order) => ({ updateOne: { filter: { _id: id }, update: { $set: { order } } } }))
  );
}
