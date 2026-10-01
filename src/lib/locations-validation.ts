import type { Location } from "./locations-data";

export type FieldErrors = Record<string, string>;

/** Icon keys the public Locations pages know how to draw. */
export const locationIcons = [
  "mapPin", "building", "building2", "landmark", "flag", "cpu", "briefcase", "factory", "globe",
] as const;

export const locationTypes = ["HQ", "Office", "Delivery", "Presence"] as const;

/** Editable fields as the form submits them (all strings). */
export type LocationValues = {
  city: string;
  slug: string;
  region: string;
  country: string;
  type: string;
  icon: string;
  blurb: string;
  /** paragraphs separated by a blank line */
  paragraphs: string;
  /** one per line */
  services: string;
  /** one "value | label" per line */
  proof: string;
  timezone: string;
  /** comma or line separated */
  languages: string;
  address: string;
  /** one "Question | Answer" per line */
  faqs: string;
  /** "on" when the Published checkbox is ticked, otherwise "" */
  published: string;
};

export const emptyLocationValues = (): LocationValues => ({
  city: "", slug: "", region: "", country: "India", type: "Delivery", icon: "mapPin",
  blurb: "", paragraphs: "", services: "", proof: "", timezone: "IST (UTC+5:30)",
  languages: "English", address: "", faqs: "", published: "on",
});

/** Stored shape: the public location fields plus admin bookkeeping. */
export type LocationRecord = Location & { published: boolean; order: number };

/** What the form produces: `order` is assigned by the store. */
export type LocationInput = Omit<LocationRecord, "order">;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const FIELDS = [
  "city", "slug", "region", "country", "type", "icon", "blurb", "paragraphs",
  "services", "proof", "timezone", "languages", "address", "faqs",
] as const;

export function readLocationValues(formData: FormData): LocationValues {
  const out = { published: formData.get("published") ? "on" : "" } as LocationValues;
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

export function toLocationValues(l: LocationRecord): LocationValues {
  return {
    city: l.city, slug: l.slug, region: l.region, country: l.country, type: l.type,
    icon: l.icon, blurb: l.blurb,
    paragraphs: l.paragraphs.join("\n\n"),
    services: l.services.join("\n"),
    proof: l.proof.map((p) => `${p.value} | ${p.label}`).join("\n"),
    timezone: l.timezone,
    languages: l.languages.join(", "),
    address: l.address ?? "",
    faqs: l.faqs.map((f) => `${f.q} | ${f.a}`).join("\n"),
    published: l.published ? "on" : "",
  };
}

export function validateLocation(
  v: LocationValues,
  { requireSlug }: { requireSlug: boolean }
): { ok: true; value: LocationInput } | { ok: false; errors: FieldErrors } {
  const e: FieldErrors = {};

  const text = (k: keyof LocationValues, label: string, max: number) => {
    if (!v[k]) e[k] = `${label} is required.`;
    else if (v[k].length > max) e[k] = `${label} must be ${max} characters or fewer.`;
  };
  text("city", "City", 60);
  text("region", "Region", 60);
  text("country", "Country", 60);
  text("blurb", "Blurb", 400);
  text("timezone", "Timezone", 40);
  if (v.address.length > 200) e.address = "Address must be 200 characters or fewer.";

  if (requireSlug) {
    if (!v.slug) e.slug = "Slug is required.";
    else if (v.slug.length > 60) e.slug = "Slug must be 60 characters or fewer.";
    else if (!SLUG.test(v.slug)) e.slug = "Use lowercase letters, numbers and single hyphens only.";
  }
  if (!(locationTypes as readonly string[]).includes(v.type)) e.type = "Choose one of the listed types.";
  if (!(locationIcons as readonly string[]).includes(v.icon)) e.icon = "Choose one of the listed icons.";

  const paras = paragraphs(v.paragraphs);
  if (paras.length === 0) e.paragraphs = "Write at least one paragraph.";
  else if (paras.length > 6) e.paragraphs = "Use 6 paragraphs or fewer.";
  else if (paras.some((p) => p.length > 2000)) e.paragraphs = "Each paragraph must be 2000 characters or fewer.";

  const services = lines(v.services);
  if (services.length === 0) e.services = "Add at least one service.";
  else if (services.length > 10) e.services = "Use 10 services or fewer.";
  else if (services.some((s) => s.length > 100)) e.services = "Each service must be 100 characters or fewer.";

  const languages = v.languages.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
  if (languages.length === 0) e.languages = "Add at least one language.";
  else if (languages.length > 10) e.languages = "Use 10 languages or fewer.";
  else if (languages.some((s) => s.length > 30)) e.languages = "Each language must be 30 characters or fewer.";

  const table = (
    k: "proof" | "faqs",
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
  const proof = table("proof", "proof point", "24h | Response SLA", { max: 6, limits: [20, 60] });
  const faqs = table("faqs", "question", "Can we visit? | Yes, by appointment.", { max: 10, limits: [200, 800] });

  if (Object.keys(e).length) return { ok: false, errors: e };
  return {
    ok: true,
    value: {
      slug: v.slug, city: v.city, region: v.region, country: v.country,
      type: v.type as Location["type"], icon: v.icon, blurb: v.blurb,
      paragraphs: paras, services,
      proof: proof.map(([value, label]) => ({ value, label })),
      timezone: v.timezone, languages,
      ...(v.address ? { address: v.address } : {}),
      faqs: faqs.map(([q, a]) => ({ q, a })),
      published: v.published === "on",
    },
  };
}
