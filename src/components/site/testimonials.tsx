import { Quote, Star } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Marked } from "./marked";
import { getTestimonials } from "@/lib/testimonials-store";
import type { HomeContent } from "@/lib/home-defaults";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
}

/** Quotes come from Admin → Testimonials; heading from Admin → Home page → Testimonials. */
export async function Testimonials({ content: c }: { content: HomeContent["testimonials"] }) {
  const testimonials = await getTestimonials();
  return (
    <section id="testimonials" className="relative overflow-hidden bg-uk-surface-2 section-py">
      <div className="absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-uk-yellow/10 blur-[130px]" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex flex-col items-center">
          <SectionHeading
            align="center"
            eyebrow={c.eyebrow}
            title={<Marked text={c.title} className="text-gradient-blue" />}
            description={c.description || undefined}
          />
        </div>

        <Reveal staggerChildren className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="group relative flex flex-col gap-5 rounded-3xl border border-uk-line card-premium card-spotlight bg-uk-card p-7"
            >
              <div className="flex items-center justify-between">
                <Quote className="h-8 w-8 flex-none text-uk-blue/30" aria-hidden />
                <div className="flex gap-0.5" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-uk-yellow text-uk-yellow" />
                  ))}
                </div>
              </div>
              <blockquote className="text-base leading-relaxed text-uk-body">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-auto flex items-center gap-3 border-t border-uk-line pt-5">
                <Avatar className="h-11 w-11 border border-uk-blue/30">
                  <AvatarFallback className="bg-uk-blue/12 font-heading text-sm font-bold text-uk-blue">
                    {initials(t.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-heading text-sm font-bold text-uk-heading">{t.name}</span>
                  <span className="text-xs text-uk-muted">{t.title}</span>
                  <span className="text-xs text-uk-blue">{t.company}</span>
                </div>
              </figcaption>
            </figure>
          ))}
        </Reveal>
      </div>
    </section>
  );
}