import { getSession } from "@/lib/admin-session";
import { openResume } from "@/lib/applications-store";

export const dynamic = "force-dynamic";

/** An applicant's resume (PDF). Signed-in admins only — never public. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // The proxy already gates /admin, but personal data deserves its own check.
  if (!(await getSession())) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;

  let resume;
  try {
    resume = await openResume(id);
  } catch {
    return new Response("The resume is temporarily unavailable.", { status: 503 });
  }
  if (!resume) return new Response("Not found", { status: 404 });

  const download = new URL(request.url).searchParams.has("download");
  // ASCII fallback plus the UTF-8 name (RFC 6266).
  const ascii = resume.name.replace(/[^\x20-\x7e]/g, "_");
  return new Response(resume.stream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(resume.size),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(resume.name)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
