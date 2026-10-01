import type { Solution } from "./solutions-data";

export type FieldErrors = Record<string, string>;

/** Icon keys the public Solutions pages know how to draw. */
export const solutionIcons = [
  "users", "layoutDashboard", "briefcase", "graduationCap", "shoppingBag",
  "calendarCheck", "landmark", "heartPulse", "truck", "building", "utensils",
] as const;

/** Editable fields as the form submits them (all strings). */
export type SolutionValues = {
  name: string;
  slug: string;
  category: string;
  icon: string;
  tagline: string;
  description: string;
  /** paragraphs separated by a blank line */
  longDescription: string;
  /** one "value | label" per line */
  metrics: string;
  /** one "Title | Description" per line */
  features: string;
  /** one per line */
  modules: string;
  /** one "Title | Description" per line */
  workflow: string;
  /** one per line */
  integrations: string;
  /** one "Question | Answer" per line */
  faqs: string;
  /** one per line */
  bestFor: string;
  /** one "Task | Before | After" per line */
  timeSavings: string;
  /** one "Title | Description" per line */
  painPoints: string;
  /** one "Label | Value | Note" per line (note optional) */
  quickFacts: string;
  /** one per line */
  outcomes: string;
  youProvide: string;
  /** service slugs, one per line */
  relatedServices: string;
  /** industry slugs, one per line */
  relatedIndustries: string;
  /** "on" when the Published checkbox is ticked, otherwise "" */
  published: string;
};

export const emptySolutionValues = (): SolutionValues => ({
  name: "", slug: "", category: "", icon: "users", tagline: "", description: "",
  longDescription: "", metrics: "", features: "", modules: "", workflow: "",
  integrations: "", faqs: "", bestFor: "", timeSavings: "", painPoints: "",
  quickFacts: "", outcomes: "", youProvide: "", relatedServices: "",
  relatedIndustries: "", published: "on",
});

/** Stored shape: the public solution fields plus admin bookkeeping. */
export type SolutionRecord = Solution & { published: boolean; order: number };

/** What the form produces: `order` is assigned by the store. */
export type SolutionInput = Omit<SolutionRecord, "order">;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const TEXT_FIELDS = [
  "name", "slug", "category", "icon", "tagline", "description", "longDescription",
  "metrics", "features", "modules", "workflow", "integrations", "faqs", "bestFor",
  "timeSavings", "painPoints", "quickFacts", "outcomes", "youProvide",
] as const;

export function readSolutionValues(formData: FormData): SolutionValues {
  const out = { published: formData.get("published") ? "on" : "" } as SolutionValues;
  for (const f of TEXT_FIELDS) out[f] = String(formData.get(f) ?? "").trim();
  out.slug = out.slug.toLowerCase();
  // Checkbox groups submit one entry per ticked box.
  out.relatedServices = formData.getAll("relatedServices").map(String).join("\n");
  out.relatedIndustries = formData.getAll("relatedIndustries").map(String).join("\n");
  return out;
}

const lines = (raw: string) => raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
const paragraphs = (raw: string) =>
  raw.split(/\r?\n\s*\r?\n/).map((p) => p.replace(/\s*\r?\n\s*/g, " ").trim()).filter(Boolean);
/** Splits "a | b | c" on the first `count - 1` bars, trimming each part. */
const parts = (line: string, count: number): string[] => {
  const out: string[] = [];
  let rest = line;
  for (let i = 0; i < count - 1; i++) {
    const at = rest.indexOf("|");
    if (at < 0) break;
    out.push(rest.slice(0, at).trim());
    rest = rest.slice(at + 1);
  }
  out.push(rest.trim());
  while (out.length < count) out.push("");
  return out;
};

export function toSolutionValues(r: SolutionRecord): SolutionValues {
  return {
    name: r.name, slug: r.slug, category: r.category, icon: r.icon,
    tagline: r.tagline, description: r.description,
    longDescription: r.longDescription.join("\n\n"),
    metrics: r.metrics.map((m) => `${m.value} | ${m.label}`).join("\n"),
    features: r.features.map((f) => `${f.title} | ${f.desc}`).join("\n"),
    modules: r.modules.join("\n"),
    workflow: r.workflow.map((w) => `${w.title} | ${w.desc}`).join("\n"),
    integrations: r.integrations.join("\n"),
    faqs: r.faqs.map((f) => `${f.q} | ${f.a}`).join("\n"),
    bestFor: r.bestFor.join("\n"),
    timeSavings: r.timeSavings.map((t) => `${t.task} | ${t.before} | ${t.after}`).join("\n"),
    painPoints: r.painPoints.map((p) => `${p.title} | ${p.desc}`).join("\n"),
    quickFacts: r.quickFacts.map((q) => `${q.label} | ${q.value}${q.sub ? ` | ${q.sub}` : ""}`).join("\n"),
    outcomes: r.outcomes.join("\n"),
    youProvide: r.youProvide.join("\n"),
    relatedServices: r.relatedServices.join("\n"),
    relatedIndustries: r.relatedIndustries.join("\n"),
    published: r.published ? "on" : "",
  };
}

export function validateSolution(
  v: SolutionValues,
  {
    requireSlug,
    serviceSlugs,
    industrySlugs,
  }: { requireSlug: boolean; serviceSlugs: string[]; industrySlugs: string[] }
): { ok: true; value: SolutionInput } | { ok: false; errors: FieldErrors } {
  const e: FieldErrors = {};

  const text = (k: keyof SolutionValues, label: string, max: number) => {
    if (!v[k]) e[k] = `${label} is required.`;
    else if (v[k].length > max) e[k] = `${label} must be ${max} characters or fewer.`;
  };
  text("name", "Name", 60);
  text("category", "Category", 80);
  text("tagline", "Tagline", 160);
  text("description", "Description", 400);

  if (requireSlug) {
    if (!v.slug) e.slug = "Slug is required.";
    else if (v.slug.length > 60) e.slug = "Slug must be 60 characters or fewer.";
    else if (!SLUG.test(v.slug)) e.slug = "Use lowercase letters, numbers and single hyphens only.";
  }
  if (!(solutionIcons as readonly string[]).includes(v.icon)) e.icon = "Choose one of the listed icons.";

  const longDescription = paragraphs(v.longDescription);
  if (longDescription.length === 0) e.longDescription = "Write at least one paragraph.";
  else if (longDescription.length > 8) e.longDescription = "Use 8 paragraphs or fewer.";
  else if (longDescription.some((p) => p.length > 2000)) e.longDescription = "Each paragraph must be 2000 characters or fewer.";

  // "a | b" style lists: `count` parts, the first `required` must be filled.
  const table = (
    k: "metrics" | "features" | "workflow" | "faqs" | "painPoints" | "timeSavings" | "quickFacts",
    label: string,
    example: string,
    { count, required, min, max, limits }: { count: number; required: number; min: number; max: number; limits: number[] }
  ) => {
    const rows = lines(v[k]).map((l) => parts(l, count));
    if (rows.length < min) e[k] = `Add at least ${min} ${label}, e.g. “${example}”.`;
    else if (rows.length > max) e[k] = `Use ${max} or fewer.`;
    else if (rows.some((r) => r.slice(0, required).some((c) => !c))) e[k] = `Each line needs ${required === count ? "every part" : "the first " + required + " parts"} separated by |, e.g. “${example}”.`;
    else if (rows.some((r) => r.some((c, i) => c.length > limits[i]))) e[k] = `A part is too long (limits: ${limits.join(" / ")} characters).`;
    return rows;
  };

  const metrics = table("metrics", "metric", "0 | Leads dropped", { count: 2, required: 2, min: 1, max: 6, limits: [20, 60] });
  const features = table("features", "feature", "Audit trail | Every change is logged", { count: 2, required: 2, min: 1, max: 12, limits: [80, 300] });
  const workflow = table("workflow", "workflow step", "Discover | We map your process", { count: 2, required: 2, min: 1, max: 8, limits: [80, 300] });
  const faqs = table("faqs", "question", "Can it replace Excel? | Yes, fully.", { count: 2, required: 2, min: 1, max: 10, limits: [200, 800] });
  const painPoints = table("painPoints", "pain point", "Leads get lost | They live in WhatsApp", { count: 2, required: 2, min: 1, max: 8, limits: [100, 400] });
  const timeSavings = table("timeSavings", "time saving", "Quotation | 45 min | 5 min", { count: 3, required: 3, min: 1, max: 10, limits: [120, 60, 60] });
  const quickFacts = table("quickFacts", "fact", "Timeline | 8–12 weeks | For a first release", { count: 3, required: 2, min: 1, max: 8, limits: [40, 80, 120] });

  const list = (
    k: "modules" | "integrations" | "bestFor" | "outcomes" | "youProvide",
    label: string,
    { min, max, item }: { min: number; max: number; item: number }
  ) => {
    const items = lines(v[k]);
    if (items.length < min) e[k] = `Add at least ${min} ${label} (one per line).`;
    else if (items.length > max) e[k] = `Use ${max} or fewer.`;
    else if (items.some((i) => i.length > item)) e[k] = `Each line must be ${item} characters or fewer.`;
    return items;
  };
  const modules = list("modules", "module", { min: 1, max: 16, item: 80 });
  const integrations = list("integrations", "integration", { min: 0, max: 20, item: 60 });
  const bestFor = list("bestFor", "audience", { min: 1, max: 10, item: 80 });
  const outcomes = list("outcomes", "outcome", { min: 1, max: 10, item: 300 });
  const youProvide = list("youProvide", "item", { min: 1, max: 10, item: 200 });

  const relatedServices = lines(v.relatedServices);
  if (relatedServices.some((s) => !serviceSlugs.includes(s))) e.relatedServices = "Choose from the listed services.";
  const relatedIndustries = lines(v.relatedIndustries);
  if (relatedIndustries.some((s) => !industrySlugs.includes(s))) e.relatedIndustries = "Choose from the listed industries.";

  if (Object.keys(e).length) return { ok: false, errors: e };
  return {
    ok: true,
    value: {
      slug: v.slug, name: v.name, category: v.category, icon: v.icon,
      tagline: v.tagline, description: v.description, longDescription,
      metrics: metrics.map(([value, label]) => ({ value, label })),
      features: features.map(([title, desc]) => ({ title, desc })),
      modules,
      workflow: workflow.map(([title, desc]) => ({ title, desc })),
      integrations,
      faqs: faqs.map(([q, a]) => ({ q, a })),
      bestFor, relatedServices, relatedIndustries,
      timeSavings: timeSavings.map(([task, before, after]) => ({ task, before, after })),
      painPoints: painPoints.map(([title, desc]) => ({ title, desc })),
      quickFacts: quickFacts.map(([label, value, sub]) => (sub ? { label, value, sub } : { label, value })),
      outcomes, youProvide,
      published: v.published === "on",
    },
  };
}
