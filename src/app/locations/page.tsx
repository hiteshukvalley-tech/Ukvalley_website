import type { Metadata } from "next";
import Link from "@/components/site/intent-link";
import {
  MapPin, Building, Landmark, Flag, Cpu, Briefcase,
  Factory, Building2, Globe, ArrowRight, Target, Check, Gauge, type LucideIcon,
} from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { PageHero, heroExtras } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { CtaBand } from "@/components/site/cta";
import { getLocations } from "@/lib/locations-store";

export const metadata: Metadata = {
  title: "Locations — where Ukvalley engineers and engages",
  description:
    "Ukvalley's offices and delivery coverage: Maharashtra headquarters, Pune and Nagpur offices, and delivery coverage for Mumbai, Delhi NCR, Bengaluru, Hyderabad, Ahmedabad, Chennai, Dubai, Toronto and New York.",
  alternates: { canonical: "https://ukvalley.com/locations" },
};

const icons: Record<string, LucideIcon> = {
  mapPin: MapPin,
  building: Building,
  landmark: Landmark,
  flag: Flag,
  cpu: Cpu,
  briefcase: Briefcase,
  factory: Factory,
  building2: Building2,
  globe: Globe,
};

const typeStyles: Record<string, string> = {
  HQ: "bg-uk-yellow/20 text-uk-heading",
  Office: "bg-uk-blue/15 text-uk-blue",
  Delivery: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  Presence: "bg-uk-card text-uk-muted border border-uk-line",
};

export default async function LocationsPage() {
  const locations = await getLocations();
  const groups = [
    { label: "Our offices", items: locations.filter((l) => l.type === "HQ" || l.type === "Office") },
    { label: "Delivery coverage", items: locations.filter((l) => l.type === "Delivery") },
    { label: "International presence", items: locations.filter((l) => l.type === "Presence") },
  ];

  return (
    <>
      <ScrollProgress />
      <Header />
      <main id="main">
        <PageHero
          variant="company"
          extras={heroExtras.company}
          eyebrow="Locations"
          crumbs={[{ label: "Home", href: "/" }, { label: "Locations" }]}
          title={
            <>
              Engineering in Maharashtra —{" "}
              <span className="text-gradient-blue">clients on three continents.</span>
            </>
          }
          description="One engineering core, many front doors. A Maharashtra headquarters plus offices in Pune and Nagpur, delivery coverage across India's business hubs, and international presence for clients in the Gulf and North America."
        />

        {/* The problem it solves */}
        <section className="relative bg-uk-surface section-py">
          <Container>
            <Reveal>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">
                <Target className="h-3.5 w-3.5" />
                The problem it solves
              </span>
            </Reveal>
            <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1.25fr_1fr] lg:items-start lg:gap-16">
              <Reveal className="flex flex-col gap-5">
                <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">
                  Why "remote delivery" is where most vendors quietly cut corners
                </h2>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">
                  Distance is where vendors get sloppy first: the weekly demo becomes biweekly, then monthly; the named architect from the sales call becomes "the team" in every email; and a time-zone gap becomes the excuse for every missed deadline. Clients a plane ride away get the attention; clients a time zone away get the leftovers.
                </p>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">
                  That erosion is easy to miss until it's already cost you: a decision that should have taken a day takes a week because nobody was awake to make the call, and a status update that reads fine in an email would have raised obvious questions on a video call nobody scheduled.
                </p>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">
                  We run one delivery system everywhere — Maharashtra, Mumbai or Toronto — because the discipline that makes a project succeed has nothing to do with how far away the client sits.
                </p>
              </Reveal>

              <Reveal className="flex flex-col gap-5">
                <div className="flex w-full flex-col rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-7">
                  <h3 className="font-heading text-lg font-bold text-uk-heading">What doesn't change by distance</h3>
                  <ul className="mt-4 flex flex-col gap-3.5">
                    {[
                      "A named architect on the call, wherever you're calling from",
                      "The same weekly demo cadence, scheduled in your morning",
                      "The same 24-hour response SLA, every time zone",
                      "Async-first written updates so nothing waits on a wake-up",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-uk-blue/12 text-uk-blue">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                        <p className="text-sm leading-relaxed text-uk-body">{item}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex w-full flex-col rounded-2xl border border-uk-blue/20 bg-uk-surface-blue p-6 sm:p-7">
                  <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-uk-heading">
                    <Gauge className="h-4 w-4 text-uk-blue" />
                    At a glance
                  </h3>
                  <dl className="mt-4 flex flex-col divide-y divide-uk-line">
                    {[
                      { label: "Locations listed", value: String(locations.length), sub: "Offices, delivery and presence" },
                      { label: "Countries reached", value: String(new Set(locations.map((l) => l.country)).size), sub: "India, UAE, Canada, USA" },
                      { label: "Delivery cities", value: String(locations.filter((l) => l.type === "Delivery").length), sub: "Served remotely, no local office" },
                      { label: "Response SLA everywhere", value: "24 hrs", sub: "Same terms, every geography" },
                    ].map((f) => (
                      <div key={f.label} className="flex items-baseline justify-between gap-4 py-3">
                        <dt className="text-sm text-uk-gray">
                          {f.label}
                          <span className="block text-xs text-uk-muted">{f.sub}</span>
                        </dt>
                        <dd className="whitespace-nowrap font-heading text-base font-bold text-uk-blue">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        {groups.map((g) => (
          <section key={g.label} className="relative bg-uk-surface-2 section-py first:border-t-0">
            <Container>
              <Reveal>
                <h2 className="font-heading text-xl font-bold text-uk-heading sm:text-2xl">
                  {g.label}
                </h2>
              </Reveal>
              <Reveal staggerChildren className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((l) => {
                  const Icon = icons[l.icon] ?? MapPin;
                  return (
                    <Link
                      key={l.slug}
                      href={`/locations/${l.slug}`}
                      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-uk-line bg-uk-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-uk-blue/40"
                    >
                      <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-uk-blue/0 blur-3xl transition-all duration-500 group-hover:bg-uk-blue/15" aria-hidden />
                      <div className="flex items-center justify-between">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-uk-blue/12 text-uk-blue transition-colors group-hover:bg-uk-blue group-hover:text-uk-white">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wider ${typeStyles[l.type]}`}>
                          {l.type}
                        </span>
                      </div>
                      <h3 className="font-heading text-lg font-bold text-uk-heading">
                        {l.city}
                        <span className="ml-2 text-sm font-medium text-uk-muted">
                          {l.region}, {l.country}
                        </span>
                      </h3>
                      <p className="text-sm leading-relaxed text-uk-gray line-clamp-3">
                        {l.blurb}
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-3 text-xs text-uk-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-uk-blue" />
                          {l.timezone}
                        </span>
                        <ArrowRight className="h-4 w-4 text-uk-blue opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </Link>
                  );
                })}
              </Reveal>
            </Container>
          </section>
        ))}

        {/* Remote-first note */}
        <section className="relative bg-uk-surface section-py">
          <Container>
            <SectionHeading
              align="center"
              eyebrow="Remote-first"
              title={<>Your project isn&apos;t limited by our pin code.</>}
              description="Wherever you are, delivery runs the same way: a named architect, shared Jira and Slack, weekly demos and a 24-hour response SLA. Distance never changes the discipline."
            />
          </Container>
        </section>

        <CtaBand />
      </main>
      <Footer />
    </>
  );
}