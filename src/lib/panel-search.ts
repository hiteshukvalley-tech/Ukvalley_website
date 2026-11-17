import type { Document } from "mongodb";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { canUseArea, type Access } from "@/lib/admin-access";
import type { AdminRole } from "@/lib/admin-auth";
import { applicationStatusLabel, isApplicationStatus } from "@/lib/applications-validation";

// The admin top bar's search over the panel's own records: applicants, leads,
// email logs, job openings, every content list and (admins only) users.
// Each section is searched only when the signed-in user may open it, so an
// HR team member finds applicants but never sees a section they weren't given.
// Server-only.

export type RecordHit = {
  /** section key from admin-access.ts (or "users") */
  area: string;
  /** section name shown above the results */
  section: string;
  title: string;
  /** a second line: email, role, status… */
  sub: string;
  /** the matching text around the search term ("" when the title matched) */
  before: string;
  match: string;
  after: string;
  href: string;
};

export type RecordResult = { hits: RecordHit[]; more: number; dbError?: string };

const PER_SECTION = 6;
const SNIPPET = 60;
/** content lists are small; this caps a runaway collection */
const MAX_CONTENT_DOCS = 1000;

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The database pattern for one typed word. A number (3+ digits) also matches
 * when it is stored with spaces, dashes, dots or brackets between the digits,
 * so "9876543210" finds "+91 98765-43210".
 */
function wordPattern(w: string): string {
  if (!/^\+?\d{3,}$/.test(w)) return escapeRegex(w);
  return [...w].map(escapeRegex).join("[\\s().-]*");
}

/** Every string at a dotted path ("statusEmails.details.interviewVenue"), through arrays. */
function valuesAt(value: unknown, path: string[]): string[] {
  if (Array.isArray(value)) return value.flatMap((v) => valuesAt(v, path));
  if (!path.length) return typeof value === "string" && value.trim() ? [value] : [];
  if (!value || typeof value !== "object") return [];
  return valuesAt((value as Record<string, unknown>)[path[0]], path.slice(1));
}

/** Collections where specific fields are searched in the database (they can grow large). */
type PeopleSource = {
  area: string;
  section: string;
  collection: string;
  fields: string[];
  title: (d: Document) => string;
  sub: (d: Document) => string;
  href: (d: Document, q: string) => string;
  sort: Record<string, 1 | -1>;
  /** a second result for the same record, listed under its own section (e.g. Application status) */
  also?: (d: Document) => Pick<RecordHit, "section" | "title" | "sub" | "href"> | null;
};

const PEOPLE: PeopleSource[] = [
  {
    area: "applications",
    section: "Job applications",
    collection: "applications",
    fields: [
      "name", "email", "phone", "location", "position", "experience", "joiningDate", "source", "portfolio", "coverLetter", "note", "status",
      "careerSlug", "resume.name", "interviewCancelled.reason",
      // every status email sent: its subject and the interview / joining details in it
      "statusEmails.subject", "statusEmails.details.interviewRound", "statusEmails.details.interviewMode",
      "statusEmails.details.interviewVenue", "statusEmails.details.interviewerName", "statusEmails.details.interviewerEmail",
      "statusEmails.details.interviewerPhone", "statusEmails.details.interviewAgenda", "statusEmails.details.rescheduleReason",
      "statusEmails.details.workLocation",
    ],
    title: (d) => d.name || d.email || "Applicant",
    sub: (d) => [d.position, d.email, d.phone, d.status].filter(Boolean).join(" · "),
    href: (d) => `/admin/applications/${encodeURIComponent(d._id)}`,
    sort: { createdAt: -1 },
    // The applicant on Admin → Careers → Application status: their status picked, listed by email.
    also: (d) => {
      if (!isApplicationStatus(d.status)) return null;
      const params = new URLSearchParams({ status: d.status, q: d.email || d.name || "" });
      return {
        section: "Application status",
        title: d.name || d.email || "Applicant",
        sub: [applicationStatusLabel[d.status], d.position].filter(Boolean).join(" · "),
        href: `/admin/applications/status?${params}`,
      };
    },
  },
  {
    area: "applications",
    section: "Email logs",
    collection: "emailLogs",
    fields: ["applicantName", "applicantEmail", "to", "subject", "position", "body"],
    title: (d) => d.subject || "Email",
    sub: (d) => [d.applicantName, d.to, d.result].filter(Boolean).join(" · "),
    href: (_d, q) => `/admin/email-logs?q=${encodeURIComponent(q)}`,
    sort: { at: -1 },
  },
  {
    area: "leads",
    section: "Leads",
    collection: "leads",
    fields: ["name", "email", "company", "phone", "service", "budget", "message", "note", "status", "source"],
    title: (d) => d.name || d.email || "Lead",
    sub: (d) => [d.company, d.email, d.phone, d.status].filter(Boolean).join(" · "),
    href: (d) => `/admin/leads/${encodeURIComponent(d._id)}`,
    sort: { createdAt: -1 },
  },
  {
    area: "users",
    section: "Users",
    collection: "adminUsers",
    fields: ["name", "email", "title", "role"],
    title: (d) => d.name || d.email,
    sub: (d) => [d.title, d.email, d.active === false ? "disabled" : ""].filter(Boolean).join(" · "),
    href: (d) => `/admin/users/${encodeURIComponent(d._id)}`,
    sort: { name: 1 },
  },
];

/** Slug-keyed content lists, edited at /admin/<path>/<slug>. Every text field is searched. */
const CONTENT: { area: string; section: string; collection: string; path: string }[] = [
  { area: "careers", section: "Job openings", collection: "careers", path: "careers" },
  { area: "services", section: "Services", collection: "services", path: "services" },
  { area: "solutions", section: "Solutions", collection: "solutions", path: "solutions" },
  { area: "case-studies", section: "Case studies", collection: "caseStudies", path: "case-studies" },
  { area: "products", section: "Products", collection: "products", path: "products" },
  { area: "industries", section: "Industries", collection: "industries", path: "industries" },
  { area: "tech-stack", section: "Tech stack", collection: "techCategories", path: "tech-stack" },
  { area: "testimonials", section: "Testimonials", collection: "testimonials", path: "testimonials" },
  { area: "team", section: "Team", collection: "teamMembers", path: "team" },
  { area: "process", section: "Process", collection: "processSteps", path: "process" },
  { area: "engagement", section: "Engagement models", collection: "engagementModels", path: "engagement" },
  { area: "locations", section: "Locations", collection: "locations", path: "locations" },
  { area: "faqs", section: "FAQs", collection: "faqs", path: "faqs" },
  { area: "hire", section: "Hire roles", collection: "hireRoles", path: "hire" },
  { area: "blog", section: "Insights (articles)", collection: "posts", path: "blog" },
];

/** Fields that are never shown or searched (ids, hashes, dates, ordering). */
const SKIP_KEYS = new Set(["_id", "passwordHash", "sessionVersion", "order", "published", "createdAt", "updatedAt", "resume"]);

/** Every string inside a document (nested objects and arrays included). */
function strings(value: unknown, out: string[] = [], depth = 0): string[] {
  if (depth > 6) return out;
  if (typeof value === "string") {
    if (value.trim()) out.push(value);
  } else if (Array.isArray(value)) {
    for (const v of value) strings(v, out, depth + 1);
  } else if (value && typeof value === "object" && !(value instanceof Date)) {
    for (const [k, v] of Object.entries(value)) if (!SKIP_KEYS.has(k)) strings(v, out, depth + 1);
  }
  return out;
}

/** The text around the first match: the whole phrase when it appears as typed, else the first word. */
function snippet(text: string, q: string, words: string[]): Pick<RecordHit, "before" | "match" | "after"> {
  const flat = text.replace(/\s+/g, " ").trim();
  const lower = flat.toLowerCase();
  let at = lower.indexOf(q);
  let len = q.length;
  if (at < 0) {
    const w = words.find((x) => lower.includes(x)) ?? words[0];
    at = Math.max(0, lower.indexOf(w));
    len = w.length;
  }
  const start = Math.max(0, at - SNIPPET / 2);
  const end = Math.min(flat.length, at + len + SNIPPET);
  return {
    before: (start > 0 ? "…" : "") + flat.slice(start, at),
    match: flat.slice(at, at + len),
    after: flat.slice(at + len, end) + (end < flat.length ? "…" : ""),
  };
}

/** The snippet to show: none when the title already shows the match, else the best matching field. */
function bestSnippet(title: string, texts: string[], q: string, words: string[]) {
  const has = (s: string) => words.every((w) => s.toLowerCase().includes(w));
  if (has(title)) return { before: "", match: "", after: "" };
  const field = texts.find(has) ?? texts.find((s) => words.some((w) => s.toLowerCase().includes(w))) ?? "";
  return field ? snippet(field, q, words) : { before: "", match: "", after: "" };
}

const contentTitle = (d: Document): string =>
  String(d.title || d.name || d.question || d.role || d.label || d.heading || d.city || d._id);

/**
 * Searches every section the user may open. Every word typed must appear
 * somewhere in the record (in any of its fields), ignoring case.
 */
export async function searchRecords(role: AdminRole, access: Access, query: string): Promise<RecordResult> {
  const q = query.trim().slice(0, 100).toLowerCase();
  if (q.length < 2) return { hits: [], more: 0 };
  if (!hasDatabaseUrl()) return { hits: [], more: 0, dbError: "MONGODB_URI is not set." };
  const words = q.split(/\s+/).filter(Boolean).slice(0, 8);
  const allowed = (area: string) => (area === "users" ? role === "admin" : canUseArea(role, access, area));
  const db = getDb();

  const people = PEOPLE.filter((s) => allowed(s.area)).map(async (s) => {
    const filter = {
      $and: words.map((w) => {
        const rx = { $regex: wordPattern(w), $options: "i" };
        return { $or: s.fields.map((f) => ({ [f]: rx })) };
      }),
    };
    const projection = Object.fromEntries([...s.fields, "_id", "active", "result"].map((f) => [f, 1]));
    const [docs, total] = await Promise.all([
      db.collection(s.collection).find(filter, { projection }).sort(s.sort).limit(PER_SECTION).toArray(),
      db.collection(s.collection).countDocuments(filter, { limit: 500 }),
    ]);
    const hits: RecordHit[] = [];
    const also: RecordHit[] = [];
    for (const d of docs) {
      const title = String(s.title(d));
      const texts = s.fields.flatMap((f) => valuesAt(d, f.split(".")));
      const snip = bestSnippet(title, texts, q, words);
      hits.push({ area: s.area, section: s.section, title, sub: s.sub(d), ...snip, href: s.href(d, query.trim()) });
      const extra = s.also?.(d);
      if (extra) also.push({ area: s.area, ...extra, before: "", match: "", after: "" });
    }
    // the extra section follows this one, so each section's rows stay together
    return { hits: [...hits, ...also], more: Math.max(0, total - docs.length) };
  });

  const content = CONTENT.filter((s) => allowed(s.area)).map(async (s) => {
    const docs = await db.collection(s.collection).find({}).sort({ order: 1, _id: 1 }).limit(MAX_CONTENT_DOCS).toArray();
    const hits: RecordHit[] = [];
    let more = 0;
    for (const d of docs) {
      const texts = [String(d._id), ...strings(d)];
      const joined = texts.join("\n").toLowerCase();
      if (!words.every((w) => joined.includes(w))) continue;
      if (hits.length >= PER_SECTION) {
        more++;
        continue;
      }
      const title = contentTitle(d);
      hits.push({
        area: s.area,
        section: s.section,
        title,
        sub: [d.published === false ? "Draft" : "", `/${s.path}/${d._id}`].filter(Boolean).join(" · "),
        ...bestSnippet(title, texts, q, words),
        href: `/admin/${s.path}/${encodeURIComponent(String(d._id))}`,
      });
    }
    return { hits, more };
  });

  const settled = await Promise.allSettled([...people, ...content]);
  const hits: RecordHit[] = [];
  let more = 0;
  let failed = 0;
  for (const r of settled) {
    if (r.status === "fulfilled") {
      hits.push(...r.value.hits);
      more += r.value.more;
    } else failed++;
  }
  return { hits, more, ...(failed && failed === settled.length ? { dbError: "Could not reach the database." } : {}) };
}
