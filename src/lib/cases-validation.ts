import type { CaseStudy } from "./site-data";

export type FieldErrors = Record<string, string>;

/** Editable fields as the form submits them (all strings). */
export type CaseValues = {
  title: string;
  slug: string;
  client: string;
  sector: string;
  timeline: string;
  team: string;
  problem: string;
  result: string;
  industryContext: string;
  solution: string;
  /** one "value | label" per line */
  metrics: string;
  /** one "Title | Description" per line */
  modules: string;
  /** one per line */
  approach: string;
  challenges: string;
  results: string;
  integrations: string;
  /** comma or line separated */
  stack: string;
  quote: string;
  quoteName: string;
  quoteRole: string;
  /** "on" when the Published checkbox is ticked, otherwise "" */
  published: string;
};

export const emptyCaseValues = (): CaseValues => ({
  title: "", slug: "", client: "", sector: "", timeline: "", team: "",
  problem: "", result: "", industryContext: "", solution: "",
  metrics: "", modules: "", approach: "", challenges: "", results: "",
  integrations: "", stack: "", quote: "", quoteName: "", quoteRole: "",
  published: "on",
});

/** Stored shape: the public case-study fields plus admin bookkeeping. */
export type CaseRecord = CaseStudy & { published: boolean; order: number };

/** What the form produces: `order` is assigned by the store. */
export type CaseInput = Omit<CaseRecord, "order">;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const FIELDS = [
  "title", "slug", "client", "sector", "timeline", "team", "problem", "result",
  "industryContext", "solution", "metrics", "modules", "approach", "challenges",
  "results", "integrations", "stack", "quote", "quoteName", "quoteRole",
] as const;

export function readCaseValues(formData: FormData): CaseValues {
  const out = { published: formData.get("published") ? "on" : "" } as CaseValues;
  for (const f of FIELDS) out[f] = String(formData.get(f) ?? "").trim();
  out.slug = out.slug.toLowerCase();
  return out;
}

const lines = (raw: string) => raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
const pair = (line: string): [string, string] => {
  const i = line.indexOf("|");
  return i < 0 ? [line.trim(), ""] : [line.slice(0, i).trim(), line.slice(i + 1).trim()];
};

export function toCaseValues(r: CaseRecord): CaseValues {
  return {
    title: r.title, slug: r.slug, client: r.client, sector: r.sector,
    timeline: r.timeline, team: r.team, problem: r.problem, result: r.result,
    industryContext: r.industryContext, solution: r.solution,
    metrics: r.metrics.map((m) => `${m.value} | ${m.label}`).join("\n"),
    modules: r.modules.map((m) => `${m.title} | ${m.desc}`).join("\n"),
    approach: r.approach.join("\n"), challenges: r.challenges.join("\n"),
    results: r.results.join("\n"), integrations: r.integrations.join("\n"),
    stack: r.stack.join(", "),
    quote: r.testimonial.quote, quoteName: r.testimonial.name, quoteRole: r.testimonial.role,
    published: r.published ? "on" : "",
  };
}

export function validateCase(
  v: CaseValues,
  { requireSlug }: { requireSlug: boolean }
): { ok: true; value: CaseInput } | { ok: false; errors: FieldErrors } {
  const e: FieldErrors = {};

  const text = (k: keyof CaseValues, label: string, max: number) => {
    if (!v[k]) e[k] = `${label} is required.`;
    else if (v[k].length > max) e[k] = `${label} must be ${max} characters or fewer.`;
  };
  text("title", "Title", 140);
  text("client", "Client", 120);
  text("sector", "Sector", 60);
  text("timeline", "Timeline", 60);
  text("team", "Team", 60);
  text("problem", "Problem", 600);
  text("result", "Result", 600);
  text("industryContext", "Industry context", 1500);
  text("solution", "Solution", 2000);
  text("quote", "Quote", 800);
  text("quoteName", "Name", 80);
  text("quoteRole", "Role", 120);

  if (requireSlug) {
    if (!v.slug) e.slug = "Slug is required.";
    else if (v.slug.length > 80) e.slug = "Slug must be 80 characters or fewer.";
    else if (!SLUG.test(v.slug)) e.slug = "Use lowercase letters, numbers and single hyphens only.";
  }

  const metrics = lines(v.metrics).map(pair).map(([value, label]) => ({ value, label }));
  if (metrics.length === 0) e.metrics = "Add at least one metric, e.g. “65% | Faster processing”.";
  else if (metrics.length > 6) e.metrics = "Use 6 metrics or fewer.";
  else if (metrics.some((m) => !m.value || !m.label)) e.metrics = "Each line needs a value and a label: “65% | Faster processing”.";
  else if (metrics.some((m) => m.value.length > 20 || m.label.length > 60)) e.metrics = "Value up to 20 characters, label up to 60.";

  const modules = lines(v.modules).map(pair).map(([title, desc]) => ({ title, desc }));
  if (modules.length === 0) e.modules = "Add at least one module, e.g. “KYC | Aadhaar and PAN checks”.";
  else if (modules.length > 20) e.modules = "Use 20 modules or fewer.";
  else if (modules.some((m) => !m.title || !m.desc)) e.modules = "Each line needs a title and a description: “KYC | Aadhaar and PAN checks”.";
  else if (modules.some((m) => m.title.length > 80 || m.desc.length > 300)) e.modules = "Title up to 80 characters, description up to 300.";

  const list = (
    k: "approach" | "challenges" | "results" | "integrations",
    label: string,
    { min, max, item }: { min: number; max: number; item: number }
  ) => {
    const items = lines(v[k]);
    if (items.length < min) e[k] = `Add at least ${min} ${label.toLowerCase()} (one per line).`;
    else if (items.length > max) e[k] = `Use ${max} or fewer.`;
    else if (items.some((i) => i.length > item)) e[k] = `Each line must be ${item} characters or fewer.`;
    return items;
  };
  const approach = list("approach", "Approach steps", { min: 1, max: 10, item: 400 });
  const challenges = list("challenges", "Challenges", { min: 1, max: 10, item: 400 });
  const results = list("results", "Results", { min: 1, max: 10, item: 400 });
  const integrations = list("integrations", "Integrations", { min: 0, max: 20, item: 80 });

  const stack = v.stack.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
  if (stack.length === 0) e.stack = "Add at least one technology.";
  else if (stack.length > 20) e.stack = "Use 20 technologies or fewer.";
  else if (stack.some((s) => s.length > 40)) e.stack = "Each technology must be 40 characters or fewer.";

  if (Object.keys(e).length) return { ok: false, errors: e };
  return {
    ok: true,
    value: {
      slug: v.slug, client: v.client, sector: v.sector, title: v.title,
      problem: v.problem, result: v.result, metrics, stack,
      timeline: v.timeline, team: v.team, approach,
      industryContext: v.industryContext, challenges, solution: v.solution,
      modules, results, integrations,
      testimonial: { quote: v.quote, name: v.quoteName, role: v.quoteRole },
      published: v.published === "on",
    },
  };
}
