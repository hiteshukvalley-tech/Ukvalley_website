export type FieldErrors = Record<string, string>;

/** Non-empty trimmed lines of a textarea value. */
export const lines = (raw: string) =>
  raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

/** Comma or line separated list, trimmed, empty entries dropped. */
export const csv = (raw: string) =>
  raw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);

/** URL-safe id from free text, e.g. "Do we own the code?" -> "do-we-own-the-code". */
export function slugify(text: string, fallback = "item"): string {
  const s = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
  return s || fallback;
}
