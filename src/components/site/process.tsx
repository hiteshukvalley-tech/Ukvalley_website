"use client";

import { useEffect, useRef } from "react";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Check } from "lucide-react";
import { Marked } from "./marked";
import type { ProcessStep } from "@/lib/process-validation";
import type { HomeContent } from "@/lib/home-defaults";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

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
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const draw = el.querySelector<HTMLElement>("[data-spine-draw]");
    const dots = Array.from(el.querySelectorAll<HTMLElement>("[data-spine-node]"));

    const setProgress = (p: number) => {
      if (draw) draw.style.height = `${p * 100}%`;
    };

    if (reduced) {
      setProgress(1);
      dots.forEach((d) => d.setAttribute("data-on", "true"));
      return;
    }

    const ctx = gsap.context(() => {
      setProgress(0);
      gsap.to(
        { p: 0 },
        {
          p: 1,
          ease: "none",
          onUpdate() {
            setProgress((this.targets()[0] as { p: number }).p);
          },
          scrollTrigger: {
            trigger: el,
            start: "top 70%",
            end: "bottom 55%",
            scrub: 0.6,
          },
        }
      );

      // nodes light up as the spine passes them
      dots.forEach((d) => {
        gsap.fromTo(
          d,
          { opacity: 0.35, scale: 0.9 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.4,
            ease: "back.out(2)",
            scrollTrigger: { trigger: d, start: "top 72%", once: true },
          }
        );
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section id="process" className="relative overflow-hidden bg-uk-surface-2 section-py">
      <div className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-uk-blue/10 blur-[150px]" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
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
                {c.badge}
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
              className="absolute left-[1.4rem] top-2 w-px bg-gradient-to-b from-uk-yellow via-uk-blue to-uk-blue-bright shadow-[0_0_12px_rgba(49,0,255,0.5)] dark:shadow-[0_0_12px_rgba(104,77,255,0.5)]"
              style={{ height: "0%" }}
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
                    {p.step}
                    <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-uk-yellow" aria-hidden />
                  </div>
                  <div className="flex flex-col gap-2 pt-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-heading text-lg font-bold text-uk-heading">{p.title}</h3>
                      <span className="inline-flex w-fit rounded-full bg-uk-surface-blue px-2.5 py-0.5 text-xs font-medium text-uk-blue">
                        {p.duration}
                      </span>
                    </div>
                    <p className="max-w-lg text-sm leading-relaxed text-uk-muted">{p.desc}</p>
                    {p.points && (
                      <ul className="mt-1 flex flex-col gap-1.5">
                        {p.points.map((pt) => (
                          <li key={pt} className="flex items-start gap-2 text-sm font-medium text-uk-body">
                            <Check className="mt-0.5 h-3.5 w-3.5 flex-none text-uk-blue" aria-hidden />
                            {pt}
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