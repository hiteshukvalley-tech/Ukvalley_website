import { Readable } from "node:stream";
import { GridFSBucket, ObjectId } from "mongodb";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";

// Files live in MongoDB GridFS (collections media.files / media.chunks), so the
// library works on any host with no extra storage account. Public URL: /media/<id>.

const BUCKET = "media";

/** Per-file limit. Kept under common serverless request-body limits (4.5 MB). */
export const MAX_FILE_BYTES = 4 * 1024 * 1024;
export const MAX_FILES_PER_UPLOAD = 10;

export type MediaType = "image/png" | "image/jpeg" | "image/gif" | "image/webp" | "image/avif";

export const MEDIA_EXTENSIONS: Record<MediaType, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
};

/**
 * Detects the real image type from the file's first bytes — the browser's
 * claimed type and the file extension are not trusted. SVG is deliberately
 * not allowed: it can carry scripts.
 */
export function sniffImageType(b: Uint8Array): MediaType | null {
  const is = (offset: number, ...bytes: number[]) => bytes.every((v, i) => b[offset + i] === v);
  if (b.length < 12) return null;
  if (is(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (is(0, 0xff, 0xd8, 0xff)) return "image/jpeg";
  if (is(0, 0x47, 0x49, 0x46, 0x38) && (b[4] === 0x37 || b[4] === 0x39) && b[5] === 0x61) return "image/gif";
  if (is(0, 0x52, 0x49, 0x46, 0x46) && is(8, 0x57, 0x45, 0x42, 0x50)) return "image/webp";
  // AVIF: an "ftyp" box at offset 4 with an avif/avis brand.
  if (is(4, 0x66, 0x74, 0x79, 0x70) && (is(8, 0x61, 0x76, 0x69, 0x66) || is(8, 0x61, 0x76, 0x69, 0x73))) return "image/avif";
  return null;
}

/** One file's outcome in an upload response. */
export type UploadResult = { name: string; ok: boolean; id?: string; error?: string };

export type MediaItem = {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
};

type FileDoc = {
  _id: ObjectId;
  length: number;
  filename: string;
  uploadDate: Date;
  metadata?: { contentType?: string };
};

const bucket = () => new GridFSBucket(getDb(), { bucketName: BUCKET });
const files = () => getDb().collection<FileDoc>(`${BUCKET}.files`);

const toItem = (d: FileDoc): MediaItem => ({
  id: d._id.toHexString(),
  name: d.filename,
  size: d.length,
  type: d.metadata?.contentType ?? "application/octet-stream",
  uploadedAt: d.uploadDate,
});

/** Strips any path and control characters; keeps names short and readable. */
export function cleanFileName(raw: string, type: MediaType): string {
  const base = raw.split(/[\\/]/).pop() ?? "";
  const name = base.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 120);
  return name || `image.${MEDIA_EXTENSIONS[type]}`;
}

export const isMediaId = (id: string) => /^[a-f0-9]{24}$/.test(id);

export async function saveMedia(bytes: Uint8Array, rawName: string, type: MediaType): Promise<string> {
  const name = cleanFileName(rawName, type);
  const stream = bucket().openUploadStream(name, { metadata: { contentType: type } });
  await new Promise<void>((resolve, reject) => {
    stream.once("finish", () => resolve());
    stream.once("error", reject);
    stream.end(Buffer.from(bytes));
  });
  return stream.id.toHexString();
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Admin list: newest first, optional filename search. */
export async function listMedia(opts: { q?: string; page?: number; pageSize?: number } = {}): Promise<{
  items: MediaItem[];
  total: number;
  totalBytes: number;
  dbError?: string;
}> {
  if (!hasDatabaseUrl()) return { items: [], total: 0, totalBytes: 0, dbError: "MONGODB_URI is not set." };
  const pageSize = opts.pageSize ?? 24;
  const page = Math.max(1, opts.page ?? 1);
  const needle = opts.q?.trim();
  const filter = needle ? { filename: { $regex: escapeRegex(needle.slice(0, 100)), $options: "i" } } : {};
  try {
    const [docs, total, sums] = await Promise.all([
      files().find(filter).sort({ uploadDate: -1 }).skip((page - 1) * pageSize).limit(pageSize).toArray(),
      files().countDocuments(filter),
      files().aggregate<{ bytes: number }>([{ $group: { _id: null, bytes: { $sum: "$length" } } }]).toArray(),
    ]);
    return { items: docs.map(toItem), total, totalBytes: sums[0]?.bytes ?? 0 };
  } catch (e) {
    return { items: [], total: 0, totalBytes: 0, dbError: e instanceof Error ? e.message : "Could not read media." };
  }
}

/** Number of files in the library, or null when it can't be read. */
export async function countMedia(): Promise<number | null> {
  if (!hasDatabaseUrl()) return null;
  try {
    return await files().estimatedDocumentCount();
  } catch {
    return null;
  }
}

/** File info plus a web stream of its bytes, or null when it doesn't exist. */
export async function openMedia(id: string): Promise<{ item: MediaItem; stream: ReadableStream<Uint8Array> } | null> {
  if (!hasDatabaseUrl() || !isMediaId(id)) return null;
  const oid = new ObjectId(id);
  const doc = await files().findOne({ _id: oid });
  if (!doc) return null;
  const stream = Readable.toWeb(bucket().openDownloadStream(oid)) as unknown as ReadableStream<Uint8Array>;
  return { item: toItem(doc), stream };
}

export async function deleteMedia(id: string): Promise<boolean> {
  if (!isMediaId(id)) return false;
  try {
    await bucket().delete(new ObjectId(id));
    return true;
  } catch (e) {
    // GridFS throws "File not found" when the file is already gone; anything
    // else (e.g. the database is unreachable) is a real failure.
    if (e instanceof Error && /file not found/i.test(e.message)) return false;
    throw e;
  }
}
