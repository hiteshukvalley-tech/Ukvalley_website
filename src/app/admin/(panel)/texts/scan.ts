import { headers } from "next/headers";
import { getServices } from "@/lib/services-store";
import { getSolutions } from "@/lib/solutions-store";
import { getProducts } from "@/lib/products-store";
import { getIndustries } from "@/lib/industries-store";
import { getHireRoles } from "@/lib/hire-store";
import { getCaseStudies } from "@/lib/cases-store";
import { getLocations } from "@/lib/locations-store";
import { getPosts } from "@/lib/blog-store";
import { getCareers } from "@/lib/careers-store";
import { EDITABLE_PAGES } from "@/lib/pages-schema";
import { getMenuForAdmin } from "@/lib/menu-store";
import { scanHtml, type ScanItem } from "@/lib/texts-scan";
import { API_HOST, SITE_HOST, SITE_URL, trustedRequestOrigin } from "@/lib/site-origin";

/** Only plain site paths: no scheme, no query, no ".." — what we are willing to fetch from ourselves. */
export const isScanPath = (p: string) => /^\/(?:[a-z0-9][a-z0-9._-]*(?:\/[a-z0-9][a-z0-9._-]*)*)?$/i.test(p) && p.length <= 200;

/** The website sections, as in the sidebar. `name` is what listScanPaths() calls the group. */
export const TEXT_GROUPS = [
  { slug: "services", name: "Services" },
  { slug: "solutions", name: "Solutions" },
  { slug: "work", name: "Work" },
  { slug: "company", name: "Company" },
  { slug: "hire", name: "Hire" },
  { slug: "insights", name: "Insights" },
  { slug: "added", name: "Sections you added" },
] as const;
export const groupBySlug = (slug: string) => TEXT_GROUPS.find((g) => g.slug === slug);
export const groupByName = (name: string) => TEXT_GROUPS.find((g) => g.name === name);

export type PathEntry = { path: string; label: string; /** what kind of page, shown instead of its address */ tag: string };
export type PathGroup = { group: string; entries: PathEntry[] };

type Labelled = { slug: string; title?: string; name?: string; role?: string; city?: string };
const label = (x: Labelled) => x.title ?? x.name ?? x.role ?? x.city ?? x.slug;

/**
 * Every public page the admin can open here, grouped like the main menu:
 * Services, Solutions, Work, Company, Hire, Insights (+ sections added in Main menu).
 * The address is kept only to open the page; the admin sees names.
 */
export async function listScanPaths(): Promise<PathGroup[]> {
  const settle = async <T,>(p: Promise<T[]>): Promise<T[]> => p.catch(() => []);
  const [services, solutions, products, industries, hire, cases, locations, posts, careers, menu] = await Promise.all([
    settle(getServices()), settle(getSolutions()), settle(getProducts()), settle(getIndustries()), settle(getHireRoles()),
    settle(getCaseStudies()), settle(getLocations()), settle(getPosts()), settle(getCareers()),
    getMenuForAdmin().then((m) => m.pages).catch(() => [] as { slug: string; name: string }[]),
  ]);
  const page = (key: string, tag = "Page"): PathEntry => {
    const p = EDITABLE_PAGES.find((x) => x.key === key)!;
    return { path: p.href, label: p.label.replace(/ \(index\)$/, ""), tag };
  };
  const rows = (base: string, items: Labelled[], tag: string): PathEntry[] =>
    items.map((r) => ({ path: `${base}/${r.slug}`, label: label(r), tag }));

  return [
    {
      group: "Services",
      entries: [
        page("services", "Main page"),
        ...(services as { title: string; href: string }[])
          .filter((s) => /^\/services\/[^/]+$/.test(s.href))
          .map((s) => ({ path: s.href, label: s.title, tag: "Service" })),
      ],
    },
    { group: "Solutions", entries: [page("solutions", "Main page"), ...rows("/solutions", solutions as Labelled[], "Solution")] },
    {
      group: "Work",
      entries: [
        page("case-studies", "Main page"), ...rows("/case-studies", cases as Labelled[], "Case study"),
        page("products", "Main page"), ...rows("/products", products as Labelled[], "Product"),
        page("industries", "Main page"), ...rows("/industries", industries as Labelled[], "Industry"),
        page("tech-stack"), page("clients"), page("project-rescue"),
      ],
    },
    {
      group: "Company",
      entries: [
        page("about"), page("why-ukvalley"), page("team"), page("social-impact"), page("process"), page("engagement"), page("support-maintenance"),
        page("pricing"), page("faq"), page("contact"),
        page("careers", "Main page"), ...rows("/careers", careers as Labelled[], "Job opening"),
        page("locations", "Main page"), ...rows("/locations", locations as Labelled[], "Location"),
        page("privacy"), page("terms"), page("sitemap"),
      ],
    },
    { group: "Hire", entries: [page("hire", "Main page"), ...rows("/hire", hire as Labelled[], "Role")] },
    { group: "Insights", entries: [page("blog", "Main page"), ...rows("/blog", posts as Labelled[], "Article")] },
    { group: "Sections you added", entries: menu.map((m) => ({ path: `/s/${m.slug}`, label: m.name, tag: "Page" })) },
  ].filter((g) => g.entries.length > 0);
}

/** Name and menu section of a page, for the editor's title. */
export async function describePath(path: string): Promise<{ group: string; label: string; tag: string } | null> {
  for (const g of await listScanPaths()) {
    const e = g.entries.find((x) => x.path === path);
    if (e) return { group: g.group, label: e.label, tag: e.tag };
  }
  return path === "/" ? { group: "Home", label: "Home page", tag: "Page" } : null;
}

/**
 * Where this server can reach itself: the host the admin is using, but only
 * when that host is really this site (a forged Host header must not make the
 * server fetch some other address and hand its content back).
 */
async function origin(): Promise<string> {
  const o = trustedRequestOrigin(await headers());
  if (!o) throw new Error("Unexpected host header.");
  // On the backend address public pages redirect to the website: read them there.
  if (new URL(o).hostname.toLowerCase() === API_HOST && API_HOST !== SITE_HOST) return SITE_URL;
  return o;
}

/** Fetches the public page and lists what can be edited on it. */
export async function scanPage(path: string): Promise<{ items: ScanItem[]; error?: string }> {
  if (!isScanPath(path)) return { items: [], error: "That is not a page of this site." };
  try {
    const res = await fetch(`${await origin()}${path}`, {
      cache: "no-store",
      redirect: "manual",
      headers: { "user-agent": "ukvalley-admin-text-scan" },
      signal: AbortSignal.timeout(30_000),
    });
    if (res.status !== 200) return { items: [], error: `The page answered ${res.status}. Open it on the site first to check it exists.` };
    return { items: scanHtml(await res.text()) };
  } catch (e) {
    return { items: [], error: `Could not read the page: ${e instanceof Error ? e.message : "network error"}` };
  }
}
