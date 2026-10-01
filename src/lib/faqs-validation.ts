export type Faq = { q: string; a: string };
import { type FieldErrors } from "./list-utils";

export type { FieldErrors };

/** Editable fields as the form submits them (all strings). */
export type FaqValues = {
  q: string;
  a: string;
  /** "on" when the Published checkbox is ticked, otherwise "" */
  published: string;
};

export const emptyFaqValues = (): FaqValues => ({ q: "", a: "", published: "on" });

/**
 * Stored shape. The public data has no id, so `slug` is an internal id made
 * from the text when the item is created; it never changes afterwards.
 */
export type FaqRecord = Faq & { slug: string; published: boolean; order: number };

/** What the form produces: the id and order are assigned by the store. */
export type FaqInput = Omit<FaqRecord, "order" | "slug">;

const FIELDS = ["q", "a"] as const;

export function readFaqValues(formData: FormData): FaqValues {
  const out = { published: formData.get("published") ? "on" : "" } as FaqValues;
  for (const f of FIELDS) out[f] = String(formData.get(f) ?? "").trim();
  return out;
}

export function toFaqValues(r: FaqRecord): FaqValues {
  return {
    q: r.q,
    a: r.a,
    published: r.published ? "on" : "",
  };
}

export function validateFaq(
  v: FaqValues
): { ok: true; value: FaqInput } | { ok: false; errors: FieldErrors } {
  const e: FieldErrors = {};

  const text = (k: keyof FaqValues, label: string, max: number) => {
    if (!v[k]) e[k] = `${label} is required.`;
    else if (v[k].length > max) e[k] = `${label} must be ${max} characters or fewer.`;
  };
  text("q", "Question", 200);
  text("a", "Answer", 1500);

  if (Object.keys(e).length) return { ok: false, errors: e };
  return {
    ok: true,
    value: {
      q: v.q,
      a: v.a,
      published: v.published === "on",
    },
  };
}
