import "server-only";
import { GridFSBucket, ObjectId } from "mongodb";
import { DeleteObjectsCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { decryptBytes, encryptBytes } from "./crypto";
import type { ByteRange } from "./range";
export { parseRange, type ByteRange } from "./range";
import { ensureIntegrationKeys, integrationKey, integrationKeysReady, keysFingerprint } from "@/lib/integration-keys";

// Interview recordings. Server-only.
//
// The browser records with MediaRecorder and uploads a chunk every few
// seconds, so a dropped connection loses seconds, not the interview. Every
// chunk is encrypted (AES-256-GCM, see crypto.ts) before it is stored, in one
// of two private stores:
//   RECORDING_STORAGE=gridfs (default)  MongoDB GridFS bucket "aiRecordings"
//   RECORDING_STORAGE=s3                a private S3 bucket (AWS_* env vars)
// Nothing is ever public: HR plays a recording through an admin-only route
// that decrypts it on the fly. Each run of MediaRecorder is a "segment" (a
// new one starts after an interruption); its chunks joined in order are one
// playable WebM file.

const META = "aiInterviewRecordings";
const BUCKET = "aiRecordings";

/** Largest chunk accepted. MediaRecorder at the portal's bitrate makes about 0.5 MB per 10 s. */
export const CHUNK_MAX_BYTES = 8 * 1024 * 1024;
/** Upper bound per interview (protects the database from a runaway client). */
export const INTERVIEW_MAX_BYTES = 900 * 1024 * 1024;
export const SEGMENT_MAX = 20;
export const SEQ_MAX = 5000;

type ChunkDoc = {
  _id: string;
  interviewId: string;
  segment: number;
  seq: number;
  size: number;
  mime: string;
  storage: "gridfs" | "s3";
  /** GridFS file id, or S3 object key */
  ref: string;
  at: Date;
};

const meta = () => getDb().collection<ChunkDoc>(META);
const bucket = () => new GridFSBucket(getDb(), { bucketName: BUCKET });
export const storageKind = (): "gridfs" | "s3" => (integrationKey("RECORDING_STORAGE") === "s3" ? "s3" : "gridfs");

// Settings come from Site settings → API keys, else .env. The client is rebuilt when they change.
let s3: { client: S3Client; fp: string } | null = null;
export function s3Client(): { client: S3Client; bucket: string } {
  const name = integrationKey("S3_RECORDINGS_BUCKET");
  if (!name) throw new Error("The S3 bucket is not set (Site settings → API keys).");
  const fp = keysFingerprint("AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY");
  if (!s3 || s3.fp !== fp) {
    const accessKeyId = integrationKey("AWS_ACCESS_KEY_ID");
    const secretAccessKey = integrationKey("AWS_SECRET_ACCESS_KEY");
    s3 = {
      client: new S3Client({
        region: integrationKey("AWS_REGION") || "ap-south-1",
        // Without keys here, the SDK's own chain applies (an IAM role on the host, for example).
        ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
      }),
      fp,
    };
  }
  return { client: s3.client, bucket: name };
}

let indexed: Promise<unknown> | null = null;
const ensureIndexes = () => (indexed ??= meta().createIndex({ interviewId: 1, segment: 1, seq: 1 }).catch(() => (indexed = null)));

/** Stores one chunk. Uploading the same chunk again (a retry) is a no-op. Returns false for a duplicate. */
export async function saveChunk(interviewId: string, segment: number, seq: number, bytes: Uint8Array, mime: string): Promise<boolean> {
  await ensureIndexes();
  const id = `${interviewId}:${segment}:${seq}`;
  if (await meta().findOne({ _id: id }, { projection: { _id: 1 } })) return false;
  // The recording key may be saved only in the admin (Settings → API keys).
  // Encrypting before those keys have loaded would use a different key and
  // the chunk could never be played; fail instead, and the browser retries.
  await ensureIntegrationKeys();
  if (!integrationKeysReady()) throw new Error("The saved API keys have not loaded yet.");
  const sealed = encryptBytes(bytes);
  const kind = storageKind();
  let ref: string;
  if (kind === "s3") {
    const { client, bucket: name } = s3Client();
    ref = `ai-interviews/${interviewId}/${segment}/${String(seq).padStart(5, "0")}.bin`;
    await client.send(new PutObjectCommand({ Bucket: name, Key: ref, Body: sealed, ContentType: "application/octet-stream", ServerSideEncryption: "AES256" }));
  } else {
    const up = bucket().openUploadStream(id, { metadata: { interviewId } });
    await new Promise<void>((resolve, reject) => {
      up.once("finish", () => resolve());
      up.once("error", reject);
      up.end(sealed);
    });
    ref = up.id.toHexString();
  }
  try {
    await meta().insertOne({ _id: id, interviewId, segment, seq, size: bytes.length, mime, storage: kind, ref, at: new Date() });
  } catch (e) {
    // Two uploads of the same chunk raced: keep the first, drop this copy.
    await removeStored([{ storage: kind, ref }]).catch(() => {});
    if ((e as { code?: number }).code === 11000) return false;
    throw e;
  }
  return true;
}

async function readStored(c: Pick<ChunkDoc, "storage" | "ref">): Promise<Buffer> {
  if (c.storage === "s3") {
    const { client, bucket: name } = s3Client();
    const out = await client.send(new GetObjectCommand({ Bucket: name, Key: c.ref }));
    return Buffer.from(await out.Body!.transformToByteArray());
  }
  const parts: Buffer[] = [];
  for await (const p of bucket().openDownloadStream(new ObjectId(c.ref))) parts.push(p as Buffer);
  return Buffer.concat(parts);
}

async function removeStored(chunks: Pick<ChunkDoc, "storage" | "ref">[]) {
  const s3Keys = chunks.filter((c) => c.storage === "s3").map((c) => c.ref);
  for (let i = 0; i < s3Keys.length; i += 1000) {
    const { client, bucket: name } = s3Client();
    await client.send(new DeleteObjectsCommand({ Bucket: name, Delete: { Objects: s3Keys.slice(i, i + 1000).map((Key) => ({ Key })) } }));
  }
  for (const c of chunks.filter((x) => x.storage === "gridfs")) {
    if (ObjectId.isValid(c.ref)) await bucket().delete(new ObjectId(c.ref)).catch(() => {});
  }
}

export type SegmentInfo = { segment: number; chunks: number; bytes: number; mime: string; from: Date; to: Date; missing: number[] };

/** The recording's segments, with any chunk numbers missing (a lost upload). */
export async function listSegments(interviewId: string): Promise<SegmentInfo[]> {
  if (!hasDatabaseUrl()) return [];
  const rows = await meta()
    .aggregate<{ _id: number; chunks: number; bytes: number; mime: string; from: Date; to: Date; seqs: number[] }>([
      { $match: { interviewId } },
      { $group: { _id: "$segment", chunks: { $sum: 1 }, bytes: { $sum: "$size" }, mime: { $first: "$mime" }, from: { $min: "$at" }, to: { $max: "$at" }, seqs: { $push: "$seq" } } },
      { $sort: { _id: 1 } },
    ])
    .toArray();
  return rows.map((r) => {
    const have = new Set(r.seqs);
    const max = Math.max(...r.seqs);
    const missing: number[] = [];
    for (let i = 0; i <= max && missing.length < 50; i++) if (!have.has(i)) missing.push(i);
    return { segment: r._id, chunks: r.chunks, bytes: r.bytes, mime: r.mime, from: r.from, to: r.to, missing };
  });
}

/**
 * One segment as a decrypted stream (chunks in order), whole or a byte range.
 * Only the chunks that overlap the range are read and decrypted, so the
 * player can seek (each seek is a range request) without downloading the
 * whole recording. Chunk sizes are stored decrypted, so offsets are exact.
 * Null when the segment has no chunks.
 */
export async function openSegment(
  interviewId: string,
  segment: number,
  range?: (size: number) => ByteRange | undefined
): Promise<{ mime: string; size: number; range?: ByteRange; stream: ReadableStream<Uint8Array> } | null> {
  const chunks = await meta().find({ interviewId, segment }).sort({ seq: 1 }).toArray();
  if (!chunks.length) return null;
  const size = chunks.reduce((s, c) => s + c.size, 0);
  const want = range?.(size);
  const from = want?.start ?? 0;
  const to = want?.end ?? size - 1;
  // Where each chunk starts in the joined file.
  const parts: { chunk: ChunkDoc; at: number }[] = [];
  let at = 0;
  for (const c of chunks) {
    if (at + c.size > from && at <= to) parts.push({ chunk: c, at });
    at += c.size;
  }
  let i = 0;
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (i >= parts.length) {
        controller.close();
        return;
      }
      try {
        const { chunk, at: offset } = parts[i++];
        const bytes = decryptBytes(await readStored(chunk));
        // Trim the first and last chunk to the range.
        controller.enqueue(bytes.subarray(Math.max(0, from - offset), Math.min(bytes.length, to - offset + 1)));
      } catch (e) {
        controller.error(e);
      }
    },
  });
  return { mime: chunks[0].mime, size, ...(want ? { range: want } : {}), stream };
}

/** Deletes every chunk of an interview's recording. Returns how many were removed. */
export async function deleteRecording(interviewId: string): Promise<number> {
  if (!hasDatabaseUrl()) return 0;
  const chunks = await meta().find({ interviewId }, { projection: { storage: 1, ref: 1 } }).toArray();
  await removeStored(chunks);
  await meta().deleteMany({ interviewId });
  return chunks.length;
}

/** Bytes stored for an interview so far (for the upload limit). */
export async function recordedBytes(interviewId: string): Promise<number> {
  const [row] = await meta()
    .aggregate<{ n: number }>([{ $match: { interviewId } }, { $group: { _id: null, n: { $sum: "$size" } } }])
    .toArray();
  return row?.n ?? 0;
}
