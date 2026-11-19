"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Records the candidate's camera and microphone with MediaRecorder and uploads
// a chunk every few seconds. Each chunk is kept in IndexedDB until the server
// confirms it, so a dropped connection or a closed tab doesn't lose the
// recording: pending chunks are retried with back-off, and leftovers from an
// earlier visit are uploaded when the page opens again.

const TIMESLICE_MS = 5000;
const DB_NAME = "uk-interview-recording";
const STORE = "chunks";

type Pending = { key: string; token: string; segment: number; seq: number; mime: string; blob: Blob };

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "key" });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idb<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/** The best format this browser can record. */
export function pickMime(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  const options = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4;codecs=avc1,mp4a", "video/mp4"];
  return options.find((m) => MediaRecorder.isTypeSupported(m)) ?? null;
}

export type RecorderStatus = { recording: boolean; pending: number; uploaded: number; failed: boolean; startedAt: number | null };

export function useRecorder(token: string) {
  const recorder = useRef<MediaRecorder | null>(null);
  const seq = useRef(0);
  const queue = useRef<Pending[]>([]);
  const busy = useRef(false);
  const started = useRef<number | null>(null);
  const [status, setStatus] = useState<RecorderStatus>({ recording: false, pending: 0, uploaded: 0, failed: false, startedAt: null });

  const refresh = useCallback(() => setStatus((s) => ({ ...s, pending: queue.current.length })), []);

  const pump = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    let delay = 1000;
    try {
      while (queue.current.length) {
        const c = queue.current[0];
        let ok = false;
        try {
          const res = await fetch(`/interview/${token}/api/recording?segment=${c.segment}&seq=${c.seq}`, {
            method: "POST",
            headers: { "Content-Type": c.mime.split(";")[0] },
            body: c.blob,
          });
          // 4xx other than 429 won't succeed on retry (e.g. the interview ended long ago): drop the chunk.
          ok = res.ok || (res.status >= 400 && res.status < 500 && res.status !== 429);
          if (!res.ok && ok) console.warn(`[interview] recording part ${c.segment}/${c.seq} was refused (${res.status}) and dropped`);
        } catch {
          ok = false;
        }
        if (ok) {
          queue.current.shift();
          await idb("readwrite", (s) => s.delete(c.key));
          delay = 1000;
          setStatus((s) => ({ ...s, pending: queue.current.length, uploaded: s.uploaded + 1, failed: false }));
        } else {
          setStatus((s) => ({ ...s, failed: true }));
          await new Promise((r) => setTimeout(r, delay));
          delay = Math.min(delay * 2, 30_000);
        }
      }
    } finally {
      busy.current = false;
    }
  }, [token]);

  // Upload chunks left over from an earlier visit (closed tab, crash).
  useEffect(() => {
    void (async () => {
      const all = (await idb<Pending[]>("readonly", (s) => s.getAll() as IDBRequest<Pending[]>)) ?? [];
      const mine = all.filter((c) => c.token === token).sort((a, b) => a.segment - b.segment || a.seq - b.seq);
      if (mine.length) {
        queue.current.push(...mine);
        refresh();
        void pump();
      }
    })();
  }, [token, pump, refresh]);

  const start = useCallback(
    (stream: MediaStream, segment: number) => {
      const mime = pickMime();
      if (!mime) return false;
      // A recorder still running (same segment) is kept; one that stopped by itself
      // (its camera tracks ended after a re-check, or an error) is replaced.
      if (recorder.current && recorder.current.state !== "inactive") return false;
      recorder.current = null;
      const r = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 350_000, audioBitsPerSecond: 48_000 });
      const ended = () => {
        if (recorder.current !== r) return;
        recorder.current = null;
        started.current = null;
        setStatus((s) => ({ ...s, recording: false }));
      };
      r.addEventListener("stop", ended);
      r.addEventListener("error", ended);
      seq.current = 0;
      r.ondataavailable = (e) => {
        if (!e.data || e.data.size === 0) return;
        const c: Pending = { key: `${token}:${segment}:${seq.current}`, token, segment, seq: seq.current++, mime: r.mimeType || mime, blob: e.data };
        queue.current.push(c);
        void idb("readwrite", (s) => s.put(c));
        refresh();
        void pump();
      };
      r.start(TIMESLICE_MS);
      recorder.current = r;
      started.current = Date.now();
      setStatus((s) => ({ ...s, recording: true, startedAt: started.current }));
      return true;
    },
    [token, pump, refresh]
  );

  /** Stops recording and waits (up to `timeoutMs`) for every chunk to upload. Returns true when all are uploaded. */
  const stop = useCallback(
    async (timeoutMs = 60_000): Promise<boolean> => {
      const r = recorder.current;
      if (r && r.state !== "inactive") {
        await new Promise<void>((resolve) => {
          r.addEventListener("stop", () => resolve(), { once: true });
          r.stop();
        });
      }
      recorder.current = null;
      setStatus((s) => ({ ...s, recording: false }));
      const until = Date.now() + timeoutMs;
      while (queue.current.length && Date.now() < until) {
        void pump();
        await new Promise((res) => setTimeout(res, 500));
      }
      return queue.current.length === 0;
    },
    [pump]
  );

  /** Milliseconds since this segment started (for jumping to an answer in the recording). */
  const offset = useCallback(() => (started.current ? Date.now() - started.current : undefined), []);

  return { status, start, stop, offset };
}
