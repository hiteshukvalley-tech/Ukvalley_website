"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

// Integrity checks during the interview. Each only raises a flag for HR to look
// at; none of them stops the interview or rejects the candidate, and none is
// sent to the AI evaluator.
//
// Face count uses the browser's built-in FaceDetector (Shape Detection API)
// where the browser offers it: it counts faces on the device, nothing leaves
// the browser, and it never looks at expressions or identity. Browsers without
// it simply skip the check.

type FaceDetectorLike = { detect: (source: HTMLVideoElement) => Promise<unknown[]> };
type FaceDetectorCtor = new (opts?: { fastMode?: boolean; maxDetectedFaces?: number }) => FaceDetectorLike;

const SAMPLE_MS = 4000;
/** consecutive samples before a flag (so a moment out of frame is not flagged) */
const MULTI_SAMPLES = 2;
const NONE_SAMPLES = 4;
/** at most one flag of a kind per this long */
const FLAG_GAP_MS = 60_000;

export function faceDetectionSupported(): boolean {
  return typeof window !== "undefined" && typeof (window as unknown as { FaceDetector?: unknown }).FaceDetector === "function";
}

export function useFaceWatch(video: RefObject<HTMLVideoElement | null>, enabled: boolean, flag: (kind: "multiple_faces" | "no_face", detail: string) => void) {
  const flagRef = useRef(flag);
  useEffect(() => {
    flagRef.current = flag;
  }, [flag]);

  useEffect(() => {
    if (!enabled || !faceDetectionSupported()) return;
    let detector: FaceDetectorLike;
    try {
      const Ctor = (window as unknown as { FaceDetector: FaceDetectorCtor }).FaceDetector;
      detector = new Ctor({ fastMode: true, maxDetectedFaces: 3 });
    } catch {
      return;
    }
    let multi = 0;
    let none = 0;
    const last: Record<string, number> = {};
    let busy = false;
    let broken = 0;
    const raise = (kind: "multiple_faces" | "no_face", detail: string) => {
      const now = Date.now();
      if (now - (last[kind] ?? 0) < FLAG_GAP_MS) return;
      last[kind] = now;
      flagRef.current(kind, detail);
    };
    const t = setInterval(async () => {
      const v = video.current;
      if (busy || !v || v.readyState < 2 || document.visibilityState !== "visible") return;
      busy = true;
      try {
        const faces = (await detector.detect(v)).length;
        broken = 0;
        multi = faces > 1 ? multi + 1 : 0;
        none = faces === 0 ? none + 1 : 0;
        if (multi === MULTI_SAMPLES) raise("multiple_faces", `${faces} faces`);
        if (none === NONE_SAMPLES) raise("no_face", `about ${Math.round((NONE_SAMPLES * SAMPLE_MS) / 1000)} s`);
      } catch {
        // Some browsers expose the API but can't run it: stop after a few failures.
        if (++broken >= 3) clearInterval(t);
      } finally {
        busy = false;
      }
    }, SAMPLE_MS);
    return () => clearInterval(t);
  }, [enabled, video]);
}

/**
 * Whether the browser is online. When the connection comes back, `onBack` is
 * called with how long it was gone (so it can be flagged and recorded as a
 * technical problem, not counted against the answers).
 */
export function useOnline(onBack: (offlineMs: number) => void): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const since = useRef<number | null>(null);
  const cb = useRef(onBack);
  useEffect(() => {
    cb.current = onBack;
  }, [onBack]);
  useEffect(() => {
    const off = () => {
      since.current = Date.now();
      setOnline(false);
    };
    const on = () => {
      setOnline(true);
      if (since.current !== null) cb.current(Date.now() - since.current);
      since.current = null;
    };
    window.addEventListener("offline", off);
    window.addEventListener("online", on);
    return () => {
      window.removeEventListener("offline", off);
      window.removeEventListener("online", on);
    };
  }, []);
  return online;
}
