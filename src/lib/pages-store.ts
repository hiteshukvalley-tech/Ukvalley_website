import { unstable_cache } from "next/cache";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { mergeValues } from "@/lib/home-store";
import type { SectionValues } from "@/lib/home-schema";
import { emptyPageContent, emptyPageValues, isPageKey, pageDef, type PageContent } from "@/lib/pages-schema";

export const PAGES_TAG = "page-content";
const COLLECTION = "pages";

/** One document per inner page: `_id` is the page key ("about", "pricing"…). */
type PageDoc = { _id: string; values: SectionValues; updatedAt: Date };
const col = () => getDb().collection<PageDoc>(COLLECTION);

const toContent = (key: string, saved?: SectionValues): PageContent =>
  mergeValues(pageDef(key), emptyPageValues, saved) as unknown as PageContent;

// Throws on DB errors so a failure is never cached; the getter falls back.
const cachedAll = unstable_cache(
  async () => {
    const docs = await col().find({}).toArray();
    return Object.fromEntries(docs.map((d) => [d._id, toContent(d._id, d.values)])) as Record<string, PageContent>;
  },
  ["page-content-v1"],
  { tags: [PAGES_TAG], revalidate: 60 }
);

/** Hero text and extra blocks for one inner page. Never throws; empty when nothing is saved. */
export async function getPageContent(key: string): Promise<PageContent> {
  if (!hasDatabaseUrl() || !isPageKey(key)) return emptyPageContent;
  try {
    return (await cachedAll())[key] ?? emptyPageContent;
  } catch {
    return emptyPageContent;
  }
}

/** Uncached read for the admin. */
export async function getPagesForAdmin(): Promise<{
  byKey: Record<string, { content: PageContent; updatedAt: string | null }>;
  dbError?: string;
}> {
  if (!hasDatabaseUrl()) return { byKey: {}, dbError: "MONGODB_URI is not set." };
  try {
    const docs = await col().find({}).toArray();
    return {
      byKey: Object.fromEntries(
        docs.map((d) => [d._id, { content: toContent(d._id, d.values), updatedAt: d.updatedAt?.toISOString() ?? null }])
      ),
    };
  } catch (e) {
    return { byKey: {}, dbError: e instanceof Error ? e.message : "Could not read page text." };
  }
}

export async function writePageContent(key: string, values: SectionValues) {
  await col().updateOne({ _id: key }, { $set: { values, updatedAt: new Date() } }, { upsert: true });
}

export async function resetPageContent(key: string) {
  await col().deleteOne({ _id: key });
}
