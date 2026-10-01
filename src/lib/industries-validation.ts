import type { Industry } from "./site-data";

export type FieldErrors = Record<string, string>;

/** Icon keys the public Industries pages know how to draw. */
export const industryIcons = [
  "landmark", "heartPulse", "shoppingBag", "building", "factory", "truck", "wheat",
  "users", "hardHat", "graduationCap", "plane", "clapperboard", "zap",
  "heartHandshake", "briefcase",
] as const;

/** Editable fields as the form submits them (all strings). */
export type IndustryValues = {
  name: string;
  slug: string;
  icon: string;
  blurb: string;
  /** paragraphs separated by a blank line */
  overview: string;
  /** one per line */
  challenges: string;
  compliance: string;
  outcomes: string;
  /** one "Title | Description" per line */
  deliverables: string;
  /** one "Question | Answer" per line */
  faqs: string;
  /** one "value | label" per line (optional) */
  proof: string;
  /** optional link to a case study */
  featuredCaseTitle: string;
  featuredCaseHref: string;
  /** "on" when the Published checkbox is ticked, otherwise "" */
  published: string;
};

export const emptyIndustryValues = (): IndustryValues => ({
  name: "", slug: "", icon: "briefcase", blurb: "", overview: "", challenges: "",
  compliance: "", outcomes: "", deliverables: "", faqs: "", proof: "",
  featuredCaseTitle: "", featuredCaseHref: "", published: "on",
});

/** Stored shape: the public industry fields plus admin bookkeeping. */
export type IndustryRecord = Industry & { published: boolean; order: number };

/** What the form produces: `order` is assigned by the store. */
export type IndustryInput = Omit<IndustryRecord, "order">;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const FIELDS = [
  "name", "slug", "icon", "blurb", "overview", "challenges", "compliance", "outcomes",
  "deliverables", "faqs", "proof", "featuredCaseTitle", "featuredCaseHref",
] as const;

export function readIndustryValues(formData: FormData): IndustryValues {
  const out = { published: formData.get("published") ? "on" : "" } as IndustryValues;
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

export function toIndustryValues(r: IndustryRecord): IndustryValues {
  return {
    name: r.name, slug: r.slug, icon: r.icon, blurb: r.blurb,
    overview: r.overview.join("\n\n"),
    challenges: r.challenges.join("\n"),
    compliance: r.compliance.join("\n"),
    outcomes: r.outcomes.join("\n"),
    deliverables: r.deliverables.map((d) => `${d.title} | ${d.desc}`).join("\n"),
    faqs: r.faqs.map((f) => `${f.q} | ${f.a}`).join("\n"),
    proof: (r.proof ?? []).map((p) => `${p.value} | ${p.label}`).join("\n"),
    featuredCaseTitle: r.featuredCase?.title ?? "",
    featuredCaseHref: r.featuredCase?.href ?? "",
    published: r.published ? "on" : "",
  };
}

export function validateIndustry(
  v: IndustryValues,
  { requireSlug }: { requireSlug: boolean }
): { ok: true; value: IndustryInput } | { ok: false; errors: FieldErrors } {
  const e: FieldErrors = {};

  const text = (k: keyof IndustryValues, label: string, max: number) => {
    if (!v[k]) e[k] = `${label} is required.`;
    else if (v[k].length > max) e[k] = `${label} must be ${max} characters or fewer.`;
  };
  text("name", "Name", 60);
  text("blurb", "Summary", 400);

  if (requireSlug) {
    if (!v.slug) e.slug = "Slug is required.";
    else if (v.slug.length > 60) e.slug = "Slug must be 60 characters or fewer.";
    else if (!SLUG.test(v.slug)) e.slug = "Use lowercase letters, numbers and single hyphens only.";
  }
  if (!(industryIcons as readonly string[]).includes(v.icon)) e.icon = "Choose one of the listed icons.";

  const overview = paragraphs(v.overview);
  if (overview.length === 0) e.overview = "Write at least one paragraph.";
  else if (overview.length > 5) e.overview = "Use 5 paragraphs or fewer.";
  else if (overview.some((p) => p.length > 1500)) e.overview = "Each paragraph must be 1500 characters or fewer.";

  const list = (
    k: "challenges" | "compliance" | "outcomes",
    label: string,
    { max, item }: { max: number; item: number }
  ) => {
    const items = lines(v[k]);
    if (items.length === 0) e[k] = `Add at least one ${label} (one per line).`;
    else if (items.length > max) e[k] = `Use ${max} or fewer.`;
    else if (items.some((i) => i.length > item)) e[k] = `Each line must be ${item} characters or fewer.`;
    return items;
  };
  const challenges = list("challenges", "challenge", { max: 8, item: 300 });
  const compliance = list("compliance", "compliance item", { max: 10, item: 120 });
  const outcomes = list("outcomes", "outcome", { max: 8, item: 80 });

  const table = (
    k: "deliverables" | "faqs" | "proof",
    label: string,
    example: string,
    { min, max, limits }: { min: number; max: number; limits: [number, number] }
  ) => {
    const rows = lines(v[k]).map(pair);
    if (rows.length < min) e[k] = `Add at least ${min} ${label}, e.g. “${example}”.`;
    else if (rows.length > max) e[k] = `Use ${max} or fewer.`;
    else if (rows.some(([a, b]) => !a || !b)) e[k] = `Each line needs two parts separated by |, e.g. “${example}”.`;
    else if (rows.some(([a, b]) => a.length > limits[0] || b.length > limits[1])) e[k] = `A part is too long (limits: ${limits.join(" / ")} characters).`;
    return rows;
  };
  const deliverables = table("deliverables", "system", "Loan origination | Intake, KYC and approvals", { min: 1, max: 10, limits: [80, 300] });
  const faqs = table("faqs", "question", "How long does it take? | About 8 weeks.", { min: 1, max: 10, limits: [200, 800] });
  const proof = table("proof", "proof point", "65% | Faster loan processing", { min: 0, max: 4, limits: [20, 60] });

  // The featured case study link is optional, but needs both parts.
  let featuredCase: Industry["featuredCase"];
  if (v.featuredCaseTitle || v.featuredCaseHref) {
    if (!v.featuredCaseTitle) e.featuredCaseTitle = "Enter the title too.";
    else if (v.featuredCaseTitle.length > 140) e.featuredCaseTitle = "Title must be 140 characters or fewer.";
    if (!v.featuredCaseHref) e.featuredCaseHref = "Enter the link too, e.g. /case-studies/loan-origination-nbfc.";
    else if (!/^\/(?!\/)/.test(v.featuredCaseHref) && !/^https?:\/\//.test(v.featuredCaseHref)) {
      e.featuredCaseHref = "Start with / (a page on this site) or https://";
    }
    featuredCase = { title: v.featuredCaseTitle, href: v.featuredCaseHref };
  }

  if (Object.keys(e).length) return { ok: false, errors: e };
  return {
    ok: true,
    value: {
      name: v.name, slug: v.slug, icon: v.icon, blurb: v.blurb, overview,
      challenges, compliance, outcomes,
      deliverables: deliverables.map(([title, desc]) => ({ title, desc })),
      faqs: faqs.map(([q, a]) => ({ q, a })),
      ...(proof.length ? { proof: proof.map(([value, label]) => ({ value, label })) } : {}),
      ...(featuredCase ? { featuredCase } : {}),
      published: v.published === "on",
    },
  };
}
