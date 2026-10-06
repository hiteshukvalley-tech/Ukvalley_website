import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site-origin";
import { editableMetadata } from "@/lib/page-metadata";
import Link from "@/components/site/intent-link";
import { ArrowRight, Users, Target, Check, Gauge } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { heroExtras } from "@/components/site/page-hero";
import { EditableHero, PageBlocks } from "@/components/site/page-extras";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { PhotoPanel } from "@/components/site/photo-panel";
import { CtaBand } from "@/components/site/cta";
import { values } from "@/lib/site-data";
import { getSiteSettings } from "@/lib/settings";
import { getPageContent } from "@/lib/pages-store";
import { getTeam } from "@/lib/team-store";
import { getCareers } from "@/lib/careers-store";
import { ukText } from "@/lib/texts";

// Re-render at least once a minute so admin text overrides always show up.
export const revalidate = 60;

// Title and description can be replaced in Admin → Page text (SEO fields).
export const generateMetadata = () => editableMetadata("team", baseMetadata);
const baseMetadata: Metadata = {
  title: "Our team — accountable for your project",
  description:
    "Meet Ukvalley's leadership: named engineers and operators you can reach directly — a founder LinkedIn, not a generic contact form. Engineer-led, unfunded, accountable since 2017.",
  alternates: { canonical: `${SITE_URL}/team` },
};

export default async function TeamPage() {
  const company = await getSiteSettings();
  const [team, careers, page] = await Promise.all([getTeam(), getCareers(), getPageContent("team")]);
  return (
    <>
      <ScrollProgress />
      <Header />
      <main id="main">
        <EditableHero pageKey="team"
          variant="company"
          extras={heroExtras.company}
          eyebrow={ukText("Our team")}
          crumbs={[{ label: "Home", href: "/" }, { label: "Our Team" }]}
          title={
            <>{ukText("Named people, not an")}{" "}
              <span className="text-gradient-blue">{ukText("anonymous org chart.")}</span>
            </>
          }
          description={ukText("These are the people who scope, build and stand behind your project — real names, real roles and a founder LinkedIn instead of a generic contact form.")}
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
                <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("Why an anonymous team is a risk you're taking on faith")}</h2>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">{ukText("Most agency websites show a generic \"our team\" stock photo grid, or list a dozen names with no indication of who actually touches your codebase. That anonymity is convenient for the vendor: nobody is personally accountable when a decision goes wrong, and the sales rep who scoped your project is rarely the engineer who builds it.")}</p>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">{ukText("The cost shows up mid-project: a question that should take an hour to answer takes three days because it has to route through account management to whichever engineer is free that week. Institutional knowledge lives in one person's head, and if they leave, your project restarts its learning curve from someone else's memory.")}</p>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">{ukText("We publish real names and real roles because the alternative — trusting a faceless \"team\" — is exactly the risk we're asking you not to take. The architect who scoped your project stays accountable for it through build, launch and support, and you can reach them directly.")}</p>
              </Reveal>

              <Reveal className="flex flex-col gap-5">
                <div className="flex w-full flex-col rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-7">
                  <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText("What continuity gets you")}</h3>
                  <ul className="mt-4 flex flex-col gap-3.5">
                    {[
                      "One architect accountable from scoping to support, by name",
                      "No re-briefing a new face every time someone rotates off",
                      "A handover document written by the people who actually built it",
                      "Direct access — not a ticket queue reading from a script",
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
                      { label: "Leadership named", value: String(team.length), sub: "Not an anonymous org chart" },
                      { label: "Named architect", value: "Every project", sub: "From scoping to support" },
                      { label: "Building since", value: String(company.foundedYear), sub: "Same founding team" },
                      { label: "Engineer replacement", value: "Guaranteed", sub: "Written into the contract" },
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

        {/* Team grid */}
        <section className="relative bg-uk-surface-2 section-py">
          <Container>
            <Reveal staggerChildren className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((m) => (
                <article
                  key={m.name}
                  className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-uk-line bg-uk-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-uk-blue/40"
                >
                  <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-uk-blue/0 blur-3xl transition-all duration-500 group-hover:bg-uk-blue/15" aria-hidden />
                  <div className={m.image ? "flex flex-col gap-4" : "flex items-center gap-4"}>
                    {m.image ? (
                      // plain <img>: the admin can point this at /media/<id> or any https address
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.image} alt={ukText(m.name)} loading="lazy" className="mx-auto aspect-square w-full max-w-[15rem] rounded-xl bg-white object-cover object-top ring-1 ring-uk-line" />
                    ) : (
                      <span
                        className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-uk-blue to-uk-blue-bright font-heading text-lg font-bold text-uk-white"
                        aria-hidden
                      >
                        {ukText(m.name.split(" ").filter((n) => /^[A-Za-z]/.test(n) && !n.endsWith(".")).map((n) => n[0]).join("").slice(0, 2))}
                      </span>
                    )}
                    <div>
                      <h2 className="font-heading text-lg font-bold text-uk-heading">
                        {ukText(m.name)}
                      </h2>
                      <p className="text-sm text-uk-blue">{ukText(m.role)}</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-uk-gray">{ukText(m.bio)}</p>
                  <span className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-uk-surface-blue px-3 py-1 text-xs font-medium text-uk-body">
                    <span className="h-1.5 w-1.5 rounded-full bg-uk-yellow" />
                    {ukText(m.focus)}
                  </span>
                </article>
              ))}
            </Reveal>
          </Container>
        </section>

        <PhotoPanel
          photo={{
            src: page.workImage || "/team-pool.svg",
            alt:
              page.workImageAlt ||
              "Architects, full-stack, mobile and QA engineers working as one pool across the Pune and Nagpur offices",
            custom: true,
          }}
          eyebrow={ukText("How the team is built")}
          title={ukText("Senior engineers stay on the project — juniors learn beside them, not instead of them.")}
          facts={[
            "Every project has a named architect from scoping to support",
            "Code review by a senior engineer on every merge",
            "Engineers rotate onto our own products between client work",
            "Replace-anytime guarantee written into every hire",
          ]}
          caption={ukText("Architects, full-stack, mobile and QA engineers work as one pool across both offices.")}
        >
          <p>{ukText("The classic agency trick is to sell you a senior architect and staff the build with whoever is free. We do the opposite: the person who scoped your system is accountable for it until it is in production and supported, and their name is on every weekly note.")}</p>
          <p>{ukText("That continuity is what saves your time. Nobody has to be re-briefed, decisions do not get re-litigated by a new face, and the handover document is written by the people who actually built the thing.")}</p>
        </PhotoPanel>

        {/* How we work */}
        <section className="relative bg-uk-surface section-py">
          <div className="absolute inset-0 bg-dots opacity-20" aria-hidden />
          <Container className="relative">
            <SectionHeading
              eyebrow={ukText("How we work")}
              title={<>{ukText("Three values that show up in the code.")}</>}
              description={ukText("Not posters on a wall — operating rules you can verify on any project: the demo cadence, the shared board and the written scope all come from these.")}
            />
            <Reveal staggerChildren className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
              {values.map((v) => (
                <div
                  key={v.title}
                  className="flex flex-col gap-2 rounded-2xl border border-uk-line bg-uk-card p-6 card-hover"
                >
                  <h3 className="font-heading text-lg font-bold text-uk-blue">
                    {ukText(v.title)}
                  </h3>
                  <p className="text-sm leading-relaxed text-uk-gray">{ukText(v.desc)}</p>
                </div>
              ))}
            </Reveal>
          </Container>
        </section>

        {/* Hiring */}
        <section className="relative bg-uk-surface-2 section-py">
          <Container>
            <Reveal className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("Join them")}</h2>
                <p className="mt-3 text-uk-gray">{ukText("We're hiring engineers and designers who want to own outcomes — ")}{ukText(careers.length)}{" "}{ukText("roles open now.")}</p>
              </div>
              <Link
                href={ukText("/careers")}
                className="group inline-flex items-center gap-2 rounded-full border border-uk-line bg-white dark:bg-uk-card px-5 py-2.5 text-sm font-semibold text-uk-heading transition-colors hover:border-uk-blue/50 hover:text-uk-blue-bright"
              >
                <Users className="h-4 w-4 text-uk-blue" />{ukText("See open roles")}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
            <Reveal staggerChildren className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {careers.map((c) => (
                <Link
                  key={c.slug}
                  href={ukText(`/careers/${c.slug}`)}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-uk-line bg-uk-card px-4 py-3 transition-colors hover:border-uk-blue/40"
                >
                  <span className="text-sm font-medium text-uk-heading">{ukText(c.role)}</span>
                  <span className="text-xs text-uk-muted">{ukText(c.location)}</span>
                </Link>
              ))}
            </Reveal>
          </Container>
        </section>

        <CtaBand />
        <PageBlocks pageKey="team" />
      </main>
      <Footer />
    </>
  );
}