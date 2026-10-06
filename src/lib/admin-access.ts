// Which admin-panel sections a user may open. Admins have every section;
// other users (role "editor", shown as "Team member") only have the sections
// ticked for them in Admin → Users. Client-safe (no database code): the user
// form, the sidebar, proxy.ts and the server-side checks all read this file.

import type { AdminRole } from "./admin-auth";

export type AccessArea = {
  key: string;
  label: string;
  /** Sidebar group the area sits in, for the checklist in Admin → Users */
  group: "Overview" | "Website" | "Careers & leads";
  /** One line for the checklist */
  hint?: string;
  /** /admin paths that belong to this area (a path and everything under it) */
  paths: string[];
};

export const ACCESS_AREAS: AccessArea[] = [
  { key: "home", label: "Home page", group: "Overview", paths: ["/admin/home"] },
  { key: "menu", label: "Main menu", group: "Overview", paths: ["/admin/menu"] },
  { key: "site", label: "Header & footer", group: "Overview", paths: ["/admin/site"] },
  { key: "texts", label: "Pages & text", group: "Overview", hint: "Every page's text, buttons, images and SEO", paths: ["/admin/texts"] },

  { key: "services", label: "Services", group: "Website", paths: ["/admin/services"] },
  { key: "solutions", label: "Solutions", group: "Website", paths: ["/admin/solutions"] },
  { key: "case-studies", label: "Case studies", group: "Website", paths: ["/admin/case-studies"] },
  { key: "products", label: "Products", group: "Website", paths: ["/admin/products"] },
  { key: "industries", label: "Industries", group: "Website", paths: ["/admin/industries"] },
  { key: "tech-stack", label: "Tech stack", group: "Website", paths: ["/admin/tech-stack"] },
  { key: "testimonials", label: "Testimonials", group: "Website", paths: ["/admin/testimonials"] },
  { key: "team", label: "Team", group: "Website", paths: ["/admin/team"] },
  { key: "process", label: "Process", group: "Website", paths: ["/admin/process"] },
  { key: "engagement", label: "Engagement models", group: "Website", paths: ["/admin/engagement"] },
  { key: "locations", label: "Locations", group: "Website", paths: ["/admin/locations"] },
  { key: "faqs", label: "FAQs", group: "Website", paths: ["/admin/faqs"] },
  { key: "pages", label: "Social impact & page heroes", group: "Website", paths: ["/admin/pages"] },
  { key: "hire", label: "Hire roles", group: "Website", paths: ["/admin/hire"] },
  { key: "blog", label: "Insights (articles)", group: "Website", paths: ["/admin/blog"] },

  { key: "careers", label: "Job openings", group: "Careers & leads", paths: ["/admin/careers"] },
  { key: "applications", label: "Job applications", group: "Careers & leads", hint: "Applicants' details and résumés", paths: ["/admin/applications"] },
  { key: "leads", label: "Leads", group: "Careers & leads", hint: "Enquiries from the contact forms", paths: ["/admin/leads"] },
  { key: "media", label: "Media library", group: "Careers & leads", paths: ["/admin/media"] },
];

export const ACCESS_KEYS: readonly string[] = ACCESS_AREAS.map((a) => a.key);

/** Pages only admins can open (never grantable to a team member). */
export const ADMIN_ONLY_PATHS = ["/admin/settings", "/admin/users", "/admin/migration"];

/**
 * Pages every signed-in user can open. The upload route is used by the image
 * fields in every section, not only the Media library, so any team member may
 * upload (it still needs a valid session).
 */
const OPEN_PATHS = ["/admin", "/admin/account", "/admin/media/upload"];

const under = (path: string, base: string) => path === base || path.startsWith(`${base}/`);

/** The area an /admin path belongs to, or null (dashboard, account, admin-only pages). */
export function areaForPath(pathname: string): AccessArea | null {
  const p = (pathname.split(/[?#]/)[0] || "/").toLowerCase().replace(/\/+$/, "") || "/";
  return ACCESS_AREAS.find((a) => a.paths.some((base) => under(p, base))) ?? null;
}

/** A user's access as stored: `undefined` = every content area (accounts made before per-section access). */
export type Access = readonly string[] | undefined;

/** Whether this user may use the given area. */
export function canUseArea(role: AdminRole, access: Access, area: string): boolean {
  if (role === "admin") return true;
  return access === undefined || access.includes(area);
}

/** Whether this user may open the given /admin path. */
export function canOpenPath(role: AdminRole, access: Access, pathname: string): boolean {
  const p = (pathname.split(/[?#]/)[0] || "/").toLowerCase().replace(/\/+$/, "") || "/";
  if (ADMIN_ONLY_PATHS.some((base) => under(p, base))) return role === "admin";
  if (OPEN_PATHS.includes(p)) return true;
  const area = areaForPath(p);
  return area ? canUseArea(role, access, area.key) : role === "admin";
}

/** Keeps only known area keys, in the checklist's order, without duplicates. */
export function cleanAccess(keys: readonly string[]): string[] {
  const wanted = new Set(keys);
  return ACCESS_KEYS.filter((k) => wanted.has(k));
}
