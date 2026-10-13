// Job-listing helpers shared by the public careers pages (server and browser),
// the admin form and the store. Client-safe: no database or Node imports.

export const JOB_MODES = ["Remote", "Hybrid", "On-site"] as const;
export type JobMode = (typeof JOB_MODES)[number];

export const isJobMode = (v: unknown): v is JobMode =>
  typeof v === "string" && (JOB_MODES as readonly string[]).includes(v);

/** Job type (employment type): picked in the admin, shown on the listing and the job page. */
export const JOB_TYPES = ["Full-time", "Part-time", "Freelancing", "Internship"] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const isJobType = (v: unknown): v is JobType =>
  typeof v === "string" && (JOB_TYPES as readonly string[]).includes(v);

/**
 * The job type for a role saved when Type was free text ("Full time",
 * "Contract", "Intern"…): the closest of JOB_TYPES, else Full-time.
 */
export function toJobType(raw: unknown): JobType {
  if (isJobType(raw)) return raw;
  const t = typeof raw === "string" ? raw.toLowerCase() : "";
  if (/intern|trainee|apprentice/.test(t)) return "Internship";
  if (/freelanc|contract|consult/.test(t)) return "Freelancing";
  if (/part[\s-]*time/.test(t)) return "Part-time";
  return "Full-time";
}

/** One stage of a role's recruitment flow, shown on the job page. */
export type HiringStep = { title: string; desc: string };

export const HIRING_STEPS_MAX = 8;
export const EXPERIENCE_YEARS_MAX = 40;

/** Used for any role that doesn't define its own hiring process. */
export const DEFAULT_HIRING_PROCESS: HiringStep[] = [
  { title: "Application review", desc: "Our HR team reads your resume and portfolio against the role, usually within 7 working days." },
  { title: "Shortlisted", desc: "If your profile is a match, we email you to say you've been shortlisted and what comes next." },
  { title: "Intro call", desc: "A short call about your experience, what you're looking for and how we work." },
  { title: "Interview scheduled", desc: "We email you the date, time and mode of your interview (online or in person), with the meeting link or venue." },
  { title: "HR round", desc: "A conversation with HR about your background, expectations, notice period and the way we work." },
  { title: "Technical round", desc: "A practical exercise or live session based on the kind of work you'd actually do here." },
  { title: "Offer", desc: "We share a written offer with your role, compensation and joining date." },
  { title: "Hired", desc: "Welcome aboard! HR helps you with the joining documents and your first day." },
];

/** The default hiring process with its "Technical round" replaced by a role's own version. */
export const withTechnicalRound = (step: HiringStep): HiringStep[] =>
  DEFAULT_HIRING_PROCESS.map((s) => (s.title === "Technical round" ? step : s));

/** Guesses the mode from a free-text location, for roles saved before modes existed. */
export function inferJobMode(location: string): JobMode {
  if (/remote/i.test(location)) return "Remote";
  if (/hybrid/i.test(location)) return "Hybrid";
  return "On-site";
}

/** "4+ years" / "2–4 years" / "Fresher" — for cards and the job overview. */
export function formatExperience(min: number, max?: number): string {
  if (max === undefined) return min === 0 ? "Any experience" : `${min}+ years`;
  if (max === 0) return "Fresher";
  if (min === max) return `${min} year${min === 1 ? "" : "s"}`;
  return `${min}–${max} years`;
}

/**
 * Does a role suit what the candidate typed in the experience box?
 * A number ("3", "3 years", "2.5") matches roles whose range contains it;
 * "fresher" / "entry" means 0. Anything else is matched as text.
 */
export function matchesExperience(query: string, min: number, max?: number): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const num = q.match(/\d+(?:\.\d+)?/);
  const years = num ? Number(num[0]) : /fresh|entry|graduate|intern/.test(q) ? 0 : undefined;
  if (years === undefined) return formatExperience(min, max).toLowerCase().includes(q);
  return years >= min && (max === undefined || years <= max);
}

/** Today's date in India as YYYY-MM-DD (the admin's default "published" date). */
export function todayInIndia(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** True for a real calendar date written as YYYY-MM-DD. */
export function isIsoDate(v: string): boolean {
  const m = ISO_DATE.exec(v);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

/** "22 Sep 2026". Formatted in UTC so server and browser render the same text. */
export function formatPostedDate(iso: string): string {
  if (!isIsoDate(iso)) return iso;
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`)
  );
}

/** Whole days between the posted date and `today` (both YYYY-MM-DD). */
export function daysSincePosted(iso: string, today: string): number {
  if (!isIsoDate(iso) || !isIsoDate(today)) return Infinity;
  return Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${iso}T00:00:00Z`)) / 86_400_000);
}

/** "Posted today" / "Posted 3 days ago" / "Posted 22 Sep 2026". */
export function postedLabel(iso: string, today: string): string {
  const days = daysSincePosted(iso, today);
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  if (days < 30) return `Posted ${days} days ago`;
  return `Posted ${formatPostedDate(iso)}`;
}

/** Roles posted within this many days get a "New" badge. */
export const NEW_ROLE_DAYS = 7;

/** Offered as suggestions in the admin's Location box (it still accepts anything). */
export const LOCATION_SUGGESTIONS = ["Pune, Maharashtra", "Nagpur, Maharashtra", "Pune / Nagpur", "Remote (India)", "India"];

/** URL-safe id from a role title, e.g. "Senior React / Next.js Engineer" -> "senior-react-next-js-engineer". */
export function slugifyRole(role: string): string {
  const s = role
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/, "");
  return s || "role";
}

/** Does a role belong to a hiring place ("Pune", "Remote")? Looks at its location text and job mode. */
export function roleInPlace(place: string, location: string, mode: string): boolean {
  const p = place.trim().toLowerCase();
  if (!p) return true;
  return `${location} ${mode}`.toLowerCase().includes(p);
}

/** Every word typed must appear somewhere in the haystack (case-insensitive). */
export function hasWords(haystack: string, query: string): boolean {
  const text = haystack.toLowerCase();
  return query.toLowerCase().split(/\s+/).filter(Boolean).every((w) => text.includes(w));
}
