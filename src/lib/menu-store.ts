import { unstable_cache } from "next/cache";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { mergeValues } from "@/lib/home-store";
import type { SectionValues } from "@/lib/home-schema";
import {
  MAIN_PAGE_DEF, defaultMenu, isMainPageSlug, newMainPage, type MainPageContent, type MenuItem,
} from "@/lib/menu-schema";

export const MENU_TAG = "main-menu";
const MENU_COLLECTION = "menu";
const PAGES_COLLECTION = "mainpages";
const MENU_ID = "main";

type MenuDoc = { _id: string; items: MenuItem[]; updatedAt: Date };
type MainPageDoc = { _id: string; values: SectionValues; updatedAt: Date };

const menuCol = () => getDb().collection<MenuDoc>(MENU_COLLECTION);
const pageCol = () => getDb().collection<MainPageDoc>(PAGES_COLLECTION);

/** Saved items, with any built-in item missing from them put back (hidden). */
function withBuiltIns(saved: MenuItem[] | undefined): MenuItem[] {
  if (!saved?.length) return defaultMenu;
  const items = [...saved];
  for (const d of defaultMenu) {
    if (items.some((i) => i.id === d.id)) continue;
    // Careers is a main menu item of its own, right after Company. Menus saved
    // before it existed get it there, shown; other missing items return hidden.
    if (d.id === "careers") {
      const at = items.findIndex((i) => i.id === "company");
      items.splice(at >= 0 ? at + 1 : items.length, 0, d);
    } else items.push({ ...d, visible: false });
  }
  return items;
}

async function readItems(): Promise<{ items: MenuItem[]; updatedAt: string | null }> {
  const doc = await menuCol().findOne({ _id: MENU_ID });
  return { items: withBuiltIns(doc?.items), updatedAt: doc?.updatedAt?.toISOString() ?? null };
}

// Throws on DB errors so a failure is never cached; the getter falls back.
const cachedItems = unstable_cache(async () => (await readItems()).items, ["main-menu-v1"], {
  tags: [MENU_TAG],
  revalidate: 60,
});

/** The main menu for the public site. Never throws. */
export async function getMenu(): Promise<MenuItem[]> {
  if (!hasDatabaseUrl()) return defaultMenu;
  try {
    return await cachedItems();
  } catch {
    return defaultMenu;
  }
}

export type MainPageSummary = { slug: string; name: string };

export async function getMenuForAdmin(): Promise<{
  items: MenuItem[];
  updatedAt: string | null;
  pages: MainPageSummary[];
  dbError?: string;
}> {
  if (!hasDatabaseUrl()) return { items: defaultMenu, updatedAt: null, pages: [], dbError: "MONGODB_URI is not set." };
  try {
    const [{ items, updatedAt }, docs] = await Promise.all([readItems(), pageCol().find({}).toArray()]);
    const pages = docs.map((d) => ({
      slug: d._id,
      name: typeof d.values?.adminName === "string" && d.values.adminName ? d.values.adminName : d._id,
    }));
    return { items, updatedAt, pages };
  } catch (e) {
    return { items: defaultMenu, updatedAt: null, pages: [], dbError: e instanceof Error ? e.message : "Could not read the menu." };
  }
}

export async function writeMenu(items: MenuItem[]) {
  await menuCol().updateOne({ _id: MENU_ID }, { $set: { items, updatedAt: new Date() } }, { upsert: true });
}

export async function resetMenu() {
  await menuCol().deleteOne({ _id: MENU_ID });
}

const rand = (n: number) => Math.random().toString(36).slice(2, 2 + n).padEnd(n, "0");
const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30) || "section";

export type NewSectionKind = "page" | "dropdown" | "link";

/** Adds a main-menu section at the end (next to Insights). Returns where to edit it. */
export async function createMainSection(name: string, kind: NewSectionKind, icon = ""): Promise<{ slug?: string }> {
  const { items } = await readItems();
  let item: MenuItem = { id: `m-${rand(8)}`, label: name.slice(0, 24), type: "link", href: "/", links: [], visible: true };
  let slug: string | undefined;
  if (kind === "page") {
    slug = slugify(name);
    if (await pageCol().findOne({ _id: slug }, { projection: { _id: 1 } })) slug = `${slug}-${rand(4)}`;
    await pageCol().insertOne({
      _id: slug,
      values: newMainPage(name) as unknown as SectionValues,
      updatedAt: new Date(),
    });
    item = { ...item, type: "link", href: `/s/${slug}` };
  } else if (kind === "dropdown") {
    item = { ...item, type: "dropdown", href: "", links: [{ label: "Home", href: "/" }] };
  }
  if (icon) item = { ...item, icon };
  await writeMenu([...items, item]);
  return { slug };
}

/* ── Pages behind added main sections (/s/<slug>) ─────────────────── */

const toContent = (saved?: SectionValues) =>
  mergeValues(MAIN_PAGE_DEF, newMainPage("") as unknown as SectionValues, saved) as unknown as MainPageContent;

const cachedPage = unstable_cache(
  async (slug: string) => {
    const doc = await pageCol().findOne({ _id: slug });
    return doc ? toContent(doc.values) : null;
  },
  ["main-page-v1"],
  { tags: [MENU_TAG], revalidate: 60 }
);

/** One added section's page for the public site; null when it doesn't exist. Never throws. */
export async function getMainPage(slug: string): Promise<MainPageContent | null> {
  if (!hasDatabaseUrl() || !isMainPageSlug(slug)) return null;
  try {
    return await cachedPage(slug);
  } catch {
    return null;
  }
}

export async function getMainPageForAdmin(slug: string): Promise<{ content: MainPageContent | null; updatedAt: string | null; dbError?: string }> {
  if (!hasDatabaseUrl()) return { content: null, updatedAt: null, dbError: "MONGODB_URI is not set." };
  try {
    const doc = await pageCol().findOne({ _id: slug });
    return { content: doc ? toContent(doc.values) : null, updatedAt: doc?.updatedAt?.toISOString() ?? null };
  } catch (e) {
    return { content: null, updatedAt: null, dbError: e instanceof Error ? e.message : "Could not read the page." };
  }
}

/** Updates an existing page only. Returns false when it is gone. */
export async function writeMainPage(slug: string, values: SectionValues): Promise<boolean> {
  const res = await pageCol().updateOne({ _id: slug }, { $set: { values, updatedAt: new Date() } });
  return res.matchedCount > 0;
}

/** Deletes the page and the menu item(s) that link to it. */
export async function deleteMainPage(slug: string) {
  await pageCol().deleteOne({ _id: slug });
  const { items } = await readItems();
  const kept = items.filter((i) => !(i.type === "link" && i.href === `/s/${slug}`));
  if (kept.length !== items.length) await writeMenu(kept.length ? kept : defaultMenu);
}

export async function listMainSlugs(): Promise<string[]> {
  if (!hasDatabaseUrl()) return [];
  try {
    return (await pageCol().find({}, { projection: { _id: 1 } }).toArray()).map((d) => d._id);
  } catch {
    return [];
  }
}
