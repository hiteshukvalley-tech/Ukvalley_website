import { validatePhone } from "./contact-validation";

// Career application form: limits and checks shared by the website form (in
// the browser) and the /careers/apply endpoint (on the server). Client-safe.

export const NAME_MAX = 100;
export const EMAIL_MAX = 200;
export const LOCATION_MAX = 100;
export const POSITION_MAX = 100;
export const PORTFOLIO_MAX = 300;
export const COVER_LETTER_MAX = 3000;
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

export const APPLICATION_STATUSES = ["new", "reviewing", "shortlisted", "rejected", "hired"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const applicationStatusLabel: Record<ApplicationStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  hired: "Hired",
};

export const isApplicationStatus = (v: unknown): v is ApplicationStatus =>
  typeof v === "string" && (APPLICATION_STATUSES as readonly string[]).includes(v);

/** The text fields of an application (the resume is checked separately). */
export type ApplicationInput = {
  name: string;
  email: string;
  phone: string;
  location: string;
  position: string;
  experience: string;
  portfolio: string;
  coverLetter: string;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Reads the text fields from the form, trimmed. A bare "https://" counts as empty. */
export function readApplication(data: FormData): ApplicationInput {
  const get = (k: string) => String(data.get(k) ?? "").trim();
  const portfolio = get("portfolio");
  return {
    name: get("name").replace(/\s+/g, " "),
    email: get("email").toLowerCase(),
    phone: get("phone"),
    location: get("location"),
    position: get("position").replace(/\s+/g, " "),
    experience: get("experience"),
    portfolio: /^https?:\/\/$/i.test(portfolio) ? "" : portfolio,
    coverLetter: get("coverLetter"),
  };
}

export function validateApplication(v: ApplicationInput): Record<string, string> {
  const e: Record<string, string> = {};
  if (v.name.length < 2) e.name = "Please enter your full name.";
  else if (v.name.length > NAME_MAX) e.name = `Name must be ${NAME_MAX} characters or fewer.`;

  if (!EMAIL.test(v.email) || v.email.length > EMAIL_MAX) e.email = "Enter a valid email address.";

  if (!v.phone) e.phone = "Please enter your phone number.";
  else e.phone = validatePhone(v.phone) ?? "";
  if (!e.phone) delete e.phone;

  if (v.location.length < 2) e.location = "Please enter your current location.";
  else if (v.location.length > LOCATION_MAX) e.location = `Location must be ${LOCATION_MAX} characters or fewer.`;

  if (v.position.length < 2) e.position = "Select or type the position you're applying for.";
  else if (v.position.length > POSITION_MAX) e.position = `Position must be ${POSITION_MAX} characters or fewer.`;

  if (!(EXPERIENCE_OPTIONS as readonly string[]).includes(v.experience)) e.experience = "Select your years of experience.";

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
  return e;
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
  | { ok: false; kind: "duplicate" | "limited" | "unavailable" | "too-large"; message: string };

/** True when the bytes start like a PDF ("%PDF-"). */
export const looksLikePdf = (b: Uint8Array) =>
  b.length > 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d;
