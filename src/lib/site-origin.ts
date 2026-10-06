// The site's two public addresses, and which host names this server will
// trust from a request's Host / X-Forwarded-Host header. Those headers are set
// by the client, so anything built from them (links in emails, the admin's
// own-page fetches) must only use a host that is really this site — never an
// address an attacker chose.
//
// One Next.js app serves both:
//   SITE_URL  (frontend) — the public website: canonical links, sitemap, SEO, share previews
//   API_URL   (backend)  — the admin panel and server routes (/admin, /media, /careers/apply)
// Both are https://uat.ukvalley.com. Set NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_API_URL
// to change them (read at build time). If they ever differ, src/proxy.ts sends
// /admin to the backend address and public pages to the frontend address.

const clean = (u: string) => u.trim().replace(/\/+$/, "");

/** The public website: https://uat.ukvalley.com */
export const SITE_URL = clean(process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://uat.ukvalley.com");
/** The backend (admin panel and server routes); the same address as the website unless set. */
export const API_URL = clean(process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || SITE_URL);

const hostOf = (u: string) => {
  try {
    return new URL(u).hostname.toLowerCase();
  } catch {
    return "";
  }
};
export const SITE_HOST = hostOf(SITE_URL);

/**
 * The link-preview picture every page uses (WhatsApp, LinkedIn, Facebook, X…):
 * the logo centred on 1200×630, so square crops keep it whole. Built by
 * scripts/build-brand-assets.mjs. Change the file name when the picture
 * changes — chat apps cache previews by address.
 */
export const SHARE_IMAGE = {
  url: `${SITE_URL}/brand/share-image.png`,
  width: 1200,
  height: 630,
  alt: "Ukvalley Technologies logo",
  type: "image/png",
};
export const API_HOST = hostOf(API_URL);

/** Test deployments search engines must never index: uat./staging./dev./test. subdomains, Render's own address, this machine. */
const NON_PRODUCTION_HOST = /^(?:uat|staging|stage|dev|test)\.|\.onrender\.com$|^(?:localhost|127\.0\.0\.1|\[::1\])$/i;

/**
 * Whether search engines may index this deployment. Decided by the website
 * address: only a production domain is indexable. NEXT_PUBLIC_ALLOW_INDEXING=1
 * forces it on, =0 forces it off (read at build time). When false, robots.txt
 * blocks everything, every page carries noindex, and src/proxy.ts sends an
 * X-Robots-Tag: noindex header on every response.
 */
export function isIndexableHost(host: string, override = process.env.NEXT_PUBLIC_ALLOW_INDEXING): boolean {
  const flag = (override ?? "").trim().toLowerCase();
  if (flag === "1" || flag === "true") return true;
  if (flag === "0" || flag === "false") return false;
  return !!host && !NON_PRODUCTION_HOST.test(host);
}
export const SITE_INDEXABLE = isIndexableHost(SITE_HOST);

const PUBLIC_HOST = /^(?:[a-z0-9-]+\.)?ukvalley\.com$|\.onrender\.com$/i;
const LOCAL_HOST = /^(?:localhost|127\.0\.0\.1|\[::1\])$/i;

function isTrustedHost(host: string): boolean {
  const m = /^([\w.-]+|\[::1\])(?::(\d+))?$/.exec(host);
  if (!m) return false;
  const [, name, port] = m;
  // `next dev` on the local network (npm run dev:mobile opens it at 192.168.x.x).
  if (process.env.NODE_ENV === "development") return true;
  const lower = name.toLowerCase();
  if (PUBLIC_HOST.test(lower) || lower === SITE_HOST || lower === API_HOST) return true;
  // This machine: only the port the server itself listens on (when known), so
  // a forged "localhost:6379" can't reach other local services.
  return LOCAL_HOST.test(name) && (!process.env.PORT || !port || port === process.env.PORT);
}

/** `proto://host` of the request when its host is this site, else null. */
export function trustedRequestOrigin(h: Headers): string | null {
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim();
  if (!host || !isTrustedHost(host)) return null;
  const fwd = (h.get("x-forwarded-proto") ?? "").split(",")[0].trim().toLowerCase();
  const local = LOCAL_HOST.test(host.replace(/:\d+$/, ""));
  const proto = fwd === "http" || fwd === "https" ? fwd : local ? "http" : "https";
  return `${proto}://${host}`;
}
