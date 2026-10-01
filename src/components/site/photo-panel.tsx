import Image from "next/image";
import { Check } from "lucide-react";
import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";

/**
 * Photo + copy panel. The artwork sits in a rounded frame with the same
 * brand grade and glow used by the page heroes, beside a heading, a
 * paragraph and an optional list of facts. `flip` puts the photo on the
 * right. Images come from /public; each carries its own CSS grade so it
 * sits on the Dark Aurora palette.
 */
export type PhotoSpec = {
  src: string;
  alt: string;
  /** Tailwind arbitrary filter, e.g. "[filter:hue-rotate(28deg)_saturate(1.5)]" */
  grade?: string;
  /** Tailwind object-position, e.g. "object-[50%_40%]" */
  focus?: string;
};

export const photos = {
  services: {
    src: "/services-hero.jpg",
    alt: "Neural network visualisation representing the engineering core",
    grade: "[filter:hue-rotate(28deg)_saturate(1.5)_contrast(1.12)_brightness(1.05)]",
    focus: "object-[50%_40%]",
  },
  solutions: {
    src: "/solutions-hero.jpg",
    alt: "Circuit-board brain inside a server room",
    grade: "[filter:hue-rotate(-24deg)_saturate(1.4)_contrast(1.12)]",
    focus: "object-[50%_46%]",
  },
  work: {
    src: "/work-hero.jpg",
    alt: "Holographic analytics dashboard around a data globe",
    grade: "[filter:hue-rotate(28deg)_saturate(1.45)_contrast(1.12)_brightness(1.05)]",
    focus: "object-[50%_48%]",
  },
  company: {
    src: "/company-hero.jpg",
    alt: "Network globe with lit continents",
    grade: "[filter:hue-rotate(-22deg)_saturate(1.3)_contrast(1.1)]",
    focus: "object-[48%_50%]",
  },
  hire: {
    src: "/hire-hero.jpg",
    alt: "Engineer and AI assistant at a holographic workspace",
    grade: "[filter:saturate(1.15)_contrast(1.1)]",
    focus: "object-[62%_40%]",
  },
  insights: {
    src: "/insights-hero.jpg",
    alt: "Analytics dashboard with trend charts",
    grade: "[filter:hue-rotate(28deg)_saturate(1.45)_contrast(1.12)]",
    focus: "object-[50%_48%]",
  },
} satisfies Record<string, PhotoSpec>;

export function PhotoPanel({
  photo,
  eyebrow,
  title,
  children,
  facts,
  caption,
  flip = false,
  className,
}: {
  photo: PhotoSpec;
  eyebrow?: string;
  title: React.ReactNode;
  children: React.ReactNode;
  facts?: string[];
  caption?: string;
  flip?: boolean;
  className?: string;
}) {
  return (
    <section className={cn("relative bg-uk-surface section-py", className)}>
      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal
          className={cn(
            "grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16",
            flip && "lg:[&>*:first-child]:order-2"
          )}
        >
          {/* Photo frame */}
          <figure className="relative">
            <div
              className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-[radial-gradient(circle_at_30%_30%,rgba(49,0,255,0.28),rgba(104,77,255,0.12)_45%,rgba(255,245,0,0.10)_70%,transparent_80%)] blur-2xl dark:bg-[radial-gradient(circle_at_30%_30%,rgba(104,77,255,0.4),rgba(40,123,255,0.2)_45%,rgba(255,245,0,0.12)_70%,transparent_80%)]"
              aria-hidden
            />
            <div className="relative rounded-[2rem] bg-gradient-to-br from-[#3100FF] via-[#684DFF] via-60% to-[#fff500] p-[3px] shadow-premium-lg">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[calc(2rem-3px)] bg-[#070511]">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 1024px) 40rem, 100vw"
                  quality={95}
                  className={cn("object-cover", photo.focus, photo.grade)}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#3100FF]/35 via-[#684DFF]/10 to-[#287BFF]/25 mix-blend-soft-light" aria-hidden />
                <div className="absolute inset-0 rounded-[calc(2rem-3px)] shadow-[inset_0_0_40px_10px_rgba(7,5,17,0.45)]" aria-hidden />
              </div>
            </div>
            {caption && (
              <figcaption className="mt-3 text-center text-xs text-uk-muted">{caption}</figcaption>
            )}
          </figure>

          {/* Copy */}
          <div className="flex flex-col gap-5">
            {eyebrow && (
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">
                {eyebrow}
              </span>
            )}
            <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{title}</h2>
            <div className="text-justify-prose space-y-4 text-base leading-relaxed text-uk-body sm:text-lg">
              {children}
            </div>
            {facts && facts.length > 0 && (
              <ul className="mt-1 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {facts.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm font-medium text-uk-heading">
                    <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-uk-blue/12 text-uk-blue">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
