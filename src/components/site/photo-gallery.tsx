"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
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
 *
 * `compact`: fills the card it sits in (e.g. beside text on /social-impact):
 * no outer margin, border or shadow of its own, a 4:3 picture, no caption
 * badge (the card shows it), and a photo counter instead of dots once there
 * are too many to fit.
 */
export function PhotoCarousel({
  photos,
  caption,
  compact = false,
}: {
  photos: GalleryPhoto[];
  caption?: string;
  compact?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [viewer, setViewer] = useState(false);
  const [reduced, setReduced] = useState(false);
  const count = photos.length;
  const touchX = useRef<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);
  // Slides are stacked in one spot, so `loading="lazy"` alone would fetch
  // every photo as soon as the carousel is on screen. Only the current slide
  // and its neighbours (the next fade, either arrow) get an image; the
  // browser cache keeps the ones already seen.
  const near = (i: number) => i === index || i === (index + 1) % count || i === (index - 1 + count) % count;

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

  const arrow =
    "absolute top-1/2 z-10 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-black/80 sm:h-11 sm:w-11";

  return (
    <>
      <div
        ref={carouselRef}
        className={cn(
          "relative w-full overflow-hidden bg-uk-surface-2",
          compact ? "h-full" : "mx-auto mt-8 max-w-6xl rounded-2xl border border-uk-line shadow-premium-lg"
        )}
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
        <div className={cn("relative w-full", compact ? "aspect-[4/3] h-full lg:aspect-auto lg:min-h-[24rem]" : "aspect-[4/3] sm:aspect-[3/2] md:aspect-video")}>
          {photos.map((p, i) => (
            <div
              key={p.src}
              aria-hidden={i !== index}
              className={cn("absolute inset-0 transition-opacity duration-700 ease-in-out", i === index ? "z-[1] opacity-100" : "opacity-0")}
            >
              <button
                type="button"
                tabIndex={i === index ? 0 : -1}
                data-viewer-open
                onClick={() => setViewer(true)}
                aria-label={`Open ${p.alt} full size`}
                className="group block h-full w-full cursor-zoom-in"
              >
                {near(i) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.src}
                    alt={p.alt}
                    loading="lazy"
                    decoding="async"
                    className={cn("h-full w-full object-cover", p.focus ?? "object-center")}
                  />
                )}
              </button>
            </div>
          ))}

          {/* compact: the card beside the photos shows the caption already */}
          {caption && !compact && (
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
              <div
                className={cn(
                  "absolute bottom-3 left-1/2 z-10 max-w-[60%] -translate-x-1/2 flex-wrap justify-center gap-2 sm:bottom-6 sm:gap-3",
                  // a card is narrow: past 8 photos the dots would wrap into rows, the counter is enough
                  compact && count > 8 ? "hidden" : "flex"
                )}
              >
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

      <Dialog.Root open={viewer} onOpenChange={setViewer}>
        <Dialog.Portal>
        <Dialog.Popup
          aria-label={photos[index].alt}
          // Back to the current slide's "open full size" button — the one
          // that opened the viewer may have been swapped out by the arrows.
          finalFocus={() =>
            carouselRef.current?.querySelector<HTMLElement>('[data-viewer-open][tabindex="0"]') ?? true
          }
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-4 outline-none"
          onClick={() => setViewer(false)}
          // Arrow keys flip photos (focus is always inside the viewer). Escape,
          // the focus trap and the page scroll lock come from the Dialog.
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") go(index + 1);
            else if (e.key === "ArrowLeft") go(index - 1);
          }}
        >
          <Dialog.Close
            aria-label="Close"
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Dialog.Close>
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
        </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
