import type { HireRole } from "./hire-data";

export type FieldErrors = Record<string, string>;

/** Icon keys the public Hire pages know how to draw. */
export const hireIcons = [
  "atom", "triangle", "server", "smartphone", "braces", "component",
  "database", "cloud", "flaskConical", "headset", "palette",
] as const;

/** Editable fields as the form submits them (all strings). */
export type HireValues = {
  title: string;
  slug: string;
  shortLabel: string;
  icon: string;
  tagline: string;
  description: string;
  /** paragraphs separated by a blank line */
  longDescription: string;
  /** one "value | label" per line */
  metrics: string;
  /** one "Title | Description" per line */
  skills: string;
  /** one "Name | Description" per line */
  engagement: string;
  /** one "Title | Description" per line */
  process: string;
  /** comma or line separated */
  techs: string;
  /** one "Question | Answer" per line */
  faqs: string;
  /** what to call the people on the page, e.g. "designers" (optional) */
  noun: string;
  /** "on" when the Published checkbox is ticked, otherwise "" */
  published: string;
};

export const emptyHireValues = (): HireValues => ({
  title: "", slug: "", shortLabel: "", icon: "atom", tagline: "", description: "",
  longDescription: "", metrics: "", skills: "", engagement: "", process: "",
  techs: "", faqs: "", noun: "", published: "on",
});

/** Stored shape: the public role fields plus admin bookkeeping. */
export type HireRecord = HireRole & { published: boolean; order: number };

/** What the form produces: `order` is assigned by the store. */
export type HireInput = Omit<HireRecord, "order">;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const FIELDS = [
  "title", "slug", "shortLabel", "icon", "tagline", "description", "longDescription",
  "metrics", "skills", "engagement", "process", "techs", "faqs", "noun",
] as const;

export function readHireValues(formData: FormData): HireValues {
  const out = { published: formData.get("published") ? "on" : "" } as HireValues;
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

export function toHireValues(r: HireRecord): HireValues {
  return {
    title: r.title, slug: r.slug, shortLabel: r.shortLabel, icon: r.icon,
    tagline: r.tagline, description: r.description,
    longDescription: r.longDescription.join("\n\n"),
    metrics: r.metrics.map((m) => `${m.value} | ${m.label}`).join("\n"),
    skills: r.skills.map((s) => `${s.title} | ${s.desc}`).join("\n"),
    engagement: r.engagement.map((e) => `${e.name} | ${e.desc}`).join("\n"),
    process: r.process.map((p) => `${p.title} | ${p.desc}`).join("\n"),
    techs: r.techs.join(", "),
    faqs: r.faqs.map((f) => `${f.q} | ${f.a}`).join("\n"),
    noun: r.noun ?? "",
    published: r.published ? "on" : "",
  };
}

export function validateHire(
  v: HireValues,
  { requireSlug }: { requireSlug: boolean }
): { ok: true; value: HireInput } | { ok: false; errors: FieldErrors } {
  const e: FieldErrors = {};

  const text = (k: keyof HireValues, label: string, max: number) => {
    if (!v[k]) e[k] = `${label} is required.`;
    else if (v[k].length > max) e[k] = `${label} must be ${max} characters or fewer.`;
  };
  text("title", "Title", 60);
  text("shortLabel", "Short label", 30);
  text("tagline", "Tagline", 160);
  text("description", "Description", 400);
  if (v.noun.length > 30) e.noun = "Must be 30 characters or fewer.";

  if (requireSlug) {
    if (!v.slug) e.slug = "Slug is required.";
    else if (v.slug.length > 60) e.slug = "Slug must be 60 characters or fewer.";
    else if (!SLUG.test(v.slug)) e.slug = "Use lowercase letters, numbers and single hyphens only.";
  }
  if (!(hireIcons as readonly string[]).includes(v.icon)) e.icon = "Choose one of the listed icons.";

  const longDescription = paragraphs(v.longDescription);
  if (longDescription.length === 0) e.longDescription = "Write at least one paragraph.";
  else if (longDescription.length > 6) e.longDescription = "Use 6 paragraphs or fewer.";
  else if (longDescription.some((p) => p.length > 2000)) e.longDescription = "Each paragraph must be 2000 characters or fewer.";

  const table = (
    k: "metrics" | "skills" | "engagement" | "process" | "faqs",
    label: string,
    example: string,
    { max, limits }: { max: number; limits: [number, number] }
  ) => {
    const rows = lines(v[k]).map(pair);
    if (rows.length === 0) e[k] = `Add at least 1 ${label}, e.g. “${example}”.`;
    else if (rows.length > max) e[k] = `Use ${max} or fewer.`;
    else if (rows.some(([a, b]) => !a || !b)) e[k] = `Each line needs two parts separated by |, e.g. “${example}”.`;
    else if (rows.some(([a, b]) => a.length > limits[0] || b.length > limits[1])) e[k] = `A part is too long (limits: ${limits.join(" / ")} characters).`;
    return rows;
  };
  const metrics = table("metrics", "metric", "48h | Typical time to start", { max: 6, limits: [20, 60] });
  const skills = table("skills", "skill", "TypeScript | Strict typing everywhere", { max: 12, limits: [80, 300] });
  const engagement = table("engagement", "engagement model", "Full-time | One engineer, 160 hrs/month", { max: 6, limits: [80, 300] });
  const process = table("process", "step", "Meet the engineer | You interview them directly", { max: 8, limits: [80, 300] });
  const faqs = table("faqs", "question", "How fast can they start? | Within 48 hours.", { max: 10, limits: [200, 800] });

  const techs = v.techs.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
  if (techs.length === 0) e.techs = "Add at least one technology.";
  else if (techs.length > 20) e.techs = "Use 20 technologies or fewer.";
  else if (techs.some((t) => t.length > 40)) e.techs = "Each technology must be 40 characters or fewer.";

  if (Object.keys(e).length) return { ok: false, errors: e };
  return {
    ok: true,
    value: {
      slug: v.slug, title: v.title, shortLabel: v.shortLabel, icon: v.icon,
      tagline: v.tagline, description: v.description, longDescription,
      metrics: metrics.map(([value, label]) => ({ value, label })),
      skills: skills.map(([title, desc]) => ({ title, desc })),
      engagement: engagement.map(([name, desc]) => ({ name, desc })),
      process: process.map(([title, desc]) => ({ title, desc })),
      techs,
      faqs: faqs.map(([q, a]) => ({ q, a })),
      ...(v.noun ? { noun: v.noun } : {}),
      published: v.published === "on",
    },
  };
}
