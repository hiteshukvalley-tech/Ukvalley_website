import type { Career } from "./site-data";
import {
  DEFAULT_HIRING_PROCESS, EXPERIENCE_YEARS_MAX, HIRING_STEPS_MAX, isIsoDate, isJobMode, isJobType, todayInIndia,
  type HiringStep,
} from "./careers-shared";

export type FieldErrors = Record<string, string>;

/** Editable fields as the form submits them (all strings). */
export type CareerValues = {
  role: string;
  slug: string;
  location: string;
  /** Full-time / Part-time / Freelancing / Internship */
  type: string;
  /** Remote / Hybrid / On-site */
  mode: string;
  /** whole years */
  experienceMin: string;
  /** whole years; blank means "min+ years" */
  experienceMax: string;
  /** YYYY-MM-DD */
  postedAt: string;
  /** "About the role" */
  summary: string;
  /** one per line */
  responsibilities: string;
  /** "Required skills", one per line */
  requirements: string;
  /** one per line; optional */
  qualifications: string;
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
  responsibilities: "", requirements: "", qualifications: "", perks: "",
  hiringProcess: processToText(DEFAULT_HIRING_PROCESS), published: "on",
});

/** Stored shape: the public career fields plus admin bookkeeping. */
export type CareerRecord = Career & { published: boolean; order: number };

/** What the form produces: `order` is assigned by the store. */
export type CareerInput = Omit<CareerRecord, "order">;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const FIELDS = [
  "role", "slug", "location", "type", "mode", "experienceMin", "experienceMax", "postedAt",
  "summary", "responsibilities", "requirements", "qualifications", "perks", "hiringProcess",
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
    qualifications: (c.qualifications ?? []).join("\n"),
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

  // No field is mandatory: a blank one is saved with a sensible default
  // (role "Untitled role", location "India", 0 years, today's date) or left out.
  const text = (k: keyof CareerValues, label: string, max: number) => {
    if (v[k].length > max) e[k] = `${label} must be ${max} characters or fewer.`;
  };
  text("role", "Role", 150);
  text("location", "Location", 100);
  // "About the role": one paragraph per line, up to 50, no character limit.
  // Blank lines are dropped so the job page shows one tidy paragraph per line.
  const summaryLines = lines(v.summary);
  if (summaryLines.length > 50) e.summary = "Use 50 lines or fewer.";
  const summary = summaryLines.join("\n");
  const role = v.role || "Untitled role";
  const location = v.location || "India";

  // The slug is made from the role name when left blank (see the create action).
  if (requireSlug && v.slug) {
    if (v.slug.length > 80) e.slug = "Slug must be 80 characters or fewer.";
    else if (!SLUG.test(v.slug)) e.slug = "Use lowercase letters, numbers and single hyphens only.";
  }

  const mode = isJobMode(v.mode) ? v.mode : "Remote";
  const type = isJobType(v.type) ? v.type : "Full-time";

  // Blank means 0 years (freshers welcome).
  let experienceMin = 0;
  if (!v.experienceMin) experienceMin = 0;
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

  let postedAt = todayInIndia();
  if (v.postedAt) {
    if (!isIsoDate(v.postedAt)) e.postedAt = "Enter a valid date.";
    else if (v.postedAt > todayInIndia()) e.postedAt = "The published date can't be in the future.";
    else postedAt = v.postedAt;
  }

  // Every list is optional; an empty one is simply not shown on the job page.
  // Up to 50 lines each, with no character limit on a line.
  const list = (k: "responsibilities" | "requirements" | "qualifications" | "perks", max: number) => {
    const items = lines(v[k]);
    if (items.length > max) e[k] = `Use ${max} lines or fewer.`;
    return items;
  };
  const responsibilities = list("responsibilities", 50);
  const requirements = list("requirements", 50);
  const qualifications = list("qualifications", 50);
  const perks = list("perks", 50);

  // Optional too: left empty, the job page shows the standard hiring process.
  // "Title | what happens"; a line without "|" is a title on its own.
  const hiringProcess: HiringStep[] = [];
  const steps = lines(v.hiringProcess);
  if (steps.length > HIRING_STEPS_MAX) e.hiringProcess = `Use ${HIRING_STEPS_MAX} steps or fewer.`;
  else {
    for (const [i, line] of steps.entries()) {
      const at = line.indexOf("|");
      const title = (at < 0 ? line : line.slice(0, at)).trim();
      const desc = at < 0 ? "" : line.slice(at + 1).trim();
      if (!title && !desc) continue;
      if (title.length > 120) {
        e.hiringProcess = `Step ${i + 1}: the title must be 120 characters or fewer.`;
        break;
      }
      hiringProcess.push({ title: title || `Step ${i + 1}`, desc });
    }
  }

  if (Object.keys(e).length) return { ok: false, errors: e };
  return {
    ok: true,
    value: {
      slug: v.slug, role, location, type, mode,
      experienceMin, ...(experienceMax === undefined ? {} : { experienceMax }),
      postedAt, summary,
      responsibilities, requirements, ...(qualifications.length ? { qualifications } : {}), perks, hiringProcess,
      published: v.published === "on",
    },
  };
}
