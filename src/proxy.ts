import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/admin-auth";

// Gate every /admin page behind the signed session cookie. The login page is
// the only public admin URL. (Server actions re-check the session, and the user in the database, themselves.)
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  // cookie alone would loop for a disabled account.
  if (pathname === "/admin/login") return NextResponse.next();
  if (!authed) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Any casing of "admin" reaches the proxy so it can be canonicalised above.
  matcher: ["/((?:[Aa][Dd][Mm][Ii][Nn]))", "/((?:[Aa][Dd][Mm][Ii][Nn]))/:path*"],
};
