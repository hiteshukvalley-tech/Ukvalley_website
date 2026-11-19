// HTTP byte ranges for recording playback (seeking). Pure: no server imports, so tests can load it.

/** A byte range of a segment, both ends included (as in an HTTP Range header). */
export type ByteRange = { start: number; end: number };

/**
 * Reads an HTTP Range header ("bytes=0-", "bytes=500-999", "bytes=-500")
 * against a file of `size` bytes. Undefined = no (or an ignored multi-) range:
 * send the whole file. Null = the range can't be satisfied (416).
 */
export function parseRange(header: string | null, size: number): ByteRange | null | undefined {
  if (!header) return undefined;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (!m[1] && !m[2])) return undefined;
  if (!m[1]) {
    const n = Number(m[2]);
    if (n <= 0) return null;
    return { start: Math.max(0, size - n), end: size - 1 };
  }
  const start = Number(m[1]);
  const end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
  if (start >= size || end < start) return null;
  return { start, end };
}
