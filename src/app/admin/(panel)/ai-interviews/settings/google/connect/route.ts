import { cookies } from "next/headers";
import { getSession } from "@/lib/admin-session";
import { ensureIntegrationKeys } from "@/lib/integration-keys";
import { canUseArea } from "@/lib/admin-access";
import { API_URL, trustedRequestOrigin } from "@/lib/site-origin";
import { randomState } from "@/lib/ai-interview/crypto";
import { authUrl, googleConfigured } from "@/lib/ai-interview/google-calendar";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "uk_google_oauth_state";

/** Starts "Connect Google Calendar": a random state in a short-lived cookie, then Google's consent screen. */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!canUseArea(session.role, session.access, "ai-interviews")) return new Response("Forbidden", { status: 403 });
  await ensureIntegrationKeys();
  if (!googleConfigured()) return new Response("The Google client ID and secret are not set (Site settings → API keys).", { status: 503 });
  const origin = trustedRequestOrigin(request.headers) ?? API_URL;
  const state = randomState();
  (await cookies()).set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin/ai-interviews/settings/google",
    maxAge: 600,
  });
  return Response.redirect(authUrl(origin, state), 302);
}
