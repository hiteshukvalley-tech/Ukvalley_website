import type { Career } from "./site-data";

export type FieldErrors = Record<string, string>;

/** Editable fields as the form submits them (all strings). */
export type CareerValues = {
  role: string;
  slug: string;
  location: string;
  type: string;
  summary: string;
  /** one per line */
  responsibilities: string;
  /** one per line */
  requirements: string;
  /** one per line */
  perks: string;
  /** "on" when the Published checkbox is ticked, otherwise "" */
  published: string;
};


export const emptyCareerValues = (): CareerValues => ({
  role: "", slug: "", location: "Remote (India)", type: "Full-time", summary: "",
  responsibilities: "", requirements: "", perks: "", published: "on",
});

/** Stored shape: the public career fields plus admin bookkeeping. */
export type CareerRecord = Career & { published: boolean; order: number };

/** What the form produces: `order` is assigned by the store. */
export type CareerInput = Omit<CareerRecord, "order">;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const FIELDS = [
  "role", "slug", "location", "type", "summary", "responsibilities", "requirements", "perks",
] as const;

export function readCareerValues(formData: FormData): CareerValues {
  const out = { published: formData.get("published") ? "on" : "" } as CareerValues;
  for (const f of FIELDS) out[f] = String(formData.get(f) ?? "").trim();
  out.slug = out.slug.toLowerCase();
  return out;
}

const lines = (raw: string) => raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

export function toCareerValues(c: CareerRecord): CareerValues {
  return {
    role: c.role, slug: c.slug, location: c.location, type: c.type, summary: c.summary,
    responsibilities: c.responsibilities.join("\n"),
    requirements: c.requirements.join("\n"),
    perks: c.perks.join("\n"),
    published: c.published ? "on" : "",
  };
}

export function validateCareer(
  v: CareerValues,
  { requireSlug }: { requireSlug: boolean }
): { ok: true; value: CareerInput } | { ok: false; errors: FieldErrors } {
  const e: FieldErrors = {};

  const text = (k: keyof CareerValues, label: string, max: number) => {
    if (!v[k]) e[k] = `${label} is required.`;
    else if (v[k].length > max) e[k] = `${label} must be ${max} characters or fewer.`;
  };
  text("role", "Role", 80);
  text("location", "Location", 60);
  text("type", "Type", 30);
  text("summary", "Summary", 300);

  if (requireSlug) {
    if (!v.slug) e.slug = "Slug is required.";
    else if (v.slug.length > 80) e.slug = "Slug must be 80 characters or fewer.";
    else if (!SLUG.test(v.slug)) e.slug = "Use lowercase letters, numbers and single hyphens only.";
  }

  const list = (k: "responsibilities" | "requirements" | "perks", label: string, max: number) => {
    const items = lines(v[k]);
    if (items.length === 0) e[k] = `Add at least one ${label}.`;
    else if (items.length > max) e[k] = `Use ${max} or fewer.`;
    else if (items.some((s) => s.length > 300)) e[k] = "Each line must be 300 characters or fewer.";
    return items;
  };
  const responsibilities = list("responsibilities", "responsibility", 10);
  const requirements = list("requirements", "requirement", 10);
  const perks = list("perks", "perk", 10);

  if (Object.keys(e).length) return { ok: false, errors: e };
  return {
    ok: true,
    value: {
      slug: v.slug, role: v.role, location: v.location, type: v.type, summary: v.summary,
      responsibilities, requirements, perks,
      published: v.published === "on",
    },
  };
}
