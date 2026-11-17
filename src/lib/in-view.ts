// Scroll-into-view detection for the site's entrance animations, without
// GSAP/ScrollTrigger. One IntersectionObserver per trigger line is shared by
// every element using it, and the browser reports positions in batches off
// the main thread, so nothing reads layout during start-up. (Hundreds of
// per-element getBoundingClientRect + ScrollTrigger set-ups forced the whole
// page to re-layout again and again while it loaded, worst in Safari.)

export type InViewInfo = {
  /** the element is inside the trigger area now */
  visible: boolean;
  /** this is the first report for the element (its position on page load) */
  first: boolean;
  /** the element is already above the viewport (scrolled past) */
  above: boolean;
};

type Callback = (info: InViewInfo) => void;
type Watcher = { io: IntersectionObserver; targets: Map<Element, { cb: Callback; seen: boolean }> };

const watchers = new Map<string, Watcher>();

function watcher(rootMargin: string): Watcher {
  let w = watchers.get(rootMargin);
  if (w) return w;
  const targets: Watcher["targets"] = new Map();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const t = targets.get(e.target);
        if (!t) continue;
        const first = !t.seen;
        t.seen = true;
        t.cb({ visible: e.isIntersecting, first, above: !e.isIntersecting && e.boundingClientRect.bottom < 0 });
      }
    },
    { rootMargin }
  );
  w = { io, targets };
  watchers.set(rootMargin, w);
  return w;
}

/**
 * Calls `cb` whenever `el` enters or leaves the viewport (narrowed by
 * `rootMargin`; the default line is 15% above the bottom edge, like
 * ScrollTrigger's "top 85%"). Returns a function that stops watching.
 */
export function watchInView(el: Element, cb: Callback, rootMargin = "0px 0px -15% 0px"): () => void {
  if (typeof IntersectionObserver === "undefined") {
    // Very old browser: report "visible" on the next tick (callers may stop
    // watching from inside the callback), so everything just shows.
    const t = setTimeout(() => cb({ visible: true, first: true, above: false }));
    return () => clearTimeout(t);
  }
  const w = watcher(rootMargin);
  w.targets.set(el, { cb, seen: false });
  w.io.observe(el);
  return () => {
    w.targets.delete(el);
    w.io.unobserve(el);
  };
}

/** Calls `cb` once, the first time `el` scrolls into view (or at once if it already is). */
export function onceInView(el: Element, cb: () => void, rootMargin?: string): () => void {
  let stop = () => {};
  stop = watchInView(
    el,
    ({ visible, above }) => {
      if (!visible && !above) return;
      stop();
      cb();
    },
    rootMargin
  );
  return stop;
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Runs `step(progress 0→1, eased)` for `ms` milliseconds on animation frames. Returns a cancel function. */
export function tween(ms: number, step: (eased: number) => void, ease: (t: number) => number = easeOutCubic, delayMs = 0): () => void {
  let frame = 0;
  let start = 0;
  const tick = (now: number) => {
    if (!start) start = now + delayMs;
    const t = Math.min(1, Math.max(0, (now - start) / ms));
    step(ease(t));
    if (t < 1) frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);
