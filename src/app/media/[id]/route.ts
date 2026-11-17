import { isMediaId, readMedia } from "@/lib/media-store";

export const dynamic = "force-dynamic";

/** Public URL for an uploaded file: /media/<id>. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isMediaId(id)) return new Response("Not found", { status: 404 });

  let media;
  try {
    media = await readMedia(id);
  } catch {
    return new Response("Media is temporarily unavailable.", { status: 503 });
  }
  if (!media) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(media.bytes), {
    headers: {
      // The type was verified from the file's bytes at upload time.
      "Content-Type": media.item.type,
      "Content-Length": String(media.bytes.length),
      "X-Content-Type-Options": "nosniff",
      // An id's content never changes, so it can be cached for good.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
