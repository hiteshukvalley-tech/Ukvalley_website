// Text overrides: the admin can replace any line, button label, link or image
// that is written in the page code (Admin → All page text). Server components
// wrap what they render in ukText(...): it returns the admin's replacement when
// there is one for exactly this text, and the original otherwise.
//
// The map lives on globalThis so every bundle in the server process (pages,
// instrumentation, server actions) shares one copy. It is filled by
// texts-store.ts (via instrumentation.ts) at start-up, refreshed every 30 s,
// and updated immediately after an admin save. In the browser, TextsProvider
// fills it from the snapshot the layout sends, so client components get the
// same text. No database code here: this file is safe anywhere.

export type TextOverride = { o: string; r: string };

const g = globalThis as unknown as { __ukTexts?: Map<string, string> };

/** Replaces the whole set of overrides. */
export function setTexts(items: TextOverride[]) {
  g.__ukTexts = new Map(items.map((i) => [i.o, i.r]));
}

let clientSnapshot: Record<string, string> | null = null;

/**
 * Browser only: loads the snapshot from TextsProvider into the map (once per
 * snapshot). Does nothing on the server, where the map is the live one.
 */
export function loadClientTexts(snapshot: Record<string, string>) {
  if (typeof window === "undefined" || clientSnapshot === snapshot) return;
  clientSnapshot = snapshot;
  setTexts(Object.entries(snapshot).map(([o, r]) => ({ o, r })));
}

/** The text to show for `v`: its override when it has one, else `v` itself. Non-strings pass through. */
export function ukText<T>(v: T): T {
  if (typeof v !== "string") return v;
  const map = g.__ukTexts;
  if (!map || map.size === 0) return v;
  const r = map.get(v);
  return (r === undefined ? v : (r as unknown as T)) as T;
}

/** The current overrides as a plain object, for client components (see TextsProvider). */
export function textsSnapshot(): Record<string, string> {
  const map = g.__ukTexts;
  if (!map || map.size === 0) return {};
  const out: Record<string, string> = {};
  // every override the admin can save (texts-store MAX_ORIGINAL), so long
  // paragraphs replaced there also change in client components
  for (const [o, r] of map) if (o.length <= 2000) out[o] = r;
  return out;
}
