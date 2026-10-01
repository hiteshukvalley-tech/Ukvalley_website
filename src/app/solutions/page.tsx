import type { Metadata } from "next";
import Link from "@/components/site/intent-link";
import {
  Users, LayoutDashboard, Briefcase, GraduationCap, ShoppingBag,
  CalendarCheck, Landmark, HeartPulse, Truck, Building, Utensils,
  ArrowRight, type LucideIcon,
} from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { PageHero, heroArtwork } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { CtaBand } from "@/components/site/cta";
import { TimeSavers } from "@/components/site/time-savers";
import { getProcessSteps } from "@/lib/process-store";
import { getSolutions } from "@/lib/solutions-store";

export const metadata: Metadata = {
  title: "Solutions — ready-to-build systems for your industry",
  description:
    "CRM, ERP, HRMS, LMS, e-commerce, POS, loan origination, healthcare, logistics, booking and more — production-proven solution patterns Ukvalley builds and customises for your business.",
  alternates: { canonical: "https://ukvalley.com/solutions" },
};

const icons: Record<string, LucideIcon> = {
  users: Users,
  layoutDashboard: LayoutDashboard,
  briefcase: Briefcase,
  graduationCap: GraduationCap,
  shoppingBag: ShoppingBag,
  calendarCheck: CalendarCheck,
  landmark: Landmark,
  heartPulse: HeartPulse,
  truck: Truck,
  building: Building,
  utensils: Utensils,
};

export default async function SolutionsPage() {
  const processSteps = await getProcessSteps();
  const solutions = await getSolutions();
  return (
    <>
      <ScrollProgress />
      <Header />
      <main id="main">
        <PageHero
          image={heroArtwork.solutions}
          variant="solutions"
          eyebrow="Solutions"
          crumbs={[{ label: "Home", href: "/" }, { label: "Solutions" }]}
          title={
            <>
              Systems we&apos;ve already built —{" "}
              <span className="text-gradient-blue">ready to build for you.</span>
            </>
          }
          description="Twelve solution patterns proven in production — from CRM and ERP to loan origination and food delivery. Each one is a starting point we customise to your workflow, not a template we force onto it."
        />

        <section className="relative bg-uk-surface-2 section-py">
          <Container>
            <Reveal staggerChildren className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {solutions.map((s) => {
                const Icon = icons[s.icon] ?? Users;
                return (
                  <Link
                    key={s.slug}
                    href={`/solutions/${s.slug}`}
                    className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-uk-line bg-uk-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-uk-blue/40"
                  >
                    <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-uk-blue/0 blur-3xl transition-all duration-500 group-hover:bg-uk-blue/15" aria-hidden />
                    <div className="flex items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-uk-blue/12 text-uk-blue transition-colors group-hover:bg-uk-blue group-hover:text-uk-white">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="rounded-full bg-uk-surface-blue px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-wider text-uk-blue">
                        {s.category}
                      </span>
                    </div>
                    <h2 className="font-heading text-lg font-bold text-uk-heading">
                      {s.name}
                    </h2>
                    <p className="text-sm leading-relaxed text-uk-gray">
                      {s.description}
                    </p>
                    <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                      {/* one metric per line — first on top, second below */}
                      <div className="flex flex-col items-start gap-1.5">
                        {s.metrics.slice(0, 2).map((m) => (
                          <span key={m.label} className="rounded-md bg-uk-surface-blue px-2 py-1 text-[0.7rem] font-medium text-uk-body">
                            {m.value} {m.label}
                          </span>
                        ))}
                      </div>
                      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-uk-blue/10 text-uk-blue transition-all group-hover:bg-uk-blue group-hover:text-uk-white">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </Reveal>
          </Container>
        </section>

        {/* Solution patterns at a glance — compare timelines and bands */}
        <section className="relative bg-uk-surface section-py">
          <Container>
            <Reveal className="max-w-2xl">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">
                At a glance
              </span>
              <h2 className="mt-5 font-heading text-2xl font-bold text-uk-heading sm:text-3xl">
                Twelve solution patterns, compared on the numbers that matter
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-uk-gray sm:text-base">
                Typical timelines, starting investment and when you first see working software —
                so you can shortlist before the call. Every figure is a range from past deployments;
                your written estimate follows the scoping call within 3 business days.
              </p>
            </Reveal>
            <Reveal className="mt-8 overflow-x-auto rounded-3xl border border-uk-line bg-uk-card">
              <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-uk-line px-5 py-4 font-heading font-bold text-uk-heading">Solution</th>
                    <th className="border-b border-uk-line px-5 py-4 font-heading font-bold text-uk-heading">Best for</th>
                    <th className="border-b border-uk-line px-5 py-4 font-heading font-bold text-uk-heading">Typical timeline</th>
                    <th className="border-b border-uk-line px-5 py-4 font-heading font-bold text-uk-heading">Starting from</th>
                    <th className="border-b border-uk-line px-5 py-4 font-heading font-bold text-uk-heading">First milestone</th>
                  </tr>
                </thead>
                <tbody>
                  {solutions.map((s) => {
                    const fact = (label: string) => s.quickFacts.find((f) => f.label === label);
                    return (
                      <tr key={s.slug} className="group transition-colors hover:bg-uk-surface">
                        <td className="border-b border-uk-line px-5 py-4">
                          <Link href={`/solutions/${s.slug}`} className="inline-flex items-center gap-1.5 font-semibold text-uk-heading transition-colors group-hover:text-uk-blue">
                            {s.name}
                            <ArrowRight className="h-3.5 w-3.5 text-uk-blue opacity-0 transition-opacity group-hover:opacity-100" />
                          </Link>
                          <span className="block text-xs text-uk-muted">{s.category}</span>
                        </td>
                        <td className="border-b border-uk-line px-5 py-4 text-uk-gray">{s.bestFor.slice(0, 3).join(" · ")}</td>
                        <td className="border-b border-uk-line px-5 py-4 whitespace-nowrap font-medium text-uk-body">{fact("Typical timeline")?.value ?? "—"}</td>
                        <td className="border-b border-uk-line px-5 py-4 whitespace-nowrap font-heading font-bold text-uk-blue">{fact("Starting investment")?.value ?? "—"}</td>
                        <td className="border-b border-uk-line px-5 py-4 whitespace-nowrap text-uk-body">
                          <span className="font-medium">{s.quickFacts[3]?.value ?? "—"}</span>
                          <span className="block text-xs text-uk-muted">{s.quickFacts[3]?.sub ?? ""}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Reveal>
          </Container>
        </section>

        {/* How a solution build runs */}
        <section className="relative bg-uk-surface-2 section-py">
          <div className="absolute inset-0 bg-dots opacity-20" aria-hidden />
          <Container className="relative">
            <SectionHeading
              eyebrow="How it works"
              title={<>Every solution follows the same disciplined path.</>}
              description="Whether you pick CRM, POS or loan origination, the build runs through the same four stages — because the discipline is what makes the software survive."
            />
            <Reveal staggerChildren className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {processSteps.map((p) => (
                <div
                  key={p.step}
                  className="flex flex-col gap-3 rounded-2xl border border-uk-line bg-uk-card p-6 card-hover"
                >
                  <span className="font-heading text-3xl font-bold text-uk-blue/25">
                    {p.step}
                  </span>
                  <h3 className="font-heading text-base font-bold text-uk-heading">
                    {p.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-uk-gray">
                    {p.duration} — {p.points[0]}
                  </p>
                </div>
              ))}
            </Reveal>
          </Container>
        </section>

        <TimeSavers className="bg-uk-surface-2" />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}