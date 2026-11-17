import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { setTexts, type TextOverride } from "@/lib/texts";

const COLLECTION = "texts";
const DOC_ID = "overrides";

export const MAX_OVERRIDES = 3000;
export const MAX_ORIGINAL = 2000;
export const MAX_REPLACEMENT = 4000;

type TextsDoc = { _id: string; items: TextOverride[]; updatedAt: Date; version?: number };
const col = () => getDb().collection<TextsDoc>(COLLECTION);

/** Every saved override. Throws on database errors. */
export async function readTextOverrides(): Promise<TextOverride[]> {
  const doc = await col().findOne({ _id: DOC_ID });
  return cleanItems(doc?.items);
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

/** Keeps the one overrides document well under MongoDB's 16 MB limit. */
export const MAX_BYTES = 12 * 1024 * 1024;

const cleanItems = (items: unknown): TextOverride[] =>
  Array.isArray(items) ? items.filter((i) => typeof i?.o === "string" && typeof i?.r === "string") : [];

/**
 * Applies changes: `r` = a replacement text, `null` = go back to the original.
 * Returns the new full list, or an error when the result would be too big
 * (checked before anything is written). Every save bumps `version`, and a save
 * only lands on the version it read, so two admins saving at once can't drop
 * each other's edits: the loser re-reads and applies its changes again.
 */
export async function applyTextChanges(
  changes: { o: string; r: string | null }[]
): Promise<{ items: TextOverride[]; error?: undefined } | { items?: undefined; error: string }> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const doc = await col().findOne({ _id: DOC_ID });
    const before = cleanItems(doc?.items);
    const map = new Map(before.map((i) => [i.o, i.r]));
    for (const c of changes) {
      if (c.r === null || c.r === c.o) map.delete(c.o);
      else map.set(c.o, c.r);
    }
    const items = [...map].map(([o, r]) => ({ o, r }));
    // Only growth is refused, so an over-the-limit list can still be trimmed.
    if (items.length > MAX_OVERRIDES && items.length > before.length) {
      return { error: `Too many edited texts (limit ${MAX_OVERRIDES}).` };
    }
    const bytes = Buffer.byteLength(JSON.stringify(items));
    if (bytes > MAX_BYTES && bytes > Buffer.byteLength(JSON.stringify(before))) {
      return { error: "The edited texts are too large to save. Shorten or reset some of them." };
    }

    const now = new Date();
    if (!doc) {
      try {
        await col().insertOne({ _id: DOC_ID, items, updatedAt: now, version: 1 });
      } catch (e) {
        if ((e as { code?: number })?.code === 11000) continue; // someone else created it first
        throw e;
      }
    } else {
      const version = typeof doc.version === "number" ? doc.version : undefined;
      const res = await col().updateOne(
        { _id: DOC_ID, version: version ?? { $exists: false } },
        { $set: { items, updatedAt: now, version: (version ?? 0) + 1 } }
      );
      if (res.matchedCount === 0) continue; // changed since we read it: try again
    }
    setTexts(items);
    return { items };
  }
  throw new Error("The texts were being changed by someone else at the same time.");
}

export async function clearTextOverrides() {
  await col().deleteOne({ _id: DOC_ID });
  setTexts([]);
}
