// Text overrides: the admin can replace any line, button label, link or image
// that is written in the page code (Admin → All page text). Server components
// wrap what they render in ukText(...): it returns the admin's replacement when
// there is one for exactly this text, and the original otherwise.
//
// The map lives on globalThis so every bundle in the server process (pages,
// instrumentation, server actions) shares one copy. It is filled by
// texts-sync.ts at start-up, refreshed every 30 s, and updated immediately
// after an admin save. No database code here: this file is safe anywhere.

export type TextOverride = { o: string; r: string };

const g = globalThis as unknown as { __ukTexts?: Map<string, string> };

/** Replaces the whole set of overrides. */
export function setTexts(items: TextOverride[]) {
  g.__ukTexts = new Map(items.map((i) => [i.o, i.r]));
}

/** The text to show for `v`: its override when it has one, else `v` itself. Non-strings pass through. */
export function ukText<T>(v: T): T {
  if (typeof v !== "string") return v;
  const map = g.__ukTexts;
  if (!map || map.size === 0) return v;
  const r = map.get(v);
  return (r === undefined ? v : (r as unknown as T)) as T;
}
