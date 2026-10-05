import { getServices } from "@/lib/services-store";
import { SITE_URL } from "@/lib/site-origin";
import { countWord } from "@/lib/services-validation";
import type { Metadata } from "next";
import { editableMetadata } from "@/lib/page-metadata";
import Link from "@/components/site/intent-link";
import { ArrowRight, ShieldCheck, Clock, Rocket, Users, Building2, Check } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { heroExtras } from "@/components/site/page-hero";
import { EditableHero, FounderSection, PageBlocks } from "@/components/site/page-extras";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { CtaBand } from "@/components/site/cta";
import { PhotoPanel } from "@/components/site/photo-panel";
import { ByTheNumbers } from "@/components/site/by-the-numbers";
import { stats, principles, values } from "@/lib/site-data";
import { isRealIdentifier } from "@/lib/site-core";
import { getSiteSettings } from "@/lib/settings";
import { getPageContent } from "@/lib/pages-store";
import { getTeam } from "@/lib/team-store";
import { ukText } from "@/lib/texts";

// Re-render at least once a minute so admin text overrides always show up.
export const revalidate = 60;

// Title and description can be replaced in Admin → Page text (SEO fields).
export const generateMetadata = () => editableMetadata("about", baseMetadata);
const baseMetadata: Metadata = {
  title: "About Ukvalley Technologies — software engineers since 2017",
  description:
    "Founded in 2017, Ukvalley Technologies builds custom software, CRM, ERP and mobile apps for Indian SMEs and global startups. Meet the team and the principles we build on.",
  alternates: { canonical: `${SITE_URL}/about` },
};

const principleIcons = [ShieldCheck, Clock, Rocket, Users];

export default async function AboutPage() {
  const team = await getTeam();
  const page = await getPageContent("about");
  const company = await getSiteSettings();
  const serviceCount = (await getServices()).length;
  return (
    <>
      <ScrollProgress />
      <Header />
      <main id="main">
        <EditableHero pageKey="about" variant="company"
          extras={heroExtras.company}
          eyebrow={ukText("About us")}
          crumbs={[{ label: "Home", href: "/" }, { label: "About" }]}
          title={
            <>{ukText("An engineering-led team building software that")}{" "}
              <span className="text-gradient-blue">{ukText("earns its keep")}</span>{ukText("— since 2017.")}</>
          }
          description={
            <>{ukText("Ukvalley Technologies is an unfunded, engineer-led software company headquartered in Maharashtra, India, with offices in Pune and Nagpur and presence in Dubai, Toronto and New York. We build, ship and support software for Indian SMEs and global startups — and we run our own products in production as proof.")}</>
          }
        />

        {/* Stats band */}
        <section className="relative bg-uk-surface-2 border-y border-uk-line">
          <Container className="grid grid-cols-2 gap-px overflow-hidden lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col gap-1 px-4 py-8 text-center">
                <span className="font-heading text-3xl font-bold text-uk-blue sm:text-4xl">
                  {ukText(s.value)}
                </span>
                <span className="text-xs font-medium uppercase tracking-wider text-uk-gray">
                  {ukText(s.label)}
                </span>
                <span className="text-xs text-uk-gray/70">{ukText(s.sub)}</span>
              </div>
            ))}
          </Container>
        </section>

        {/* Story */}
        <section className="relative bg-uk-surface section-py">
          <Container>
            {/* badge sits above the grid so the heading and the Registered
                entity card start at exactly the same height */}
            <Reveal>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">{ukText("Our story")}</span>
            </Reveal>
            <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_0.8fr] lg:items-start lg:gap-16">
              <Reveal className="flex flex-col gap-5">
                <h2 className="font-heading text-3xl font-bold text-uk-heading sm:text-4xl">{ukText("Engineers who scope it build it — no brokers, no offshoring pools.")}</h2>
                <div className="text-justify-prose space-y-4 text-lg leading-relaxed text-uk-gray">
                  <p>{ukText("Ukvalley was founded in 2017 with a simple premise: small and mid-sized businesses deserved the same engineering rigour the enterprise gets, at a cost that made sense. Our India cost base keeps us 30–40% below metro agencies without compromising on the people doing the work.")}</p>
                  <p>{ukText("Today we run ")}{ukText(countWord(serviceCount))}{" "}{ukText("service lines and a portfolio of our own products — TeleValley, Script Magix, Mediline Website, HR Agency Management System and Emailz.ca — all live in production. Products we run ourselves are proof most service firms can't offer.")}</p>
                  <p>{ukText("We stay unfunded by choice. It keeps us accountable to clients, not to a cap table. The engineers who scope your project are the engineers who build it, and you own the code from day one.")}</p>
                  <p>{ukText("Most agencies that raise venture money eventually optimise for the next round, not the current client — pricing shifts, senior staff get pulled onto whatever investors want to see, and roadmaps bend toward a pitch deck. Staying unfunded means our only growth lever is doing the work well enough that clients stay and refer the next one.")}</p>
                </div>
              </Reveal>

              <Reveal className="flex flex-col gap-5">
                <div className="flex w-full flex-col rounded-2xl border border-uk-line bg-uk-card p-6 card-premium card-spotlight sm:p-7">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-uk-blue/12 text-uk-blue">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText("Registered entity")}</h3>
                      <p className="text-xs text-uk-gray">{ukText("Company details")}</p>
                    </div>
                  </div>
                  <dl className="mt-5 flex flex-col gap-3 text-sm">
                    {[
                      ["Legal name", company.name],
                      ["Founded", String(company.foundedYear)],
                      ["Headquarters", company.city],
                      ["CIN", company.cin],
                      ["GSTIN", company.gstin],
                      ["Udyam (MSME)", company.udyam],
                    ]
                      .filter(([label, value]) => !["CIN", "GSTIN", "Udyam (MSME)"].includes(label) || isRealIdentifier(value))
                      .map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-baseline justify-between gap-4 border-b border-uk-line pb-3 last:border-0 last:pb-0"
                      >
                        <dt className="flex-none text-uk-gray">{ukText(label)}</dt>
                        <dd className="text-right font-medium text-uk-body">{ukText(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="flex w-full flex-col rounded-2xl border border-uk-blue/20 bg-uk-surface-blue p-6 sm:p-7">
                  <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText("Why unfunded matters to you")}</h3>
                  <ul className="mt-4 flex flex-col gap-3.5">
                    {[
                      "No cap table to answer to — only clients",
                      "Pricing reflects real cost, not investor-subsidised burn",
                      "No runway clock forcing a pivot or a shutdown mid-project",
                      "Growth comes from client referrals, not funding rounds",
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
              </Reveal>
            </div>
          </Container>
        </section>

        <FounderSection pageKey="about" />

        <PhotoPanel
          photo={{
            src: page.workImage || "/global-delivery.svg",
            alt:
              page.workImageAlt ||
              "Map linking delivery hubs in India, Dubai, Toronto and New York across overlapping working hours",
            custom: true,
          }}
          flip
          className="bg-uk-surface-2"
          eyebrow={ukText("Where the work happens")}
          title={ukText("Engineering from Maharashtra, clients on three continents.")}
          facts={[
            "Headquarters and engineering core in Maharashtra",
            "Client engagement hub in Pune",
            "Presence in Dubai, Toronto and New York",
            "Remote engineers across India on one delivery system",
          ]}
          caption={ukText("One engineering pool serving India, the Gulf and North America in overlapping hours.")}
        >
          <p>{ukText("Being outside the metros is a deliberate cost decision, not a constraint. It lets us keep senior engineers on every project at rates 30–40% below metro agencies, and it is why the architect on your scoping call is the architect on your build.")}</p>
          <p>{ukText("Distance never changes the discipline: the same shared board, weekly demo and 24-hour SLA apply whether you are an hour away in Pune or nine time zones away in Toronto.")}</p>
        </PhotoPanel>

        <ByTheNumbers limit={4} className="bg-uk-surface" />

        {/* Principles */}
        <section className="relative bg-uk-surface-2 section-py">
          <div className="absolute inset-0 bg-dots opacity-20" aria-hidden />
          <Container className="relative">
            <Reveal className="max-w-2xl">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">{ukText("How we work")}</span>
              <h2 className="mt-5 font-heading text-3xl font-bold text-uk-heading sm:text-4xl">{ukText("Four principles we build on")}</h2>
            </Reveal>
            <Reveal staggerChildren className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {principles.map((p, i) => {
                const Icon = principleIcons[i] ?? ShieldCheck;
                return (
                  <div
                    key={p.title}
                    className="flex gap-4 rounded-2xl border border-uk-line bg-uk-card p-6 card-hover"
                  >
                    <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-uk-blue/12 text-uk-blue">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="flex flex-col gap-1.5">
                      <h3 className="font-heading text-lg font-bold text-uk-heading">
                        {ukText(p.title)}
                      </h3>
                      <p className="text-sm leading-relaxed text-uk-gray">{ukText(p.desc)}</p>
                    </div>
                  </div>
                );
              })}
            </Reveal>
          </Container>
        </section>

        {/* Values */}
        <section className="relative bg-uk-surface section-py">
          <Container>
            <Reveal staggerChildren className="grid grid-cols-1 gap-5 md:grid-cols-3">
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

        {/* Team */}
        <section id="team" className="relative bg-uk-surface-2 section-py scroll-mt-24">
          <Container>
            <Reveal className="max-w-2xl">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">{ukText("Leadership")}</span>
              <h2 className="mt-5 font-heading text-3xl font-bold text-uk-heading sm:text-4xl">{ukText("The people accountable for your project")}</h2>
              <p className="mt-4 text-lg text-uk-gray">{ukText("Named leaders, not an anonymous team. Real people you can reach — and a founder LinkedIn, not a generic contact form.")}</p>
            </Reveal>

            <Reveal staggerChildren className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((m) => (
                <article
                  key={m.name}
                  className="group flex flex-col gap-3 rounded-2xl border border-uk-line bg-uk-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-uk-blue/40"
                >
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
                      <h3 className="font-heading text-lg font-bold text-uk-heading">
                        {ukText(m.name)}
                      </h3>
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

            <Reveal className="mt-10 flex justify-center">
              <Link
                href={ukText("/contact")}
                className="group inline-flex items-center gap-2 rounded-full border border-uk-line bg-white dark:bg-uk-card px-5 py-2.5 text-sm font-semibold text-uk-heading transition-colors hover:border-uk-blue/50 hover:text-uk-blue-bright"
              >{ukText("Talk to the team")}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </Container>
        </section>

        <CtaBand />
        <PageBlocks pageKey="about" />
      </main>
      <Footer />
    </>
  );
}