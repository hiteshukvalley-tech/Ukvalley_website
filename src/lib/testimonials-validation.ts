import type { Testimonial } from "./site-data";

export type { Testimonial };
import { type FieldErrors } from "./list-utils";

export type { FieldErrors };

/** Editable fields as the form submits them (all strings). */
export type TestimonialValues = {
  name: string;
  title: string;
  company: string;
  quote: string;
  /** "on" when the Published checkbox is ticked, otherwise "" */
  published: string;
};

export const emptyTestimonialValues = (): TestimonialValues => ({ name: "", title: "", company: "", quote: "", published: "on" });

/**
 * Stored shape. The public data has no id, so `slug` is an internal id made
 * from the text when the item is created; it never changes afterwards.
 */
export type TestimonialRecord = Testimonial & { slug: string; published: boolean; order: number };

/** What the form produces: the id and order are assigned by the store. */
export type TestimonialInput = Omit<TestimonialRecord, "order" | "slug">;

const FIELDS = ["name", "title", "company", "quote"] as const;

export function readTestimonialValues(formData: FormData): TestimonialValues {
  const out = { published: formData.get("published") ? "on" : "" } as TestimonialValues;
  for (const f of FIELDS) out[f] = String(formData.get(f) ?? "").trim();
  return out;
}

export function toTestimonialValues(r: TestimonialRecord): TestimonialValues {
  return {
    name: r.name,
    title: r.title,
    company: r.company,
    quote: r.quote,
    published: r.published ? "on" : "",
  };
}

export function validateTestimonial(
  v: TestimonialValues
): { ok: true; value: TestimonialInput } | { ok: false; errors: FieldErrors } {
  const e: FieldErrors = {};

  const text = (k: keyof TestimonialValues, label: string, max: number) => {
    if (!v[k]) e[k] = `${label} is required.`;
    else if (v[k].length > max) e[k] = `${label} must be ${max} characters or fewer.`;
  };
  text("name", "Name", 60);
  text("title", "Job title", 60);
  text("company", "Company", 80);
  text("quote", "Quote", 500);

  if (Object.keys(e).length) return { ok: false, errors: e };
  return {
    ok: true,
    value: {
      name: v.name,
      title: v.title,
      company: v.company,
      quote: v.quote,
      published: v.published === "on",
    },
  };
}
