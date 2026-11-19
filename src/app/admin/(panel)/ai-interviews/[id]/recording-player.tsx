"use client";

import { useEffect, useRef } from "react";
import { Play } from "lucide-react";

// The recording player and the "Play from here" buttons in the transcript.
//
// Browsers record WebM without a duration or seek index, so a fresh player
// shows no length and ignores seeks. The usual fix: on load, ask for a point
// far past the end; the browser then reads to the end (through range
// requests, which the recording route answers), learns the real duration and
// can seek anywhere. Then go back to the start.

const videoId = (segment: number) => `recording-part-${segment}`;

export function RecordingVideo({ src, segment }: { src: string; segment: number }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    let fixing = false;
    const onMeta = () => {
      if (Number.isFinite(v.duration)) return;
      fixing = true;
      v.currentTime = 1e101;
    };
    const onDuration = () => {
      if (!fixing || !Number.isFinite(v.duration)) return;
      fixing = false;
      // A jump asked for while the duration was being found wins over "back to the start".
      const pending = Number(v.dataset.pendingSeek);
      v.currentTime = Number.isFinite(pending) && pending > 0 ? pending : 0;
      delete v.dataset.pendingSeek;
      v.dataset.ready = "1";
    };
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("durationchange", onDuration);
    if (v.readyState >= 1) onMeta();
    return () => {
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("durationchange", onDuration);
    };
  }, []);
  return (
    <video id={videoId(segment)} ref={ref} controls preload="metadata" className="aspect-video w-full rounded-xl bg-black" src={src}>
      <track kind="captions" />
    </video>
  );
}

const clock = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;

/** Jumps the recording to where an answer starts and plays it. */
export function PlayFromHere({ segment, ms }: { segment: number; ms: number }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 text-uk-blue hover:underline"
      onClick={() => {
        const v = document.getElementById(videoId(segment)) as HTMLVideoElement | null;
        if (!v) return;
        v.scrollIntoView({ behavior: "smooth", block: "center" });
        const seconds = ms / 1000;
        if (Number.isFinite(v.duration)) v.currentTime = seconds;
        else v.dataset.pendingSeek = String(seconds);
        void v.play().catch(() => {});
      }}
    >
      <Play className="h-3 w-3" /> Play from {clock(ms)}{segment > 0 ? ` (part ${segment + 1})` : ""}
    </button>
  );
}
