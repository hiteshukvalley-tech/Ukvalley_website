"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tx } from "@/components/site/texts-context";

export type GalleryPhoto = { src: string; alt: string; /** Tailwind object-position class for the carousel crop */ focus?: string };

const AUTOPLAY_MS = 5000;

/**
 * Fade carousel for a group of photos: one large 16:9 picture at a time with a
 * caption badge, round arrows, dots and autoplay (paused while hovered, while
 * the tab is hidden and for visitors who prefer reduced motion). Click the
 * picture to open it whole in a viewer. Plain <img>: static files, and the
 * admin may use any address.
 */
export function PhotoCarousel({ photos, caption }: { photos: GalleryPhoto[]; caption?: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [viewer, setViewer] = useState(false);
  const [reduced, setReduced] = useState(false);
  const count = photos.length;
  const touchX = useRef<number | null>(null);

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // One-time read of a browser setting after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(mq.matches);
  }, []);

  // Autoplay; the timer restarts whenever the slide changes (so a manual click
  // gets a full 5 seconds before the next one).
  useEffect(() => {
    if (count < 2 || paused || viewer || reduced) return;
    const t = window.setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % count);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(t);
  }, [count, paused, viewer, reduced, index]);

  // Viewer: keys + no page scroll behind it.
  useEffect(() => {
    if (!viewer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewer(false);
      else if (e.key === "ArrowRight") setIndex((i) => (i + 1) % count);
      else if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + count) % count);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [viewer, count]);

  const arrow =
    "absolute top-1/2 z-10 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-black/80 sm:h-11 sm:w-11";

  return (
    <>
      <div
        className="relative mx-auto mt-8 w-full max-w-6xl overflow-hidden rounded-2xl border border-uk-line bg-uk-surface-2 shadow-premium-lg"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        }}
        role="group"
        aria-roledescription="carousel"
        aria-label={caption ?? "Photos"}
      >
        {/* 4:3 on phones, 3:2 on tablets, 16:9 from md — the same ratios as ukvalley.com */}
        <div className="relative aspect-[4/3] w-full sm:aspect-[3/2] md:aspect-video">
          {photos.map((p, i) => (
            <div
              key={p.src}
              aria-hidden={i !== index}
              className={cn("absolute inset-0 transition-opacity duration-700 ease-in-out", i === index ? "z-[1] opacity-100" : "opacity-0")}
            >
              <button
                type="button"
                tabIndex={i === index ? 0 : -1}
                onClick={() => setViewer(true)}
                aria-label={`Open ${p.alt} full size`}
                className="group block h-full w-full cursor-zoom-in"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.src}
                  alt={p.alt}
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className={cn("h-full w-full object-cover", p.focus ?? "object-center")}
                />
              </button>
            </div>
          ))}

          {caption && (
            <div className="pointer-events-none absolute bottom-4 left-4 z-10 max-w-[80%] rounded-lg bg-black/70 px-3.5 py-2 text-sm font-medium text-white backdrop-blur-sm sm:bottom-6 sm:left-6 sm:px-5 sm:py-3 sm:text-lg">
              <Tx>{caption}</Tx>
            </div>
          )}
          <span className="pointer-events-none absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <Maximize2 className="h-3 w-3" aria-hidden />
            {index + 1} / {count}
          </span>

          {count > 1 && (
            <>
              <button type="button" aria-label="Previous photo" onClick={() => go(index - 1)} className={cn(arrow, "left-3 sm:left-6")}>
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
              <button type="button" aria-label="Next photo" onClick={() => go(index + 1)} className={cn(arrow, "right-3 sm:right-6")}>
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
              <div className="absolute bottom-3 left-1/2 z-10 flex max-w-[60%] -translate-x-1/2 flex-wrap justify-center gap-2 sm:bottom-6 sm:gap-3">
                {photos.map((p, i) => (
                  <button
                    key={p.src}
                    type="button"
                    aria-label={`Show photo ${i + 1}`}
                    aria-current={i === index}
                    onClick={() => go(i)}
                    className={cn(
                      "h-2.5 w-2.5 rounded-full transition-all duration-300 sm:h-3 sm:w-3",
                      i === index ? "scale-125 bg-white" : "bg-white/60 hover:bg-white/90"
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {viewer && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={photos[index].alt}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setViewer(false)}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setViewer(false)}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          {count > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                onClick={(e) => {
                  e.stopPropagation();
                  go(index - 1);
                }}
                className="absolute left-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                aria-label="Next photo"
                onClick={(e) => {
                  e.stopPropagation();
                  go(index + 1);
                }}
                className="absolute right-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[index].src}
            alt={photos[index].alt}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88dvh] max-w-full rounded-lg object-contain"
          />
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/80">
            {index + 1} / {count}
          </p>
        </div>
      )}
    </>
  );
}
