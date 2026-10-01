import type { Product } from "./site-data";

export type FieldErrors = Record<string, string>;

/** Editable fields as the form submits them (all strings). */
export type ProductValues = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  platform: string;
  audience: string;
  /** one per line */
  highlights: string;
  /** paragraphs separated by a blank line */
  problem: string;
  /** one "Title | Description" per line */
  features: string;
  /** one per line */
  outcomes: string;
  useCases: string;
  /** comma or line separated */
  stack: string;
  /** one "Question | Answer" per line */
  faqs: string;
  metricValue: string;
  metricLabel: string;
  /** "on" when the Published checkbox is ticked, otherwise "" */
  published: string;
};

export const emptyProductValues = (): ProductValues => ({
  name: "", slug: "", tagline: "", description: "", platform: "", audience: "",
  highlights: "", problem: "", features: "", outcomes: "", useCases: "",
  stack: "", faqs: "", metricValue: "", metricLabel: "", published: "on",
});

/** Stored shape: the public product fields plus admin bookkeeping. */
export type ProductRecord = Product & { published: boolean; order: number };

/** What the form produces: `order` is assigned by the store. */
export type ProductInput = Omit<ProductRecord, "order">;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const FIELDS = [
  "name", "slug", "tagline", "description", "platform", "audience", "highlights",
  "problem", "features", "outcomes", "useCases", "stack", "faqs", "metricValue", "metricLabel",
] as const;

export function readProductValues(formData: FormData): ProductValues {
  const out = { published: formData.get("published") ? "on" : "" } as ProductValues;
  for (const f of FIELDS) out[f] = String(formData.get(f) ?? "").trim();
  out.slug = out.slug.toLowerCase();
  return out;
}

const lines = (raw: string) => raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
const paragraphs = (raw: string) =>
  raw.split(/\r?\n\s*\r?\n/).map((p) => p.replace(/\s*\r?\n\s*/g, " ").trim()).filter(Boolean);
const pair = (line: string): [string, string] => {
  const i = line.indexOf("|");
  return i < 0 ? [line.trim(), ""] : [line.slice(0, i).trim(), line.slice(i + 1).trim()];
};

export function toProductValues(r: ProductRecord): ProductValues {
  return {
    name: r.name, slug: r.slug, tagline: r.tagline, description: r.description,
    platform: r.platform, audience: r.audience,
    highlights: r.highlights.join("\n"),
    problem: r.problem.join("\n\n"),
    features: r.features.map((f) => `${f.title} | ${f.desc}`).join("\n"),
    outcomes: r.outcomes.join("\n"),
    useCases: r.useCases.join("\n"),
    stack: r.stack.join(", "),
    faqs: r.faqs.map((f) => `${f.q} | ${f.a}`).join("\n"),
    metricValue: r.metric?.value ?? "", metricLabel: r.metric?.label ?? "",
    published: r.published ? "on" : "",
  };
}

export function validateProduct(
  v: ProductValues,
  { requireSlug }: { requireSlug: boolean }
): { ok: true; value: ProductInput } | { ok: false; errors: FieldErrors } {
  const e: FieldErrors = {};

  const text = (k: keyof ProductValues, label: string, max: number) => {
    if (!v[k]) e[k] = `${label} is required.`;
    else if (v[k].length > max) e[k] = `${label} must be ${max} characters or fewer.`;
  };
  text("name", "Name", 60);
  text("tagline", "Tagline", 100);
  text("description", "Description", 400);
  text("platform", "Platform", 80);
  text("audience", "Audience", 120);

  if (requireSlug) {
    if (!v.slug) e.slug = "Slug is required.";
    else if (v.slug.length > 60) e.slug = "Slug must be 60 characters or fewer.";
    else if (!SLUG.test(v.slug)) e.slug = "Use lowercase letters, numbers and single hyphens only.";
  }

  const list = (
    k: "highlights" | "outcomes" | "useCases",
    label: string,
    { max, item }: { max: number; item: number }
  ) => {
    const items = lines(v[k]);
    if (items.length === 0) e[k] = `Add at least one ${label} (one per line).`;
    else if (items.length > max) e[k] = `Use ${max} or fewer.`;
    else if (items.some((i) => i.length > item)) e[k] = `Each line must be ${item} characters or fewer.`;
    return items;
  };
  const highlights = list("highlights", "highlight", { max: 8, item: 50 });
  const outcomes = list("outcomes", "outcome", { max: 8, item: 300 });
  const useCases = list("useCases", "use case", { max: 8, item: 120 });

  const problem = paragraphs(v.problem);
  if (problem.length === 0) e.problem = "Write at least one paragraph.";
  else if (problem.length > 5) e.problem = "Use 5 paragraphs or fewer.";
  else if (problem.some((p) => p.length > 1500)) e.problem = "Each paragraph must be 1500 characters or fewer.";

  const features = lines(v.features).map(pair).map(([title, desc]) => ({ title, desc }));
  if (features.length === 0) e.features = "Add at least one feature, e.g. “CRM sync | Two-way sync with your CRM”.";
  else if (features.length > 12) e.features = "Use 12 features or fewer.";
  else if (features.some((f) => !f.title || !f.desc)) e.features = "Each line needs a title and a description: “CRM sync | Two-way sync with your CRM”.";
  else if (features.some((f) => f.title.length > 80 || f.desc.length > 300)) e.features = "Title up to 80 characters, description up to 300.";

  const faqs = lines(v.faqs).map(pair).map(([q, a]) => ({ q, a }));
  if (faqs.length === 0) e.faqs = "Add at least one question, e.g. “Does it work offline? | Yes, it syncs later.”";
  else if (faqs.length > 10) e.faqs = "Use 10 questions or fewer.";
  else if (faqs.some((f) => !f.q || !f.a)) e.faqs = "Each line needs a question and an answer, separated by |.";
  else if (faqs.some((f) => f.q.length > 200 || f.a.length > 800)) e.faqs = "Question up to 200 characters, answer up to 800.";

  const stack = v.stack.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
  if (stack.length === 0) e.stack = "Add at least one technology.";
  else if (stack.length > 15) e.stack = "Use 15 technologies or fewer.";
  else if (stack.some((s) => s.length > 40)) e.stack = "Each technology must be 40 characters or fewer.";

  // The headline metric is optional, but it needs both parts.
  let metric: Product["metric"];
  if (v.metricValue || v.metricLabel) {
    if (!v.metricValue) e.metricValue = "Enter the value too, e.g. 60%.";
    else if (v.metricValue.length > 20) e.metricValue = "Value must be 20 characters or fewer.";
    if (!v.metricLabel) e.metricLabel = "Enter the label too, e.g. Lower telephony cost.";
    else if (v.metricLabel.length > 60) e.metricLabel = "Label must be 60 characters or fewer.";
    metric = { value: v.metricValue, label: v.metricLabel };
  }

  if (Object.keys(e).length) return { ok: false, errors: e };
  return {
    ok: true,
    value: {
      name: v.name, slug: v.slug, tagline: v.tagline, description: v.description,
      highlights, platform: v.platform, audience: v.audience, problem, features,
      outcomes, useCases, stack, faqs,
      ...(metric ? { metric } : {}),
      published: v.published === "on",
    },
  };
}
