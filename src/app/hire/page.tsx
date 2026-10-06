import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site-origin";
import { editableMetadata } from "@/lib/page-metadata";
import Link from "@/components/site/intent-link";
import {
  Atom, Triangle, Server, Smartphone, Braces, Component,
  Database, Cloud, FlaskConical, Headset, Palette, ArrowRight, Target, Check, Gauge, type LucideIcon,
} from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { heroExtras } from "@/components/site/page-hero";
import { EditableHero, PageBlocks } from "@/components/site/page-extras";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { TimeSavers } from "@/components/site/time-savers";
import { CtaBand } from "@/components/site/cta";
import { principles } from "@/lib/site-data";
import { getHireRoles } from "@/lib/hire-store";
import { ukText } from "@/lib/texts";

// Re-render at least once a minute so admin text overrides always show up.
export const revalidate = 60;

// Title and description can be replaced in Admin → Page text (SEO fields).
export const generateMetadata = () => editableMetadata("hire", baseMetadata);
const baseMetadata: Metadata = {
  title: "Hire developers, designers & sales executives",
  description:
    "Hire dedicated React, Next.js, Node.js, Flutter, Python, Angular, Laravel, DevOps and QA engineers — plus UI/UX designers and sales executives — from Ukvalley. Verified on live work, code and pipeline data you own from day one, start in 48 hours.",
  alternates: { canonical: `${SITE_URL}/hire` },
};

const icons: Record<string, LucideIcon> = {
  atom: Atom,
  triangle: Triangle,
  server: Server,
  smartphone: Smartphone,
  braces: Braces,
  component: Component,
  database: Database,
  cloud: Cloud,
  flaskConical: FlaskConical,
  headset: Headset,
  palette: Palette,
};

export default async function HirePage() {
  const hireRoles = await getHireRoles();
  return (
    <>
      <ScrollProgress />
      <Header />
      <main id="main">
        <EditableHero pageKey="hire"
          variant="hire"
          extras={heroExtras.hire}
          eyebrow={ukText("Hire developers")}
          crumbs={[{ label: "Home", href: "/" }, { label: "Hire Developers" }]}
          title={
            <>{ukText("Hire engineers who've")}{" "}
              <span className="text-gradient-blue">{ukText("already shipped it.")}</span>
            </>
          }
          description={ukText("Twelve specialisations — ten engineering roles plus dedicated UI/UX designers and sales executives — and one standard: every hire is verified on live work by the leads who manage them daily, and you own the code, the design files and the pipeline from day one.")}
        />

        {/* The problem it solves */}
        <section className="relative bg-uk-surface section-py">
          <Container>
            <Reveal>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">
                <Target className="h-3.5 w-3.5" />{ukText("The problem it solves")}</span>
            </Reveal>
            <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1.25fr_1fr] lg:items-start lg:gap-16">
              <Reveal className="flex flex-col gap-5">
                <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("Why hiring a freelance developer is usually a coin flip")}</h2>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">{ukText("Most freelance marketplaces sell you a profile: a star rating, a portfolio of screenshots, and a rate. None of that tells you whether the person actually ships production code, whether they'll still answer messages in month three, or whether the \"5 years React experience\" survives a real code review. You find out after you've paid for two months of rework.")}</p>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">{ukText("A bad hire costs more than the invoice: weeks lost re-briefing a replacement, a codebase nobody wants to inherit, and a project timeline that resets every time someone ghosts. Recruitment agencies solve the sourcing problem but not the accountability one — once the placement fee clears, the quality of the work is entirely your risk.")}</p>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">{ukText("Every engineer we place is already on our payroll, reviewed on our own delivery standards, and backed by an architect who stays accountable for the engagement — not a marketplace profile you're taking on faith.")}</p>
              </Reveal>

              <Reveal className="flex flex-col gap-5">
                <div className="flex w-full flex-col rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-7">
                  <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText("What \"verified\" means here")}</h3>
                  <ul className="mt-4 flex flex-col gap-3.5">
                    {[
                      "Shortlisted from engineers already on our payroll",
                      "You interview them directly — no blind hires",
                      "A paid trial task proves the fit before any long term",
                      "Code review from a senior architect on every merge",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-uk-blue/12 text-uk-blue">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                        <p className="text-sm leading-relaxed text-uk-body">{ukText(item)}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex w-full flex-col rounded-2xl border border-uk-blue/20 bg-uk-surface-blue p-6 sm:p-7">
                  <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-uk-heading">
                    <Gauge className="h-4 w-4 text-uk-blue" />{ukText("At a glance")}</h3>
                  <dl className="mt-4 flex flex-col divide-y divide-uk-line">
                    {[
                      { label: "Specialisations", value: String(hireRoles.length), sub: "Engineering plus sales" },
                      { label: "Typical time to start", value: "48 hrs", sub: "Already on payroll" },
                      { label: "Replacement guarantee", value: "1 week", sub: "No extra cost" },
                      { label: "Code you own", value: "100%", sub: "From day one" },
                    ].map((f) => (
                      <div key={f.label} className="flex items-baseline justify-between gap-4 py-3">
                        <dt className="text-sm text-uk-gray">
                          {ukText(f.label)}
                          <span className="block text-xs text-uk-muted">{ukText(f.sub)}</span>
                        </dt>
                        <dd className="whitespace-nowrap font-heading text-base font-bold text-uk-blue">{ukText(f.value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        <section className="relative bg-uk-surface-2 section-py">
          <Container>
            <Reveal staggerChildren className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {hireRoles.map((r) => {
                const Icon = icons[r.icon] ?? Atom;
                return (
                  <Link
                    key={r.slug}
                    href={ukText(`/hire/${r.slug}`)}
                    className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-uk-line bg-uk-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-uk-blue/40"
                  >
                    <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-uk-blue/0 blur-3xl transition-all duration-500 group-hover:bg-uk-blue/15" aria-hidden />
                    <div className="flex items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-uk-blue/12 text-uk-blue transition-colors group-hover:bg-uk-blue group-hover:text-uk-white">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="rounded-full bg-uk-surface-blue px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-wider text-uk-blue">
                        {ukText(r.shortLabel)}
                      </span>
                    </div>
                    <h2 className="font-heading text-lg font-bold text-uk-heading">{ukText("Hire ")}{ukText(r.title)}
                    </h2>
                    <p className="text-sm leading-relaxed text-uk-gray">
                      {ukText(r.description)}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex flex-wrap gap-1.5">
                        {r.techs.slice(0, 3).map((t) => (
                          <span key={t} className="rounded-md bg-uk-surface-blue px-2 py-1 text-[0.7rem] font-medium text-uk-body">
                            {ukText(t)}
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

        {/* Why hire from us */}
        <section className="relative bg-uk-surface section-py">
          <div className="absolute inset-0 bg-dots opacity-20" aria-hidden />
          <Container className="relative">
            <SectionHeading
              eyebrow={ukText("Why Ukvalley")}
              title={<>{ukText("An engineer plus an engineering culture.")}</>}
              description={ukText("You're not renting a freelancer — you're getting a production-verified engineer backed by our review culture, architects and delivery system.")}
            />
            <Reveal staggerChildren className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {principles.map((p) => (
                <div
                  key={p.title}
                  className="flex flex-col gap-2 rounded-2xl border border-uk-line bg-uk-card p-6 card-hover"
                >
                  <h3 className="font-heading text-base font-bold text-uk-blue">
                    {ukText(p.title)}
                  </h3>
                  <p className="text-sm leading-relaxed text-uk-gray">{ukText(p.desc)}</p>
                </div>
              ))}
            </Reveal>
          </Container>
        </section>

        <TimeSavers
          className="bg-uk-surface-2"
          align="left"
          eyebrow={ukText("Hiring without the hiring")}
          title={
            <>{ukText("Skip the recruitment cycle — ")}<span className="text-uk-blue">{ukText("start in 48 hours.")}</span>
            </>
          }
          description={ukText("A typical hire takes 8–12 weeks of sourcing, interviews and notice periods. Our people are already on payroll, verified on live work, and backed by the same delivery rituals that give every client their time back.")}
        />
        <CtaBand />
        <PageBlocks pageKey="hire" />
      </main>
      <Footer />
    </>
  );
}