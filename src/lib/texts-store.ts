import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { setTexts, type TextOverride } from "@/lib/texts";

const COLLECTION = "texts";
const DOC_ID = "overrides";

export const MAX_OVERRIDES = 3000;
export const MAX_ORIGINAL = 2000;
export const MAX_REPLACEMENT = 4000;

type TextsDoc = { _id: string; items: TextOverride[]; updatedAt: Date };
const col = () => getDb().collection<TextsDoc>(COLLECTION);

/** Every saved override. Throws on database errors. */
export async function readTextOverrides(): Promise<TextOverride[]> {
  const doc = await col().findOne({ _id: DOC_ID });
  return Array.isArray(doc?.items) ? doc.items.filter((i) => typeof i?.o === "string" && typeof i?.r === "string") : [];
}

/** Loads the saved overrides into this process's lookup. Never throws. */
export async function refreshTexts(): Promise<boolean> {
  if (!hasDatabaseUrl()) return false;
  try {
    setTexts(await readTextOverrides());
    return true;
  } catch {
    return false; // keep what we have; the next refresh retries
  }
}

/**
 * Applies changes: `r` = a replacement text, `null` = go back to the original.
 * Returns the new full list.
 */
export async function applyTextChanges(changes: { o: string; r: string | null }[]): Promise<TextOverride[]> {
  const map = new Map((await readTextOverrides()).map((i) => [i.o, i.r]));
  for (const c of changes) {
    if (c.r === null || c.r === c.o) map.delete(c.o);
    else map.set(c.o, c.r);
  }
  const items = [...map].map(([o, r]) => ({ o, r }));
  await col().updateOne({ _id: DOC_ID }, { $set: { items, updatedAt: new Date() } }, { upsert: true });
  setTexts(items);
  return items;
}

export async function clearTextOverrides() {
  await col().deleteOne({ _id: DOC_ID });
  setTexts([]);
}
