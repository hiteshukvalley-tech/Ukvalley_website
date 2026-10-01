"use client";

import Link from "@/components/site/intent-link";
import { ArrowRight, CheckCircle2, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCounter } from "./stat-counter";
import { SplitHeading } from "./split-heading";
import { DashboardShowcase } from "./dashboard-showcase";
import { DeliveryMesh } from "./delivery-mesh";
import { ScopingButton } from "./scoping-modal";
import { heroStats, company } from "@/lib/site-core";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-uk-surface-blue">
      {/* ── Background layers ── */}
      <div
        className="hero-gradient absolute inset-0"
        aria-hidden
      />
      <div className="absolute inset-0 bg-blueprint bg-grid-fade opacity-70" aria-hidden />
      <div className="glow-drift absolute -left-40 top-0 h-[32rem] w-[32rem] rounded-full bg-uk-blue/18 blur-[140px]" />
      <div className="glow-drift absolute right-[-8%] top-[-10%] h-[36rem] w-[36rem] rounded-full bg-uk-blue-bright/12 blur-[160px]" />
      <div className="glow-drift absolute bottom-[-10%] left-[30%] h-80 w-80 rounded-full bg-uk-yellow/15 blur-[120px]" />

      {/* ── Hero content ── */}
      <div className="relative mx-auto max-w-7xl px-5 pt-32 pb-16 lg:px-8 lg:pt-40 lg:pb-20">
        {/* Badge */}
        <div className="mb-8 flex justify-center">
          <div className="badge-yellow inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs uppercase tracking-[0.18em] shadow-glow-yellow">
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-uk-heading/30" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-uk-heading" />
            </span>
            Engineering systems in production · Since 2017
          </div>
        </div>

        {/* Headline */}
        <div className="mx-auto max-w-4xl text-center">
          <SplitHeading
            as="h1"
            immediate
            className="font-heading-display text-balance text-4xl font-bold leading-[1.05] tracking-tight text-uk-heading-strong sm:text-5xl lg:text-[4.5rem] lg:leading-[1.04]"
            highlight={[3]}
          >
            {"We build technology that helps businesses scale.".trim()}
          </SplitHeading>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-uk-muted sm:text-xl">
            Web, mobile, CRM, ERP and cloud systems for Indian SMEs and global
            startups — engineered to scale, with{" "}
            <span className="font-semibold text-uk-heading">code you own from day one</span>{" "}
            and a 24-hour response SLA.
          </p>
        </div>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <ScopingButton className="group inline-flex h-14 w-full max-w-sm items-center justify-center gap-2 rounded-full sm:w-auto btn-sheen btn-glow bg-uk-blue px-8 text-base font-semibold text-white transition-all hover:bg-uk-blue-bright">
            Book a free scoping call
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </ScopingButton>
          <Button
            size="lg"
            variant="outline"
            nativeButton={false}
            className="h-14 w-full max-w-sm sm:w-auto border-uk-blue/25 bg-white/80 dark:bg-uk-card/80 px-8 text-base font-semibold text-uk-blue shadow-float backdrop-blur-sm hover:border-uk-blue hover:bg-white dark:hover:bg-uk-card hover:text-uk-blue-bright"
            render={<Link href="#work" />}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            See our work
          </Button>
        </div>

        {/* Trust row */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-uk-muted">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-uk-blue" />
            NDA &amp; IP assignment before day one
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="flex" aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-uk-yellow text-uk-yellow drop-shadow-[0_1px_0_rgba(31,41,55,0.15)] dark:drop-shadow-[0_1px_0_rgba(0,0,0,0.4)]" />
              ))}
            </span>
            150+ clients served
          </span>
        </div>

        {/* ── Dashboard showcase ── */}
        <div className="relative mx-auto mt-16 max-w-5xl lg:mt-20">
          {/* Glow ring behind the panel */}
          <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-b from-uk-blue/10 via-transparent to-uk-yellow/8 blur-2xl" aria-hidden />

          <div className="border-beam showcase-hover relative overflow-hidden rounded-2xl border border-uk-line dark:border-uk-line bg-white dark:bg-uk-card shadow-premium-lg lg:rounded-3xl">
            {/* Panel header bar */}
            <div className="flex items-center justify-between border-b border-uk-line bg-uk-surface px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-400/80 dark:bg-red-500/70" />
                <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/80 dark:bg-emerald-400/70" />
              </div>
              <span className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-uk-muted">
                What we build for you
              </span>
              <div className="flex items-center gap-1.5 text-uk-muted">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)] dark:shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                <span className="text-[0.65rem] font-medium uppercase tracking-wider">Live</span>
              </div>
            </div>

            {/* Dashboard mockup — fixed height, content scrolls inside */}
            <div className="h-[22rem] lg:h-[28rem]">
              <DashboardShowcase />
            </div>
          </div>

          {/* Floating accent cards below panel */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 lg:mt-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-uk-line bg-white/90 dark:bg-uk-card/90 px-4 py-2 text-sm font-medium text-uk-heading shadow-float backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-uk-blue/50 hover:shadow-glow-blue-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)] dark:shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
              CRM &amp; ERP dashboards
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-uk-line bg-white/90 dark:bg-uk-card/90 px-4 py-2 text-sm font-medium text-uk-heading shadow-float backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-uk-blue/50 hover:shadow-glow-blue-sm">
              <span className="h-2 w-2 rounded-full bg-uk-yellow shadow-glow-yellow" />
              Custom software platforms
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-uk-line bg-white/90 dark:bg-uk-card/90 px-4 py-2 text-sm font-medium text-uk-heading shadow-float backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-uk-blue/50 hover:shadow-glow-blue-sm">
              <span className="h-2 w-2 rounded-full bg-uk-blue shadow-[0_0_6px_rgba(49,0,255,0.5)] dark:shadow-[0_0_6px_rgba(104,77,255,0.6)]" />
              Mobile &amp; web apps
            </span>
          </div>
        </div>
      </div>

      {/* ── Stat strip ── */}
      <div className="relative border-t border-uk-line dark:border-uk-line bg-white dark:bg-uk-card shadow-premium-lg">
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-5 lg:grid-cols-4 lg:px-8">
          {heroStats.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1.5 border-uk-line px-4 py-6 text-center even:border-l max-lg:nth-[n+3]:border-t sm:py-7 lg:border-l lg:first:border-l-0">
              <StatCounter
                value={s.value}
                className="font-heading text-3xl font-bold text-uk-blue sm:text-4xl"
              />
              <span className="h-1 w-8 rounded-full bg-uk-yellow" aria-hidden />
              <span className="text-xs font-medium uppercase tracking-wider text-uk-muted sm:text-sm">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Delivery mesh ── */}
      <div className="relative bg-white dark:bg-uk-card pb-16 pt-12 lg:pb-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex flex-col gap-2 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.28em] text-uk-blue">
              Global delivery mesh
            </span>
            <p className="text-sm text-uk-muted">
              Engineering from Maharashtra, India · clients and delivery partners across four geographies
            </p>
          </div>
          <DeliveryMesh className="mx-auto mt-8 max-w-4xl" />
        </div>
      </div>

      {/* sr contact breadcrumb */}
      <span className="sr-only">{company.name} — {company.city}</span>
    </section>
  );
}

