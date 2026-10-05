import { unstable_cache } from "next/cache";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { defaultHome, type HomeContent } from "@/lib/home-defaults";
import { HOME_SECTIONS, isHomeSectionKey, type HomeSectionKey, type SectionDef, type SectionValues } from "@/lib/home-schema";
import {
  CHROME_DEFS, CUSTOM_PREFIX, CUSTOM_SECTION_DEF, OFFICIAL_LOGO, defaultFooter, defaultHeader, isCustomKey, newCustomSection,
  type ChromeKey, type CustomSectionContent, type FooterContent, type HeaderContent,
} from "@/lib/site-content-schema";

export const HOME_TAG = "home-content";
export const CHROME_TAG = "site-chrome";
const COLLECTION = "home";
const CHROME_COLLECTION = "chrome";
const LAYOUT_ID = "_layout";

/**
 * One document per section: `_id` is the built-in section key or a custom id
 * ("custom-xxxxxxxx"). `_layout` holds the order of every section.
 */
type HomeDoc = { _id: string; values?: SectionValues; visible?: boolean; order?: string[]; updatedAt: Date };
type ChromeDoc = { _id: ChromeKey; values: SectionValues; updatedAt: Date };

export type HomeVisibility = Record<HomeSectionKey, boolean>;
export type CustomSection = { id: string; values: CustomSectionContent; visible: boolean };
export type HomePage = {
  content: HomeContent;
  visible: HomeVisibility;
  /** every section id (built-in keys and custom ids) in display order; hero is always first */
  order: string[];
  custom: CustomSection[];
};

const col = () => getDb().collection<HomeDoc>(COLLECTION);
const chromeCol = () => getDb().collection<ChromeDoc>(CHROME_COLLECTION);

const allVisible = (): HomeVisibility =>
  Object.fromEntries(HOME_SECTIONS.map((s) => [s.key, true])) as HomeVisibility;

const DEFAULT_ORDER: string[] = HOME_SECTIONS.map((s) => s.key);

/**
 * The saved order made safe: unknown ids and repeats dropped, sections added
 * since it was saved slotted in after their default neighbour, custom sections
 * not yet placed appended, and the hero kept on top.
 */
export function resolveOrder(saved: string[] | undefined, customIds: string[]): string[] {
  const valid = new Set<string>([...DEFAULT_ORDER, ...customIds]);
  const out: string[] = [];
  for (const id of saved ?? []) if (valid.has(id) && !out.includes(id)) out.push(id);
  DEFAULT_ORDER.forEach((key, i) => {
    if (out.includes(key)) return;
    const before = DEFAULT_ORDER.slice(0, i).reverse().find((k) => out.includes(k));
    out.splice(before ? out.indexOf(before) + 1 : 0, 0, key);
  });
  for (const id of customIds) if (!out.includes(id)) out.push(id);
  return ["hero", ...out.filter((id) => id !== "hero")];
}

/**
 * Saved values over the defaults, field by field, so a field added to the
 * schema later still shows its default instead of disappearing.
 */
export function mergeValues(def: SectionDef, base: SectionValues, saved: SectionValues | undefined): SectionValues {
  if (!saved) return base;
  const out: SectionValues = { ...base };
  for (const f of def.fields) {
    const v = saved[f.key];
    if (f.kind === "text" || f.kind === "textarea" || f.kind === "image") {
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

async function readAll(): Promise<{ page: HomePage; updated: Partial<Record<string, string>> }> {
  const docs = await col().find({}).toArray();
  const byKey = new Map(docs.map((d) => [d._id, d]));
  const content = {} as Record<HomeSectionKey, SectionValues>;
  const visible = allVisible();
  const updated: Partial<Record<string, string>> = {};
  for (const def of HOME_SECTIONS) {
    const doc = byKey.get(def.key);
    content[def.key] = mergeValues(def, defaultHome[def.key] as unknown as SectionValues, doc?.values);
    if (doc) {
      visible[def.key] = def.canHide ? doc.visible !== false : true;
      updated[def.key] = doc.updatedAt?.toISOString();
    }
  }
  // Custom sections, oldest first (the order list decides where they show).
  const custom: CustomSection[] = docs
    .filter((d) => isCustomKey(d._id))
    .sort((a, b) => (a.updatedAt?.getTime() ?? 0) - (b.updatedAt?.getTime() ?? 0))
    .map((d) => ({
      id: d._id,
      values: mergeValues(CUSTOM_SECTION_DEF, newCustomSection("Custom section") as unknown as SectionValues, d.values) as unknown as CustomSectionContent,
      visible: d.visible !== false,
    }));
  for (const d of docs) if (isCustomKey(d._id)) updated[d._id] = d.updatedAt?.toISOString();
  const order = resolveOrder(byKey.get(LAYOUT_ID)?.order, custom.map((c) => c.id));
  return { page: { content: content as unknown as HomeContent, visible, order, custom }, updated };
}

const fallbackPage = (): HomePage => ({ content: defaultHome, visible: allVisible(), order: DEFAULT_ORDER, custom: [] });

// Throws on DB errors so a failure is never cached; the getter falls back.
const cachedRead = unstable_cache(async () => (await readAll()).page, ["home-content-v2"], {
  tags: [HOME_TAG],
  revalidate: 60,
});

/** Home page content for the public site. Never throws. */
export async function getHomePage(): Promise<HomePage> {
  if (!hasDatabaseUrl()) return fallbackPage();
  try {
    return await cachedRead();
  } catch {
    return fallbackPage();
  }
}

/** Uncached read for the admin. */
export async function getHomeForAdmin(): Promise<{
  page: HomePage;
  updated: Partial<Record<string, string>>;
  dbError?: string;
}> {
  if (!hasDatabaseUrl()) return { page: fallbackPage(), updated: {}, dbError: "MONGODB_URI is not set." };
  try {
    return await readAll();
  } catch (e) {
    return {
      page: fallbackPage(),
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

/** Saves the display order of every section. Unknown ids are dropped, hero stays first. */
export async function writeHomeOrder(order: string[]) {
  const customIds = (await col().find({ _id: { $regex: `^${CUSTOM_PREFIX}` } }, { projection: { _id: 1 } }).toArray())
    .map((d) => d._id)
    .filter(isCustomKey);
  await col().updateOne(
    { _id: LAYOUT_ID },
    { $set: { order: resolveOrder(order, customIds), updatedAt: new Date() } },
    { upsert: true }
  );
}

const newCustomId = () => `${CUSTOM_PREFIX}${Math.random().toString(36).slice(2, 10).padEnd(8, "0")}`;

/** Adds a custom section right after Insights and returns its id. */
export async function createCustomSection(adminName: string): Promise<string> {
  const id = newCustomId();
  await col().insertOne({
    _id: id,
    values: newCustomSection(adminName) as unknown as SectionValues,
    visible: true,
    updatedAt: new Date(),
  });
  const { page } = await readAll();
  const order = page.order.filter((x) => x !== id);
  order.splice(order.indexOf("insights") + 1 || order.length, 0, id);
  await writeHomeOrder(order);
  return id;
}

/** Updates an existing custom section only (never creates one). Returns false when it is gone. */
export async function writeCustomSection(id: string, values: SectionValues, visible: boolean): Promise<boolean> {
  if (!isCustomKey(id)) return false;
  const res = await col().updateOne({ _id: id }, { $set: { values, visible, updatedAt: new Date() } });
  return res.matchedCount > 0;
}

export async function deleteCustomSection(id: string) {
  if (!isCustomKey(id)) return;
  await col().deleteOne({ _id: id });
  await col().updateOne({ _id: LAYOUT_ID }, { $pull: { order: id } });
}

/** Whether `key` is a built-in section or an existing custom section. */
export const isSectionKey = (key: string) => isHomeSectionKey(key) || isCustomKey(key);

/* ── Header and footer ─────────────────────────────────────────────── */

export type ChromeContent = { header: HeaderContent; footer: FooterContent };
const chromeDefaults: Record<ChromeKey, SectionValues> = {
  header: defaultHeader as unknown as SectionValues,
  footer: defaultFooter as unknown as SectionValues,
};

async function readChrome(): Promise<{ content: ChromeContent; updated: Partial<Record<ChromeKey, string>> }> {
  const docs = await chromeCol().find({}).toArray();
  const byKey = new Map(docs.map((d) => [d._id, d]));
  const updated: Partial<Record<ChromeKey, string>> = {};
  const out = {} as Record<ChromeKey, SectionValues>;
  for (const key of Object.keys(CHROME_DEFS) as ChromeKey[]) {
    const doc = byKey.get(key);
    out[key] = mergeValues(CHROME_DEFS[key], chromeDefaults[key], doc?.values);
    if (doc) updated[key] = doc.updatedAt?.toISOString();
  }
  // An empty logo field (e.g. a header saved before logos existed) means the official logo.
  if (!out.header.logoImage) out.header.logoImage = OFFICIAL_LOGO;
  return { content: out as unknown as ChromeContent, updated };
}

const defaultChrome = (): ChromeContent => ({ header: defaultHeader, footer: defaultFooter });

const cachedChrome = unstable_cache(async () => (await readChrome()).content, ["site-chrome-v2"], {
  tags: [CHROME_TAG],
  revalidate: 60,
});

/** Header + footer text for the public site. Never throws. */
export async function getChrome(): Promise<ChromeContent> {
  if (!hasDatabaseUrl()) return defaultChrome();
  try {
    return await cachedChrome();
  } catch {
    return defaultChrome();
  }
}

export async function getChromeForAdmin(): Promise<{
  content: ChromeContent;
  updated: Partial<Record<ChromeKey, string>>;
  dbError?: string;
}> {
  if (!hasDatabaseUrl()) return { content: defaultChrome(), updated: {}, dbError: "MONGODB_URI is not set." };
  try {
    return await readChrome();
  } catch (e) {
    return { content: defaultChrome(), updated: {}, dbError: e instanceof Error ? e.message : "Could not read the header and footer." };
  }
}

export async function writeChrome(key: ChromeKey, values: SectionValues) {
  await chromeCol().updateOne({ _id: key }, { $set: { values, updatedAt: new Date() } }, { upsert: true });
}

export async function resetChrome(key: ChromeKey) {
  await chromeCol().deleteOne({ _id: key });
}
