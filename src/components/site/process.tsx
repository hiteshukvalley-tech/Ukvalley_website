"use client";

import { useEffect, useRef } from "react";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { Check } from "lucide-react";
import { Marked } from "./marked";
import type { ProcessStep } from "@/lib/process-validation";
import type { HomeContent } from "@/lib/home-defaults";
import { Tx } from "@/components/site/texts-context";
import { prefersReducedMotion, watchInView } from "@/lib/in-view";

/**
 * Delivery pipeline — a vertical progress spine that draws itself as you
 * scroll (scrubbed SVG line + activating step nodes). Reads like a CI
 * pipeline, not a feature grid. Reduced-motion: renders fully drawn.
 * Steps come from Admin → Process; `content` (heading + badge) from Admin →
 * Home page → Process, or the defaults on the /process page.
 */
export function Process({
  steps: processSteps,
  content: c,
}: {
  steps: ProcessStep[];
  content: HomeContent["process"];
}) {
  const spineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = spineRef.current;
    if (!el) return;

    const draw = el.querySelector<HTMLElement>("[data-spine-draw]");
    const dots = Array.from(el.querySelectorAll<HTMLElement>("[data-spine-node]"));

    // scaleY on a full-height line: composited, no re-layout while scrolling
    const setProgress = (p: number) => {
      if (draw) draw.style.transform = `scaleY(${p})`;
    };

    if (prefersReducedMotion()) {
      setProgress(1);
      dots.forEach((d) => d.setAttribute("data-on", "true"));
      return;
    }

    // The spine draws from when the list's top passes 70% of the screen until
    // its bottom passes 55%. Measured only while the list is on screen.
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      setProgress(Math.min(1, Math.max(0, (0.7 * vh - r.top) / (0.15 * vh + r.height))));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    let listening = false;
    const stopSpine = watchInView(
      el,
      ({ visible, first, above }) => {
        if (first && above) return setProgress(1);
        if (visible && !listening) {
          listening = true;
          window.addEventListener("scroll", onScroll, { passive: true });
          onScroll();
        } else if (!visible && listening) {
          listening = false;
          window.removeEventListener("scroll", onScroll);
          onScroll(); // settle at 0 or 1
        }
      },
      "0px"
    );

    // Nodes light up as the spine passes them.
    const stopDots = dots.map((d) => {
      let stop = () => {};
      stop = watchInView(
        d,
        ({ visible, first, above }) => {
          if (first && (visible || above)) return stop();
          if (first) {
            d.style.opacity = "0.35";
            d.style.transform = "scale(0.9)";
            return;
          }
          if (!visible) return;
          d.style.transition = "opacity 0.4s ease-out, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
          d.style.opacity = "";
          d.style.transform = "";
          stop();
        },
        "0px 0px -28% 0px"
      );
      return stop;
    });

    return () => {
      stopSpine();
      stopDots.forEach((s) => s());
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section id="process" className="relative overflow-hidden bg-uk-surface-2 section-py">
      <div className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-uk-blue/10 blur-[150px]" aria-hidden />
      <div className="relative mx-auto max-w-7xl pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] lg:px-8">
        {/* narrative column — now at the top of the section */}
        <div>
          <SectionHeading
            align="center"
            eyebrow={c.eyebrow}
            title={<Marked text={c.title} />}
            description={c.description || undefined}
          />
          {c.badge && <Reveal className="mt-8 flex justify-center">
            <div className="glass inline-flex items-center gap-3 rounded-2xl p-4 shadow-premium">
              <span className="relative flex h-2.5 w-2.5" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-uk-blue/40" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-uk-blue" />
              </span>
              <span className="text-sm font-medium text-uk-heading">
                <Tx>{c.badge}</Tx>
              </span>
            </div>
          </Reveal>}
        </div>

        {/* scroll-drawn pipeline — centered as a column so the whole
            section sits symmetrically on the page */}
        <div ref={spineRef} className="relative mx-auto mt-14 max-w-2xl">
            {/* spine track */}
            <div className="absolute left-[1.4rem] top-2 h-[calc(100%-4rem)] w-px bg-uk-line" aria-hidden />
            {/* spine draw (yellow → blue) */}
            <div
              data-spine-draw
              className="absolute left-[1.4rem] top-2 h-full w-px origin-top bg-gradient-to-b from-uk-yellow via-uk-blue to-uk-blue-bright shadow-[0_0_12px_rgba(49,0,255,0.5)] transition-transform duration-500 ease-out dark:shadow-[0_0_12px_rgba(104,77,255,0.5)]"
              style={{ transform: "scaleY(0)" }}
              aria-hidden
            />
            <Reveal staggerChildren className="flex flex-col gap-10">
              {processSteps.map((p, i) => (
                <div key={p.step} className="relative flex gap-6 pl-1">
                  <div
                    data-spine-node
                    className="relative z-10 flex h-12 w-12 flex-none items-center justify-center rounded-2xl border border-uk-blue/40 bg-uk-card font-heading text-base font-bold text-uk-blue shadow-glow-blue-sm"
                    style={{ transitionDelay: `${i * 60}ms` }}
                  >
                    <Tx>{p.step}</Tx>
                    <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-uk-yellow" aria-hidden />
                  </div>
                  <div className="flex flex-col gap-2 pt-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-heading text-lg font-bold text-uk-heading"><Tx>{p.title}</Tx></h3>
                      <span className="inline-flex w-fit rounded-full bg-uk-surface-blue px-2.5 py-0.5 text-xs font-medium text-uk-blue">
                        <Tx>{p.duration}</Tx>
                      </span>
                    </div>
                    <p className="max-w-lg text-sm leading-relaxed text-uk-muted"><Tx>{p.desc}</Tx></p>
                    {p.points && (
                      <ul className="mt-1 flex flex-col gap-1.5">
                        {p.points.map((pt) => (
                          <li key={pt} className="flex items-start gap-2 text-sm font-medium text-uk-body">
                            <Check className="mt-0.5 h-3.5 w-3.5 flex-none text-uk-blue" aria-hidden />
                            <Tx>{pt}</Tx>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </Reveal>
        </div>
      </div>
    </section>
  );
}