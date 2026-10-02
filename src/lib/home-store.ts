import { unstable_cache } from "next/cache";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { defaultHome, type HomeContent } from "@/lib/home-defaults";
import { HOME_SECTIONS, type HomeSectionKey, type SectionDef, type SectionValues } from "@/lib/home-schema";

export const HOME_TAG = "home-content";
const COLLECTION = "home";

/** One document per section: `_id` is the section key. */
type HomeDoc = { _id: HomeSectionKey; values: SectionValues; visible: boolean; updatedAt: Date };

export type HomeVisibility = Record<HomeSectionKey, boolean>;
export type HomePage = { content: HomeContent; visible: HomeVisibility };

const col = () => getDb().collection<HomeDoc>(COLLECTION);

const allVisible = (): HomeVisibility =>
  Object.fromEntries(HOME_SECTIONS.map((s) => [s.key, true])) as HomeVisibility;

/**
 * Saved values over the defaults, field by field, so a field added to the
 * schema later still shows its default instead of disappearing.
 */
function mergeSection(def: SectionDef, saved: SectionValues | undefined): SectionValues {
  const base = defaultHome[def.key] as unknown as SectionValues;
  if (!saved) return base;
  const out: SectionValues = { ...base };
  for (const f of def.fields) {
    const v = saved[f.key];
    if (f.kind === "text" || f.kind === "textarea") {
      if (typeof v === "string") out[f.key] = v;
    } else if (Array.isArray(v)) {
      out[f.key] =
        f.kind === "list"
          ? v.filter((s): s is string => typeof s === "string")
          : v.map((row) =>
              Object.fromEntries(
                f.fields.map((sf) => [sf.key, typeof (row as Record<string, unknown>)?.[sf.key] === "string" ? (row as Record<string, string>)[sf.key] : ""])
              )
            );
    }
  }
  return out;
}

async function readAll(): Promise<{ page: HomePage; updated: Partial<Record<HomeSectionKey, string>> }> {
  const docs = await col().find({}).toArray();
  const byKey = new Map(docs.map((d) => [d._id, d]));
  const content = {} as Record<HomeSectionKey, SectionValues>;
  const visible = allVisible();
  const updated: Partial<Record<HomeSectionKey, string>> = {};
  for (const def of HOME_SECTIONS) {
    const doc = byKey.get(def.key);
    content[def.key] = mergeSection(def, doc?.values);
    if (doc) {
      visible[def.key] = def.canHide ? doc.visible !== false : true;
      updated[def.key] = doc.updatedAt?.toISOString();
    }
  }
  return { page: { content: content as unknown as HomeContent, visible }, updated };
}

// Throws on DB errors so a failure is never cached; the getter falls back.
const cachedRead = unstable_cache(async () => (await readAll()).page, ["home-content-v1"], {
  tags: [HOME_TAG],
  revalidate: 3600,
});

/** Home page content for the public site. Never throws. */
export async function getHomePage(): Promise<HomePage> {
  const fallback = { content: defaultHome, visible: allVisible() };
  if (!hasDatabaseUrl()) return fallback;
  try {
    return await cachedRead();
  } catch {
    return fallback;
  }
}

/** Uncached read for the admin. */
export async function getHomeForAdmin(): Promise<{
  page: HomePage;
  updated: Partial<Record<HomeSectionKey, string>>;
  dbError?: string;
}> {
  if (!hasDatabaseUrl()) {
    return { page: { content: defaultHome, visible: allVisible() }, updated: {}, dbError: "MONGODB_URI is not set." };
  }
  try {
    return await readAll();
  } catch (e) {
    return {
      page: { content: defaultHome, visible: allVisible() },
      updated: {},
      dbError: e instanceof Error ? e.message : "Could not read the home page content.",
    };
  }
}

export async function writeHomeSection(key: HomeSectionKey, values: SectionValues, visible: boolean) {
  await col().updateOne({ _id: key }, { $set: { values, visible, updatedAt: new Date() } }, { upsert: true });
}

/** Back to the built-in text (and visible). */
export async function resetHomeSection(key: HomeSectionKey) {
  await col().deleteOne({ _id: key });
}
