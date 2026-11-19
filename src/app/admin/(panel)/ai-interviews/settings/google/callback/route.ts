import { cookies } from "next/headers";
import { getSession } from "@/lib/admin-session";
import { ensureIntegrationKeys } from "@/lib/integration-keys";
import { canUseArea } from "@/lib/admin-access";
import { API_URL, trustedRequestOrigin } from "@/lib/site-origin";
import { sameHash } from "@/lib/ai-interview/crypto";
import { completeConnection } from "@/lib/ai-interview/google-calendar";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "uk_google_oauth_state";

/** Google sends the admin back here with a code; the state must match the cookie set by /connect. */
export async function GET(request: Request) {
  const origin = trustedRequestOrigin(request.headers) ?? API_URL;
  const back = (r: string) => Response.redirect(`${origin}/admin/ai-interviews/settings?google=${r}`, 302);
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!canUseArea(session.role, session.access, "ai-interviews")) return new Response("Forbidden", { status: 403 });
  await ensureIntegrationKeys();

  const url = new URL(request.url);
  const jar = await cookies();
  const expected = jar.get(STATE_COOKIE)?.value ?? "";
  jar.delete({ name: STATE_COOKIE, path: "/admin/ai-interviews/settings/google" });
  const state = url.searchParams.get("state") ?? "";
  const code = url.searchParams.get("code");
  if (!expected || !code || !sameHash(state, expected)) return back("error");
  try {
    await completeConnection(origin, code, session.email);
    return back("connected");
  } catch (e) {
    console.error("[ai-interview] Google connection failed:", e instanceof Error ? e.message : e);
    return back("error");
  }
}
