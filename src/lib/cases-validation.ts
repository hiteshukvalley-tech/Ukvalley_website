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
  /** one team member name per line */
  teamMembers: string;
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
  title: "", slug: "", client: "", sector: "", timeline: "", team: "", teamMembers: "",
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
  "title", "slug", "client", "sector", "timeline", "team", "teamMembers", "problem", "result",
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
    timeline: r.timeline, team: r.team, teamMembers: (r.teamMembers ?? []).join("\n"), problem: r.problem, result: r.result,
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
    if (!v[k]) e[k] = `${label} is required — please fill it in.`;
    else if (v[k].length > max) e[k] = `${label} is too long: ${v[k].length} characters, the limit is ${max}. Shorten it by ${v[k].length - max}.`;
  };
  text("title", "Title", 140);
  text("client", "Client", 120);
  text("sector", "Sector", 60);
  text("timeline", "Timeline", 60);
  // The team is a list of names; "N people" is worked out from it. A case study
  // saved before names existed keeps its old text until names are added.
  const teamMembers = lines(v.teamMembers);
  if (teamMembers.length > 30) e.team = `You added ${teamMembers.length} team members; the most allowed is 30.`;
  else if (teamMembers.some((n) => n.length > 60)) e.team = "A team member's name can be 60 characters at most.";
  else if (teamMembers.length === 0 && !v.team) e.team = "Add at least one team member — click the + button, type a name and press Enter.";
  else if (teamMembers.length === 0 && v.team.length > 60) e.team = `Team is too long: ${v.team.length} characters, the limit is 60.`;
  const team = teamMembers.length ? `${teamMembers.length} ${teamMembers.length === 1 ? "person" : "people"}` : v.team;
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
    else if (!SLUG.test(v.slug)) e.slug = "The slug can only have lowercase letters, numbers and single hyphens between words, e.g. loan-origination-nbfc.";
  }

  // Line-by-line "left | right" fields: say which line is wrong and how to fix it.
  const pairs = (
    raw: string,
    { what, shape, example, leftMax, rightMax, leftName, rightName, maxLines }: {
      what: string; shape: string; example: string; leftMax: number; rightMax: number;
      leftName: string; rightName: string; maxLines: number;
    }
  ): { items: [string, string][]; error?: string } => {
    const rows = lines(raw);
    if (rows.length === 0) return { items: [], error: `Add at least one ${what}, written as ${shape} — for example: ${example}` };
    if (rows.length > maxLines) return { items: [], error: `You added ${rows.length} ${what}s; the most allowed is ${maxLines}. Remove ${rows.length - maxLines}.` };
    const items: [string, string][] = [];
    for (const [i, row] of rows.entries()) {
      const at = row.indexOf("|");
      if (at < 0) return { items, error: `Line ${i + 1}: there is no “|” separator. Write it as ${shape}, for example: ${example}` };
      const [left, right] = pair(row);
      if (!left) return { items, error: `Line ${i + 1}: the ${leftName} before the “|” is empty. Write it as ${shape}.` };
      if (!right) return { items, error: `Line ${i + 1}: the ${rightName} after the “|” is empty. Write it as ${shape}.` };
      if (left.length > leftMax) return { items, error: `Line ${i + 1}: the ${leftName} is ${left.length} characters; the limit is ${leftMax}.` };
      if (right.length > rightMax) return { items, error: `Line ${i + 1}: the ${rightName} is ${right.length} characters; the limit is ${rightMax}.` };
      items.push([left, right]);
    }
    return { items };
  };

  const m = pairs(v.metrics, {
    what: "metric", shape: "value | label", example: "65% | Faster processing",
    leftMax: 20, rightMax: 60, leftName: "value", rightName: "label", maxLines: 6,
  });
  if (m.error) e.metrics = m.error;
  const metrics = m.items.map(([value, label]) => ({ value, label }));

  const md = pairs(v.modules, {
    what: "module", shape: "title | description", example: "KYC | Aadhaar and PAN checks",
    leftMax: 80, rightMax: 300, leftName: "title", rightName: "description", maxLines: 20,
  });
  if (md.error) e.modules = md.error;
  const modules = md.items.map(([title, desc]) => ({ title, desc }));

  const list = (
    k: "approach" | "challenges" | "results" | "integrations",
    label: string,
    { min, max, item }: { min: number; max: number; item: number }
  ) => {
    const items = lines(v[k]);
    if (items.length < min) e[k] = `Add at least ${min} ${label.toLowerCase()} — one per line.`;
    else if (items.length > max) e[k] = `You added ${items.length} lines; the most allowed is ${max}. Remove ${items.length - max}.`;
    else {
      const long = items.findIndex((i) => i.length > item);
      if (long >= 0) e[k] = `Line ${long + 1} is ${items[long].length} characters; the limit per line is ${item}. Shorten it or split it into two lines.`;
    }
    return items;
  };
  const approach = list("approach", "Approach steps", { min: 1, max: 10, item: 400 });
  const challenges = list("challenges", "Challenges", { min: 1, max: 10, item: 400 });
  const results = list("results", "Results", { min: 1, max: 10, item: 400 });
  const integrations = list("integrations", "Integrations", { min: 0, max: 20, item: 80 });

  const stack = v.stack.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
  if (stack.length === 0) e.stack = "Add at least one technology, separated by commas — for example: Next.js, Node.js, PostgreSQL.";
  else if (stack.length > 20) e.stack = `You listed ${stack.length} technologies; the most allowed is 20. Remove ${stack.length - 20}.`;
  else {
    const long = stack.find((t) => t.length > 40);
    if (long) e.stack = `“${long.slice(0, 30)}…” is longer than 40 characters. Separate technologies with commas — each name should be short, like “Next.js”.`;
  }

  if (Object.keys(e).length) return { ok: false, errors: e };
  return {
    ok: true,
    value: {
      slug: v.slug, client: v.client, sector: v.sector, title: v.title,
      problem: v.problem, result: v.result, metrics, stack,
      timeline: v.timeline, team, ...(teamMembers.length ? { teamMembers } : {}), approach,
      industryContext: v.industryContext, challenges, solution: v.solution,
      modules, results, integrations,
      testimonial: { quote: v.quote, name: v.quoteName, role: v.quoteRole },
      published: v.published === "on",
    },
  };
}
