import { ArrowRight } from "lucide-react";
import { Reveal } from "./reveal";
import { ScopingButton } from "./scoping-modal";
import { AuroraBlobs } from "./aurora-blobs";

export function CtaBand() {
  return (
    <section id="contact" className="relative bg-uk-surface-premium bg-aurora px-5 section-py lg:px-8">
      {/* aurora blobs drifting behind the CTA panel */}
      <AuroraBlobs
        blobs={[
          { left: "-6%", top: "-10%", size: "22rem", tone: "indigo", shape: "a", delay: "-3s" },
          { left: "80%", top: "58%", size: "18rem", tone: "cyan", shape: "c", delay: "-11s" },
        ]}
      />
      <div className="relative mx-auto max-w-7xl">
        <Reveal>
          <div
            className="cta-gradient relative overflow-hidden rounded-[2rem] px-7 py-14 text-center shadow-premium sm:px-14 sm:py-20"
          >
            {/* decorative glows */}
            <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-uk-yellow/25 blur-[100px]" aria-hidden />
            <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-uk-blue-deep/50 blur-[110px]" aria-hidden />
            {/* slow conic light sweep — premium depth */}
            <div
              className="radar-sweep cta-conic-sweep absolute -inset-24 opacity-40"
              aria-hidden
            />
            <div className="absolute inset-0 bg-blueprint opacity-20" aria-hidden />

            <div className="relative flex flex-col items-center gap-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-uk-white/30 bg-uk-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-uk-white backdrop-blur">
                Free · 30 minutes · No obligation
              </span>
              <h2 className="font-heading max-w-3xl text-balance text-3xl font-bold leading-[1.08] text-uk-white sm:text-5xl">
                Book a scoping call with a software architect — not a sales bot.
              </h2>
              <p className="max-w-xl text-base text-uk-white/85 sm:text-lg">
                Within 1 business hour you&apos;ll get a reply. We&apos;ll send a rough
                estimate in 3 days and a fixed proposal in 7.
              </p>

              {/* phone number & email live on the Contact page only */}
              <div className="mt-2 flex flex-col items-center gap-3">
                <ScopingButton className="btn-sheen btn-lift group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-uk-yellow px-8 font-heading text-base font-bold text-[#151122] shadow-glow-yellow">
                  Book a free scoping call
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </ScopingButton>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-uk-white/85">
                  Prefer to talk first? Phone, email and office address are on the contact page.
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}