import Link from "@/components/site/intent-link";
import { ArrowUpRight, ArrowRight, Sparkles, Check, MonitorSmartphone, Users, LifeBuoy, UserCheck } from "lucide-react";
import { MetricRing } from "./metric-ring";
import type { Product } from "@/lib/site-data";
import { ukText } from "@/lib/texts";

/* TeleValley-specific storytelling blocks, shared by the homepage
   Products section and the /products page so both stay in sync. */
const howItWorks = ["Reps' own SIMs", "Auto-routing", "Track & record", "CRM sync"];

const whyTeamsSwitch = [
  "No per-seat cloud telephony licenses",
  "Keep your team's existing SIMs & numbers",
  "Works alongside your existing CRM",
  "Enterprise controls: roles, retention, export",
];

const builtWith = ["Flutter", "Native Android telephony", "REST API", "Role-based access", "On-prem or cloud"];

const quickStats = [
  { value: "60%", label: "Lower telephony cost" },
  { value: "100%", label: "Calls tracked & recorded" },
  { value: "Day 1", label: "Zero-hardware rollout" },
];

const whoItsFor = [
  "Sales & telemarketing teams",
  "Field service & logistics ops",
  "SMEs replacing per-seat telephony",
];

const included = [
  "Onboarding & rep training",
  "Admin console & audit logs",
  "Ongoing product updates",
  "Support by our in-house team",
];

/**
 * The full flagship product card — badges, flow, highlights, switch
 * reasons, stack, quick stats, production metric and CTA footer.
 */
export function FlagshipProductCard({ featured }: { featured: Product }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-uk-blue/25 bg-gradient-to-br from-white dark:from-uk-card via-uk-surface-premium to-uk-surface-blue p-8 shadow-premium-lg sm:p-10">
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-uk-blue/15 blur-[100px] transition-all duration-700 group-hover:bg-uk-blue/30" aria-hidden />
      <div className="absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-uk-yellow/15 blur-[90px] opacity-0 transition-opacity duration-700 group-hover:opacity-100" aria-hidden />

      <div className="relative flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge-yellow inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5" />{ukText("Flagship product")}</span>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-uk-blue/20 bg-uk-blue/5 px-3 py-1 text-xs font-semibold text-uk-blue">
            <span className="h-1.5 w-1.5 rounded-full bg-uk-blue shadow-glow-blue-sm" />{ukText("Live in production")}</span>
        </div>
        <div>
          <h3 className="font-heading text-3xl font-bold text-uk-heading sm:text-4xl">
            {ukText(featured.name)}
          </h3>
          <p className="mt-1 text-uk-blue">{ukText(featured.tagline)}</p>
        </div>
        <p className="max-w-lg text-base leading-relaxed text-uk-gray">
          {ukText(featured.description)}
        </p>

        {/* Who it's for — the teams that get value on day one */}
        <div>
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-uk-blue">{ukText("Who it's for")}</span>
          <ul className="mt-2 flex flex-wrap gap-2">
            {whoItsFor.map((w) => (
              <li
                key={w}
                className="inline-flex items-center gap-1.5 rounded-full border border-uk-line bg-white/70 px-3 py-1 text-xs font-medium text-uk-body dark:bg-uk-card/70"
              >
                <UserCheck className="h-3.5 w-3.5 flex-none text-uk-blue" />
                {ukText(w)}
              </li>
            ))}
          </ul>
        </div>

        {/* How it works — the flow every deployment follows */}
        <div>
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-uk-blue">{ukText("How it works")}</span>
          <div className="mt-2 flex flex-wrap items-center gap-x-1 gap-y-2">
            {howItWorks.map((step, i) => (
              <span key={step} className="inline-flex items-center gap-1">
                {i > 0 && <ArrowRight className="h-3 w-3 text-uk-blue/50" aria-hidden />}
                <span className="rounded-md border border-uk-line bg-white/70 px-2.5 py-1 font-heading text-xs font-medium text-uk-heading dark:bg-uk-card/70">
                  {ukText(step)}
                </span>
              </span>
            ))}
          </div>
        </div>

        <ul className="flex flex-wrap gap-2.5">
          {featured.highlights.map((h) => (
            <li key={h} className="inline-flex items-center gap-1.5 rounded-full border border-uk-line bg-uk-surface-blue px-3 py-1.5 text-xs font-medium text-uk-body">
              <Check className="h-3.5 w-3.5 text-uk-blue" />
              {ukText(h)}
            </li>
          ))}
        </ul>

        {/* Why teams switch — vs. per-seat cloud telephony */}
        <div>
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-uk-blue">{ukText("Why teams switch")}</span>
          <ul className="mt-2 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {whyTeamsSwitch.map((b) => (
              <li key={b} className="flex items-center gap-2 text-xs font-medium text-uk-body">
                <Check className="h-3.5 w-3.5 flex-none text-uk-blue" />
                {ukText(b)}
              </li>
            ))}
          </ul>
        </div>

        {/* Built with — the stack behind the product */}
        <div>
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-uk-blue">{ukText("Built with")}</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {builtWith.map((chip) => (
              <span key={chip} className="inline-flex items-center gap-1.5 rounded-full bg-uk-blue/10 px-3 py-1 text-xs font-medium text-uk-blue">
                <span className="h-1.5 w-1.5 rounded-full bg-uk-blue" />
                {ukText(chip)}
              </span>
            ))}
          </div>
        </div>

        {/* Quick stats — what the product delivers */}
        <div className="grid grid-cols-3 gap-3 rounded-2xl border border-uk-blue/15 bg-uk-blue/[0.06] p-4">
          {quickStats.map((s) => (
            <div key={s.label} className="flex flex-col gap-0.5">
              <span className="font-heading text-lg font-bold text-uk-blue sm:text-xl">{ukText(s.value)}</span>
              <span className="text-[0.7rem] leading-tight text-uk-muted">{ukText(s.label)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Included with every deployment — what the flat fee covers */}
      <div className="relative mt-6 rounded-2xl border border-uk-line bg-white/60 p-4 dark:bg-uk-card/60">
        <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-uk-blue">
          <LifeBuoy className="h-3.5 w-3.5" />{ukText("Included with every deployment")}</span>
        <ul className="mt-2.5 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          {included.map((inc) => (
            <li key={inc} className="flex items-center gap-2 text-xs font-medium text-uk-body">
              <Check className="h-3.5 w-3.5 flex-none text-uk-blue" />
              {ukText(inc)}
            </li>
          ))}
        </ul>
      </div>

      {featured.metric && (
        <div className="relative mt-8 flex flex-1 items-center gap-5 border-t border-uk-line py-6">
          <MetricRing
            value={parseInt(featured.metric.value, 10) || 0}
            label={ukText(featured.metric.label)}
            size={104}
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-uk-heading">{ukText("Production-proven savings")}</span>
            <span className="max-w-xs text-xs leading-relaxed text-uk-muted">{ukText("Measured across live TeleValley deployments vs. per-seat cloud telephony.")}</span>
          </div>
        </div>
      )}

      {/* Platform, audience & CTA footer */}
      <div className="relative mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-uk-line pt-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-uk-muted">
          <MonitorSmartphone className="h-3.5 w-3.5" />
          {ukText(featured.platform)}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-uk-muted">
          <Users className="h-3.5 w-3.5" />
          {ukText(featured.audience)}
        </span>
        <Link
          href={ukText(`/products/${featured.slug}`)}
          className="ml-auto inline-flex items-center gap-2 rounded-full bg-uk-blue px-4 py-2 text-xs font-semibold text-uk-white shadow-glow-blue-sm transition-all duration-300 hover:bg-uk-blue-bright sm:text-sm"
        >{ukText("Explore TeleValley")}<ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}