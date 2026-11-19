import { getSession } from "@/lib/admin-session";
import { ensureIntegrationKeys } from "@/lib/integration-keys";
import { canUseArea } from "@/lib/admin-access";
import { openSegment, parseRange } from "@/lib/ai-interview/recordings";
import { audit, getInterview } from "@/lib/ai-interview/store";

export const dynamic = "force-dynamic";

/**
 * Plays (or downloads) one segment of an interview recording, decrypted on
 * the fly. Signed-in HR with the "AI interviews" section only; recordings
 * have no public address. Every download is logged in the audit trail.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string; segment: string }> }) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!canUseArea(session.role, session.access, "ai-interviews")) return new Response("Forbidden", { status: 403 });
  const { id, segment } = await params;
  await ensureIntegrationKeys();
  const n = Number(segment);
  if (!Number.isInteger(n) || n < 0 || n > 100) return new Response("Not found", { status: 404 });
  const i = await getInterview(id);
  if (!i || i.recording.deletedAt) return new Response("Not found", { status: 404 });
  const download = new URL(request.url).searchParams.has("download");
  // The player asks for byte ranges to seek ("Range: bytes=…"); a download is always the whole file.
  const rangeHeader = download ? null : request.headers.get("range");
  let unsatisfiable = false;
  let rec;
  try {
    rec = await openSegment(id, n, (size) => {
      const r = parseRange(rangeHeader, size);
      if (r === null) unsatisfiable = true;
      return r ?? undefined;
    });
  } catch {
    return new Response("The recording is temporarily unavailable.", { status: 503 });
  }
  if (!rec) return new Response("Not found", { status: 404 });
  const common = { "Accept-Ranges": "bytes", "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store" };
  if (unsatisfiable) {
    await rec.stream.cancel();
    return new Response(null, { status: 416, headers: { ...common, "Content-Range": `bytes */${rec.size}` } });
  }
  if (download) await audit({ interviewId: id, applicationId: i.applicationId, candidateName: i.candidate.name, action: "recording_downloaded", by: session.email, detail: `segment ${n}` });
  const ext = rec.mime.includes("mp4") ? "mp4" : "webm";
  const disposition = `${download ? "attachment" : "inline"}; filename="interview-${id.slice(0, 8)}-part${n + 1}.${ext}"`;
  if (rec.range) {
    return new Response(rec.stream, {
      status: 206,
      headers: {
        ...common,
        "Content-Type": rec.mime,
        "Content-Length": String(rec.range.end - rec.range.start + 1),
        "Content-Range": `bytes ${rec.range.start}-${rec.range.end}/${rec.size}`,
        "Content-Disposition": disposition,
      },
    });
  }
  return new Response(rec.stream, {
    headers: { ...common, "Content-Type": rec.mime, "Content-Length": String(rec.size), "Content-Disposition": disposition },
  });
}
