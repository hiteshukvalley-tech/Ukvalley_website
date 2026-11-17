import { getSession } from "@/lib/admin-session";
import { canUseArea } from "@/lib/admin-access";
import { openResume } from "@/lib/applications-store";

export const dynamic = "force-dynamic";

/** An applicant's resume (PDF). Signed-in admins only — never public. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // The proxy already gates /admin, but personal data deserves its own check.
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!canUseArea(session.role, session.access, "applications")) return new Response("Forbidden", { status: 403 });
  const { id } = await params;

  let resume;
  try {
    resume = await openResume(id);
  } catch {
    return new Response("The resume is temporarily unavailable.", { status: 503 });
  }
  if (!resume) return new Response("Not found", { status: 404 });

  const download = new URL(request.url).searchParams.has("download");
  // ASCII fallback (safe characters only, so a quote can't break the header)
  // plus the UTF-8 name (RFC 6266 / RFC 5987).
  const ascii = resume.name.replace(/[^A-Za-z0-9 ._()-]/g, "_") || "resume.pdf";
  const utf8 = encodeURIComponent(resume.name).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  return new Response(resume.stream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(resume.size),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${ascii}"; filename*=UTF-8''${utf8}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
