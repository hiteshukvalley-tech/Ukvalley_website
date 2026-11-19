import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/admin-auth";
import { canOpenPath } from "@/lib/admin-access";
import { API_HOST, API_URL, SITE_HOST, SITE_INDEXABLE, SITE_URL } from "@/lib/site-origin";

/**
 * What the backend address (API_URL) serves itself; any other page there goes
 * to the website. Interview links (/interview/<token> and its API) work on
 * both addresses: INTERVIEW_BASE_URL may point at either, and a redirect would
 * turn the portal's POSTs into cross-site requests.
 */
const BACKEND_PATH = /^\/(?:admin(?:\/|$)|hr(?:\/|$)|interview\/|media\/|careers\/apply$|whatsapp\/webhook$|_next\/|brand\/|favicon\.ico$|icon\.png$|apple-icon\.png$|robots\.txt$)/i;

const requestHost = (request: NextRequest) =>
  (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").split(",")[0].trim().replace(/:\d+$/, "").toLowerCase();

const isAdminPath = (p: string) => /^\/admin(?:\/|$)/i.test(p);

export async function proxy(request: NextRequest) {
  const response = await route(request);
  // Keep search engines out: of the admin always, of everything on a test
  // deployment (see SITE_INDEXABLE). The header covers responses with no
  // <meta name="robots"> — redirects, files, route handlers.
  if (!SITE_INDEXABLE || isAdminPath(request.nextUrl.pathname)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

async function route(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = requestHost(request);

  // Two addresses, one app. Only on the real domains — localhost, *.onrender.com
  // and any other host serve everything as before.
  if (host && host === SITE_HOST && host !== API_HOST && isAdminPath(pathname)) {
    // The admin panel lives on the backend address.
    return NextResponse.redirect(`${API_URL}${pathname}${search}`, 308);
  }
  if (host && host === API_HOST && host !== SITE_HOST) {
    if (pathname === "/") return NextResponse.redirect(`${API_URL}/admin`, 307);
    // Public pages live on the website address.
    if (!BACKEND_PATH.test(pathname)) return NextResponse.redirect(`${SITE_URL}${pathname}${search}`, 308);
  }

  // The HR panel address (as on GrowthValley): /hr opens the HR sign-in, and
  // /hr/<page> the same page of the panel. HR staff see only their sections.
  if (/^\/hr(?:\/|$)/i.test(pathname)) {
    const rest = pathname.replace(/^\/hr/i, "");
    const url = request.nextUrl.clone();
    url.pathname = rest === "" || rest === "/" ? "/admin/login" : `/admin${rest}`;
    if (url.pathname === "/admin/login") url.searchParams.set("panel", "hr");
    return NextResponse.redirect(url);
  }

  if (!isAdminPath(pathname)) return NextResponse.next();

  // Gate every /admin page behind the signed session cookie. The login page is
  // the only public admin URL. (Server actions re-check the session, and the user in the database, themselves.)

  // /Admin, /ADMIN/login … → canonical lowercase URL. (A next.config redirect
  // can't do this: Next matches redirect sources case-insensitively, so
  // /admin -> /admin looped forever.)
  if (pathname !== pathname.toLowerCase()) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.toLowerCase();
    return NextResponse.redirect(url);
  }
  const authed = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value
  );

  // The login page decides for itself whether to forward a signed-in user
  // (it can check the database; this proxy can't). Redirecting here on the
  // cookie alone would loop for a disabled account. "Forgot password" is
  // public too.
  if (pathname === "/admin/login" || pathname === "/admin/forgot-password") return NextResponse.next();
  // The HR REST API (/admin/api/…) answers in JSON, never with a redirect to a page.
  const api = /^\/admin\/api\//.test(pathname);
  const apiError = (status: number, error: string) =>
    NextResponse.json({ ok: false, error }, { status, headers: { "Cache-Control": "no-store" } });
  if (!authed) {
    if (api) return apiError(401, "Sign in to the admin panel first.");
    // On the real domain, send people to its own login address (request.url can
    // carry the server's internal host behind the host's proxy).
    return NextResponse.redirect(host && host === API_HOST ? `${API_URL}/admin/login` : new URL("/admin/login", request.url));
  }
  // Team members only open the sections ticked for them in Admin → Users
  // (the cookie carries the list; server actions re-check it in the database).
  if (!canOpenPath(authed.role, authed.access, pathname)) {
    if (api) return apiError(403, "You don't have access to this section.");
    return NextResponse.redirect(host && host === API_HOST ? `${API_URL}/admin?denied=1` : new URL("/admin?denied=1", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Every page and route (for the two-address routing above), except build
  // assets and the image optimiser.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
