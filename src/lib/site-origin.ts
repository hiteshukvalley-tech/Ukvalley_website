// Which host names this server will trust from a request's Host /
// X-Forwarded-Host header. Those headers are set by the client, so anything
// built from them (links in emails, the admin's own-page fetches) must only use
// a host that is really this site — never an address an attacker chose.

/** The public site address; override with SITE_URL (e.g. a staging domain). */
export const SITE_ORIGIN = (process.env.SITE_URL || "https://ukvalley.com").replace(/\/+$/, "");

const PUBLIC_HOST = /^(?:www\.)?ukvalley\.com$|\.onrender\.com$/i;
const LOCAL_HOST = /^(?:localhost|127\.0\.0\.1|\[::1\])$/i;

function isTrustedHost(host: string): boolean {
  const m = /^([\w.-]+|\[::1\])(?::(\d+))?$/.exec(host);
  if (!m) return false;
  const [, name, port] = m;
  // `next dev` on the local network (npm run dev:mobile opens it at 192.168.x.x).
  if (process.env.NODE_ENV === "development") return true;
  if (PUBLIC_HOST.test(name)) return true;
  try {
    if (name.toLowerCase() === new URL(SITE_ORIGIN).hostname.toLowerCase()) return true;
  } catch {}
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
