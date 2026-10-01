import type { engagementModels } from "./site-data";

export type EngagementModel = (typeof engagementModels)[number];
import { lines, type FieldErrors } from "./list-utils";

export type { FieldErrors };

/** Editable fields as the form submits them (all strings). */
export type EngagementModelValues = {
  name: string;
  best: string;
  desc: string;
  /** one per line */
  bullets: string;
  /** "on" when the Published checkbox is ticked, otherwise "" */
  published: string;
};

export const emptyEngagementModelValues = (): EngagementModelValues => ({ name: "", best: "", desc: "", bullets: "", published: "on" });

/**
 * Stored shape. The public data has no id, so `slug` is an internal id made
 * from the text when the item is created; it never changes afterwards.
 */
export type EngagementModelRecord = EngagementModel & { slug: string; published: boolean; order: number };

/** What the form produces: the id and order are assigned by the store. */
export type EngagementModelInput = Omit<EngagementModelRecord, "order" | "slug">;

const FIELDS = ["name", "best", "desc", "bullets"] as const;

export function readEngagementModelValues(formData: FormData): EngagementModelValues {
  const out = { published: formData.get("published") ? "on" : "" } as EngagementModelValues;
  for (const f of FIELDS) out[f] = String(formData.get(f) ?? "").trim();
  return out;
}

export function toEngagementModelValues(r: EngagementModelRecord): EngagementModelValues {
  return {
    name: r.name,
    best: r.best,
    desc: r.desc,
    bullets: r.bullets.join("\n"),
    published: r.published ? "on" : "",
  };
}

export function validateEngagementModel(
  v: EngagementModelValues
): { ok: true; value: EngagementModelInput } | { ok: false; errors: FieldErrors } {
  const e: FieldErrors = {};

  const text = (k: keyof EngagementModelValues, label: string, max: number) => {
    if (!v[k]) e[k] = `${label} is required.`;
    else if (v[k].length > max) e[k] = `${label} must be ${max} characters or fewer.`;
  };
  text("name", "Name", 60);
  text("best", "Best for", 40);
  text("desc", "Description", 400);
  const bullets = lines(v.bullets);
  if (bullets.length === 0) e.bullets = "Add at least one bullet.";
  else if (bullets.length > 8) e.bullets = "Use 8 or fewer.";
  else if (bullets.some((s) => s.length > 80)) e.bullets = "Each line must be 80 characters or fewer.";

  if (Object.keys(e).length) return { ok: false, errors: e };
  return {
    ok: true,
    value: {
      name: v.name,
      best: v.best,
      desc: v.desc,
      bullets,
      published: v.published === "on",
    },
  };
}
