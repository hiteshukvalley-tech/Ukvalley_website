import { validatePhone } from "./contact-validation";
import { isIsoDate, todayInIndia } from "./careers-shared";

// Career application form: limits and checks shared by the website form (in
// the browser) and the /careers/apply endpoint (on the server). Client-safe.

export const NAME_MAX = 100;
export const EMAIL_MAX = 200;
export const PHONE_MAX = 30;
export const LOCATION_MAX = 100;
export const POSITION_MAX = 100;
export const PORTFOLIO_MAX = 300;
export const COVER_LETTER_MAX = 3000;
/** How far ahead the expected joining date may be. */
export const JOINING_MAX_DAYS = 365;

/** The latest joining date the form accepts (YYYY-MM-DD), counted from `today`. */
export function latestJoiningDate(today = todayInIndia()): string {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + JOINING_MAX_DAYS);
  return d.toISOString().slice(0, 10);
}

/** Resume size limit (PDF). */
export const RESUME_MAX_BYTES = 4 * 1024 * 1024;

export const EXPERIENCE_OPTIONS = [
  "Fresher (0–1 year)",
  "1–2 years",
  "2–4 years",
  "4–6 years",
  "6–10 years",
  "10+ years",
] as const;

/**
 * Hiring stages, in pipeline order. The keys are stored in the database, so an
 * existing key must never be renamed (change its label instead).
 */
export const APPLICATION_STATUSES = [
  "new",
  "reviewing",
  "shortlisted",
  "interview-scheduled",
  "rescheduled",
  "no-show",
  "next-round",
  "on-hold",
  "selected",
  "rejected",
  "offer-issued",
  "offer-accepted",
  "offer-declined",
  "hired",
  "not-joined",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const applicationStatusLabel: Record<ApplicationStatus, string> = {
  new: "New Application",
  reviewing: "Application Under Review",
  shortlisted: "Shortlisted Candidate",
  "interview-scheduled": "Interview Scheduled",
  rescheduled: "Interview Rescheduled",
  "no-show": "Not Appeared for Interview",
  "next-round": "Next Round",
  "on-hold": "On Hold",
  selected: "Selected",
  rejected: "Rejected",
  "offer-issued": "Offer Letter Issued",
  "offer-accepted": "Offer Accepted",
  "offer-declined": "Offer Rejected",
  hired: "Joined",
  "not-joined": "Did Not Join",
};

export const isApplicationStatus = (v: unknown): v is ApplicationStatus =>
  typeof v === "string" && (APPLICATION_STATUSES as readonly string[]).includes(v);

/** The only statuses HR can email the applicant about. */
export const EMAIL_STATUSES = ["shortlisted", "interview-scheduled", "rescheduled", "next-round", "on-hold", "selected", "rejected", "hired"] as const;
export type EmailStatus = (typeof EMAIL_STATUSES)[number];
export const isEmailStatus = (v: unknown): v is EmailStatus =>
  typeof v === "string" && (EMAIL_STATUSES as readonly string[]).includes(v);

/** Statuses whose email carries an interview date, time and venue. */
// "shortlisted" stays here for interviews set before "Interview Scheduled" existed (its emails carried the date).
export const INTERVIEW_STATUSES = ["shortlisted", "interview-scheduled", "rescheduled", "next-round"] as const;
export const isInterviewStatus = (v: unknown): v is (typeof INTERVIEW_STATUSES)[number] =>
  typeof v === "string" && (INTERVIEW_STATUSES as readonly string[]).includes(v);

/** The text fields of an application (the resume is checked separately). */
export type ApplicationInput = {
  name: string;
  email: string;
  phone: string;
  location: string;
  position: string;
  experience: string;
  /**
   * Expected joining date, YYYY-MM-DD; "" when not given (optional).
   * Applications sent before this field existed don't have it.
   */
  joiningDate: string;
  portfolio: string;
  coverLetter: string;
  /**
   * Where they heard about Ukvalley: one of SOURCE_OPTIONS, or "Other: …" with
   * their own words. Applications sent before this field existed don't have it.
   */
  source: string;
  /** Optional details used by the AI interview; missing on applications sent before they existed. */
  currentCompany?: string;
  skills?: string;
  education?: string;
  /** The applicant agreed to interview messages on WhatsApp. */
  whatsappOptIn?: boolean;
  /** The applicant's time zone (IANA name from their browser), for interview times. */
  timeZone?: string;
};

export const CURRENT_COMPANY_MAX = 120;
export const SKILLS_MAX = 500;
export const EDUCATION_MAX = 300;

/** "How did you hear about Ukvalley?" in the Apply popup. */
export const SOURCE_OPTIONS = [
  "LinkedIn",
  "Naukri.com",
  "Indeed",
  "Company website",
  "Google search",
  "Instagram / Facebook",
  "Friend or employee referral",
  "College / campus placement",
  "Job fair or event",
  "Other",
] as const;
export const SOURCE_OTHER_MAX = 100;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Reads the text fields from the form, trimmed. A bare "https://" counts as empty. */
export function readApplication(data: FormData): ApplicationInput {
  const get = (k: string) => String(data.get(k) ?? "").trim();
  const portfolio = get("portfolio");
  const source = get("source");
  const other = get("sourceOther").replace(/\s+/g, " ");
  return {
    name: get("name").replace(/\s+/g, " "),
    email: get("email").toLowerCase(),
    phone: get("phone"),
    location: get("location"),
    position: get("position").replace(/\s+/g, " "),
    experience: get("experience"),
    joiningDate: get("joiningDate"),
    portfolio: /^https?:\/\/$/i.test(portfolio) ? "" : portfolio,
    coverLetter: get("coverLetter"),
    // "Other" carries the applicant's own words: "Other: a WhatsApp group"
    source: source === "Other" ? (other ? `Other: ${other}` : "Other") : source,
    currentCompany: get("currentCompany").replace(/\s+/g, " "),
    skills: get("skills").replace(/\s+/g, " "),
    education: get("education").replace(/\s+/g, " "),
    whatsappOptIn: data.get("whatsappOptIn") === "on",
    // Checked (and replaced with India time when unknown) on the server.
    timeZone: get("timeZone").slice(0, 64),
  };
}

export function validateApplication(v: ApplicationInput): Record<string, string> {
  const e: Record<string, string> = {};
  if (v.name.length < 2) e.name = "Please enter your full name.";
  else if (v.name.length > NAME_MAX) e.name = `Name must be ${NAME_MAX} characters or fewer.`;

  if (!EMAIL.test(v.email) || v.email.length > EMAIL_MAX) e.email = "Enter a valid email address.";

  if (!v.phone) e.phone = "Please enter your phone number.";
  else e.phone = validatePhone(v.phone) ?? (v.phone.length > PHONE_MAX ? "Phone number is too long." : "");
  if (!e.phone) delete e.phone;

  if (v.location.length < 2) e.location = "Please enter your current location.";
  else if (v.location.length > LOCATION_MAX) e.location = `Location must be ${LOCATION_MAX} characters or fewer.`;

  if (v.position.length < 2) e.position = "Select the position you're applying for.";
  else if (v.position.length > POSITION_MAX) e.position = `Position must be ${POSITION_MAX} characters or fewer.`;

  if (!(EXPERIENCE_OPTIONS as readonly string[]).includes(v.experience)) e.experience = "Select your years of experience.";

  if (v.joiningDate) {
    const today = todayInIndia();
    if (!isIsoDate(v.joiningDate)) e.joiningDate = "Pick a valid date (or leave it empty).";
    else if (v.joiningDate < today) e.joiningDate = "The joining date can't be in the past.";
    else if (v.joiningDate > latestJoiningDate(today)) e.joiningDate = "Pick a date within the next 12 months.";
  }

  if (v.portfolio) {
    let ok = false;
    try {
      const url = new URL(v.portfolio);
      ok = (url.protocol === "https:" || url.protocol === "http:") && url.hostname.includes(".");
    } catch {}
    if (!ok) e.portfolio = "Enter a full link starting with https:// (or leave it empty).";
    else if (v.portfolio.length > PORTFOLIO_MAX) e.portfolio = `Link must be ${PORTFOLIO_MAX} characters or fewer.`;
  }

  if (v.coverLetter.length > COVER_LETTER_MAX) e.coverLetter = `Cover letter must be ${COVER_LETTER_MAX} characters or fewer.`;
  if ((v.currentCompany ?? "").length > CURRENT_COMPANY_MAX) e.currentCompany = `Use ${CURRENT_COMPANY_MAX} characters or fewer.`;
  if ((v.skills ?? "").length > SKILLS_MAX) e.skills = `Use ${SKILLS_MAX} characters or fewer.`;
  if ((v.education ?? "").length > EDUCATION_MAX) e.education = `Use ${EDUCATION_MAX} characters or fewer.`;

  if (!v.source) e.source = "Tell us how you heard about Ukvalley.";
  else if (v.source === "Other") e.sourceOther = "Tell us where you heard about us.";
  else if (v.source.startsWith("Other: ")) {
    if (v.source.length > "Other: ".length + SOURCE_OTHER_MAX) e.sourceOther = `Use ${SOURCE_OTHER_MAX} characters or fewer.`;
  } else if (!(SOURCE_OPTIONS as readonly string[]).includes(v.source)) e.source = "Select one of the listed options.";
  return e;
}

/** True when `position` is one of the open roles' titles (ignoring case and extra spaces). */
export function isOpenPosition(position: string, titles: readonly string[]): boolean {
  const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
  const p = norm(String(position ?? ""));
  return !!p && titles.some((t) => norm(t) === p);
}

/** Checks the chosen resume's name, type and size (the server also checks its bytes). */
export function resumeError(file: { name: string; size: number; type?: string } | null | undefined): string | undefined {
  if (!file || file.size === 0) return "Please upload your resume (PDF).";
  if (!/\.pdf$/i.test(file.name) || (file.type && file.type !== "application/pdf")) return "Resume must be a PDF file.";
  if (file.size > RESUME_MAX_BYTES) return `Resume must be ${RESUME_MAX_BYTES / 1024 / 1024} MB or smaller.`;
  return undefined;
}

/** What POST /careers/apply answers. */
export type ApplyResult =
  | { ok: true }
  | { ok: false; kind: "invalid"; errors: Record<string, string> }
  | { ok: false; kind: "duplicate" | "limited" | "unavailable" | "too-large"; message: string }
  /** The role was closed (moved to drafts or deleted): send the visitor to `redirectTo`. */
  | { ok: false; kind: "closed"; message: string; redirectTo: string };

/** Message shown when someone applies for a role that is no longer open. */
export const ROLE_CLOSED_MESSAGE = "This job opening is closed now. Taking you to our current openings…";

/** The Careers page with the "this opening is closed" notice for `slug`. */
export const closedRoleHref = (slug?: string) =>
  slug ? `/careers?closed=${encodeURIComponent(slug)}#open-roles` : "/careers?closed=1#open-roles";

/** True when the bytes start like a PDF ("%PDF-"). */
export const looksLikePdf = (b: Uint8Array) =>
  b.length > 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d;
