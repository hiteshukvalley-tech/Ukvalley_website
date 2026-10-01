import type { TechCategory } from "./site-core";

export type { TechCategory };
import { csv, type FieldErrors } from "./list-utils";

export type { FieldErrors };

/** Icon keys the public Tech stack cards know how to draw. */
export const techIcons = ["monitor", "smartphone", "server", "database", "cloud", "flaskConical"] as const;

/** Editable fields as the form submits them (all strings). */
export type TechCategoryValues = {
  label: string;
  icon: string;
  /** comma or line separated */
  items: string;
  why: string;
  /** "on" when the Published checkbox is ticked, otherwise "" */
  published: string;
};

export const emptyTechCategoryValues = (): TechCategoryValues => ({ label: "", icon: "monitor", items: "", why: "", published: "on" });

/**
 * Stored shape. The public data has no id, so `slug` is an internal id made
 * from the text when the item is created; it never changes afterwards.
 */
export type TechCategoryRecord = TechCategory & { slug: string; published: boolean; order: number };

/** What the form produces: the id and order are assigned by the store. */
export type TechCategoryInput = Omit<TechCategoryRecord, "order" | "slug">;

const FIELDS = ["label", "icon", "items", "why"] as const;

export function readTechCategoryValues(formData: FormData): TechCategoryValues {
  const out = { published: formData.get("published") ? "on" : "" } as TechCategoryValues;
  for (const f of FIELDS) out[f] = String(formData.get(f) ?? "").trim();
  return out;
}

export function toTechCategoryValues(r: TechCategoryRecord): TechCategoryValues {
  return {
    label: r.label,
    icon: r.icon,
    items: r.items.join(", "),
    why: r.why,
    published: r.published ? "on" : "",
  };
}

export function validateTechCategory(
  v: TechCategoryValues
): { ok: true; value: TechCategoryInput } | { ok: false; errors: FieldErrors } {
  const e: FieldErrors = {};

  const text = (k: keyof TechCategoryValues, label: string, max: number) => {
    if (!v[k]) e[k] = `${label} is required.`;
    else if (v[k].length > max) e[k] = `${label} must be ${max} characters or fewer.`;
  };
  text("label", "Label", 40);
  if (!(techIcons as readonly string[]).includes(v.icon)) e.icon = "Choose one of the listed options.";
  const items = csv(v.items);
  if (items.length === 0) e.items = "Add at least one technology.";
  else if (items.length > 20) e.items = "Use 20 or fewer.";
  else if (items.some((s) => s.length > 40)) e.items = "Each technology must be 40 characters or fewer.";
  text("why", "Why it matters", 600);

  if (Object.keys(e).length) return { ok: false, errors: e };
  return {
    ok: true,
    value: {
      label: v.label,
      icon: v.icon,
      items,
      why: v.why,
      published: v.published === "on",
    },
  };
}
