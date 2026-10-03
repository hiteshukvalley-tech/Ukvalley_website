import type { Career } from "./site-data";
import {
  DEFAULT_HIRING_PROCESS, EXPERIENCE_YEARS_MAX, HIRING_STEPS_MAX, isIsoDate, isJobMode, todayInIndia,
  type HiringStep,
} from "./careers-shared";

export type FieldErrors = Record<string, string>;

/** Editable fields as the form submits them (all strings). */
export type CareerValues = {
  role: string;
  slug: string;
  location: string;
  type: string;
  /** Remote / Hybrid / On-site */
  mode: string;
  /** whole years */
  experienceMin: string;
  /** whole years; blank means "min+ years" */
  experienceMax: string;
  /** YYYY-MM-DD */
  postedAt: string;
  summary: string;
  /** one per line */
  responsibilities: string;
  /** one per line */
  requirements: string;
  /** one per line */
  perks: string;
  /** one step per line: "Title | what happens" */
  hiringProcess: string;
  /** "on" when the Published checkbox is ticked, otherwise "" */
  published: string;
};

const processToText = (steps: HiringStep[]) => steps.map((s) => `${s.title} | ${s.desc}`).join("\n");

export const emptyCareerValues = (): CareerValues => ({
  role: "", slug: "", location: "India", type: "Full-time", mode: "Remote",
  experienceMin: "", experienceMax: "", postedAt: todayInIndia(), summary: "",
  responsibilities: "", requirements: "", perks: "",
  hiringProcess: processToText(DEFAULT_HIRING_PROCESS), published: "on",
});

/** Stored shape: the public career fields plus admin bookkeeping. */
export type CareerRecord = Career & { published: boolean; order: number };

/** What the form produces: `order` is assigned by the store. */
export type CareerInput = Omit<CareerRecord, "order">;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const FIELDS = [
  "role", "slug", "location", "type", "mode", "experienceMin", "experienceMax", "postedAt",
  "summary", "responsibilities", "requirements", "perks", "hiringProcess",
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
    role: c.role, slug: c.slug, location: c.location, type: c.type, mode: c.mode,
    experienceMin: String(c.experienceMin),
    experienceMax: c.experienceMax === undefined ? "" : String(c.experienceMax),
    postedAt: c.postedAt,
    summary: c.summary,
    responsibilities: c.responsibilities.join("\n"),
    requirements: c.requirements.join("\n"),
    perks: c.perks.join("\n"),
    hiringProcess: processToText(c.hiringProcess),
    published: c.published ? "on" : "",
  };
}

const WHOLE_NUMBER = /^\d{1,2}$/;

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

  if (!isJobMode(v.mode)) e.mode = "Choose Remote, Hybrid or On-site.";

  let experienceMin = 0;
  if (!v.experienceMin) e.experienceMin = "Minimum experience is required (0 for freshers).";
  else if (!WHOLE_NUMBER.test(v.experienceMin) || +v.experienceMin > EXPERIENCE_YEARS_MAX) {
    e.experienceMin = `Enter whole years from 0 to ${EXPERIENCE_YEARS_MAX}.`;
  } else experienceMin = +v.experienceMin;

  let experienceMax: number | undefined;
  if (v.experienceMax) {
    if (!WHOLE_NUMBER.test(v.experienceMax) || +v.experienceMax > EXPERIENCE_YEARS_MAX) {
      e.experienceMax = `Enter whole years up to ${EXPERIENCE_YEARS_MAX}, or leave it blank.`;
    } else if (!e.experienceMin && +v.experienceMax < experienceMin) {
      e.experienceMax = "Maximum can't be less than the minimum.";
    } else experienceMax = +v.experienceMax;
  }

  if (!v.postedAt) e.postedAt = "Published date is required.";
  else if (!isIsoDate(v.postedAt)) e.postedAt = "Enter a valid date.";
  else if (v.postedAt > todayInIndia()) e.postedAt = "The published date can't be in the future.";

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

  const hiringProcess: HiringStep[] = [];
  const steps = lines(v.hiringProcess);
  if (steps.length === 0) e.hiringProcess = "Add at least one hiring step.";
  else if (steps.length > HIRING_STEPS_MAX) e.hiringProcess = `Use ${HIRING_STEPS_MAX} steps or fewer.`;
  else {
    for (const [i, line] of steps.entries()) {
      const at = line.indexOf("|");
      const title = (at < 0 ? line : line.slice(0, at)).trim();
      const desc = at < 0 ? "" : line.slice(at + 1).trim();
      if (!title || !desc) {
        e.hiringProcess = `Step ${i + 1}: write it as "Title | what happens".`;
        break;
      }
      if (title.length > 60) {
        e.hiringProcess = `Step ${i + 1}: the title must be 60 characters or fewer.`;
        break;
      }
      if (desc.length > 240) {
        e.hiringProcess = `Step ${i + 1}: the description must be 240 characters or fewer.`;
        break;
      }
      hiringProcess.push({ title, desc });
    }
  }

  if (Object.keys(e).length) return { ok: false, errors: e };
  return {
    ok: true,
    value: {
      slug: v.slug, role: v.role, location: v.location, type: v.type, mode: v.mode as CareerInput["mode"],
      experienceMin, ...(experienceMax === undefined ? {} : { experienceMax }),
      postedAt: v.postedAt, summary: v.summary,
      responsibilities, requirements, perks, hiringProcess,
      published: v.published === "on",
    },
  };
}
