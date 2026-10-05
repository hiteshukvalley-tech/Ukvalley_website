import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site-origin";
import { withSharePreview } from "@/lib/page-metadata";
import Link from "@/components/site/intent-link";
import { notFound } from "next/navigation";
import {
  MapPin, Building, Landmark, Flag, Cpu, Briefcase,
  Factory, Building2, Globe,
  ArrowLeft, ArrowRight, Check, ChevronRight, type LucideIcon,
} from "lucide-react";
import { Header } from "@/components/site/header";
import { ScopingButton } from "@/components/site/scoping-modal";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { PageHero, heroExtras } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { CtaBand } from "@/components/site/cta";
import { getLocations } from "@/lib/locations-store";
import { ukText } from "@/lib/texts";

// Re-render at least once a minute so admin text overrides always show up.
export const revalidate = 60;

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

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getLocations()).map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const l = (await getLocations()).find((x) => x.slug === slug);
  if (!l) return {};
  return withSharePreview({
    title: `${l.city} — software development ${l.type === "Presence" ? "presence" : "office & delivery"}`,
    description: l.blurb,
    alternates: { canonical: `${SITE_URL}/locations/${l.slug}` },
  });
}

export default async function LocationPage({ params }: Props) {
  const { slug } = await params;
  const locations = await getLocations();
  const l = locations.find((x) => x.slug === slug);
  if (!l) notFound();

  const Icon = icons[l.icon] ?? MapPin;
  const others = locations.filter((x) => x.slug !== l.slug).slice(0, 6);

  return (
    <>
      <ScrollProgress />
      <Header />
      <main id="main">
        <PageHero
          variant="company"
          extras={heroExtras.company}
          eyebrow={ukText(`${l.type} · ${l.city}`)}
          crumbs={[
            { label: "Home", href: "/" },
            { label: "Locations", href: "/locations" },
            { label: l.city },
          ]}
          title={
            <span className="inline-flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-uk-blue/12 text-uk-blue">
                <Icon className="h-6 w-6" />
              </span>
              {ukText(l.city)}
            </span>
          }
          description={ukText(l.blurb)}
        />

        {/* Meta band */}
        <section className="relative border-y border-uk-line bg-uk-surface-2">
          <Container className="grid grid-cols-1 gap-px overflow-hidden sm:grid-cols-3">
            {l.proof.map((p) => (
              <div key={p.label} className="flex flex-col gap-1 px-4 py-8 text-center">
                <span className="font-heading text-4xl font-bold text-uk-blue">{ukText(p.value)}</span>
                <span className="text-xs font-medium uppercase tracking-wider text-uk-gray">{ukText(p.label)}</span>
              </div>
            ))}
          </Container>
        </section>

        {/* About the location */}
        <section className="relative bg-uk-surface section-py">
          <Container className="max-w-5xl">
            <Reveal className="flex flex-col gap-5">
              <h2 className="font-heading text-2xl font-bold text-uk-heading">
                {ukText(l.city)}{" "}{ukText("at Ukvalley")}</h2>
              {l.paragraphs.map((para, i) => (
                <p key={i} className="text-justify-prose text-lg leading-relaxed text-uk-body">
                  {ukText(para)}
                </p>
              ))}
            </Reveal>

            <Reveal className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-xl border border-uk-line bg-uk-card p-4">
                <MapPin className="mt-0.5 h-5 w-5 flex-none text-uk-blue" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-uk-gray">{ukText("Time zone")}</p>
                  <p className="text-sm font-medium text-uk-heading">{ukText(l.timezone)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-uk-line bg-uk-card p-4">
                <Landmark className="mt-0.5 h-5 w-5 flex-none text-uk-blue" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-uk-gray">{ukText("Languages")}</p>
                  <p className="text-sm font-medium text-uk-heading">{ukText(l.languages.join(" · "))}</p>
                </div>
              </div>
              {l.address && (
                <div className="flex items-start gap-3 rounded-xl border border-uk-line bg-uk-card p-4 sm:col-span-2">
                  <Building className="mt-0.5 h-5 w-5 flex-none text-uk-blue" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-uk-gray">{ukText("Address")}</p>
                    <p className="text-sm font-medium text-uk-heading">{ukText(l.address)}</p>
                  </div>
                </div>
              )}
            </Reveal>
          </Container>
        </section>

        {/* What we deliver here */}
        <section className="relative bg-uk-surface-2 section-py">
          <div className="absolute inset-0 bg-dots opacity-20" aria-hidden />
          <Container className="relative">
            <Reveal className="max-w-2xl">
              <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("What ")}{ukText(l.city)}{" "}{ukText("clients build with us")}</h2>
            </Reveal>
            <Reveal staggerChildren className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {l.services.map((s) => (
                <div
                  key={s}
                  className="flex items-center gap-3 rounded-2xl border border-uk-line bg-uk-card p-5 card-hover"
                >
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-uk-blue/12 text-uk-blue">
                    <Check className="h-4 w-4" />
                  </span>
                  <span className="font-heading text-sm font-bold leading-snug text-uk-heading">
                    {ukText(s)}
                  </span>
                </div>
              ))}
            </Reveal>
            <Reveal className="mt-8">
              <Link
                href={ukText("/services")}
                className="group inline-flex items-center gap-2 text-sm font-semibold text-uk-blue transition-colors hover:text-uk-blue-bright"
              >{ukText("See all services")}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </Container>
        </section>

        {/* FAQs */}
        <section className="relative bg-uk-surface section-py">
          <Container className="max-w-5xl">
            <Reveal className="max-w-2xl">
              <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">
                {ukText(l.city)}{" "}{ukText("— common questions")}</h2>
            </Reveal>
            <Reveal staggerChildren className="mt-8 flex flex-col gap-4">
              {l.faqs.map((f) => (
                <details
                  key={f.q}
                  className="group rounded-2xl border border-uk-line bg-uk-card px-5 py-4 transition-colors hover:border-uk-blue/40 open:border-uk-blue/40"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-heading text-base font-semibold text-uk-heading [&::-webkit-details-marker]:hidden">
                    {ukText(f.q)}
                    <ChevronRight className="h-4 w-4 flex-none text-uk-muted transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-uk-gray">{ukText(f.a)}</p>
                </details>
              ))}
            </Reveal>
          </Container>
        </section>

        {/* Other locations */}
        <section className="relative bg-uk-surface-2 section-py">
          <Container>
            <Reveal className="max-w-2xl">
              <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("Other locations")}</h2>
            </Reveal>
            <Reveal staggerChildren className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((o) => (
                <Link
                  key={o.slug}
                  href={ukText(`/locations/${o.slug}`)}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-uk-line bg-uk-card px-4 py-3 transition-colors hover:border-uk-blue/40"
                >
                  <span className="text-sm font-medium text-uk-heading">{ukText(o.city)}</span>
                  <ArrowRight className="h-4 w-4 flex-none text-uk-blue opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </Reveal>

            <Reveal className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-uk-blue/20 bg-uk-surface-blue p-6">
              <div>
                <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText("In or around ")}{ukText(l.city)}{ukText("? Let's talk.")}</h3>
                <p className="mt-1 text-sm text-uk-gray">{ukText("A reply within 1 business hour — from an architect, not a sales bot.")}</p>
              </div>
              <ScopingButton className="btn-sheen btn-lift group inline-flex cursor-pointer items-center gap-2 rounded-full bg-uk-blue px-5 py-2.5 text-sm font-semibold text-white shadow-glow-blue-sm hover:bg-uk-blue-bright">{ukText("Book a scoping call")}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </ScopingButton>
            </Reveal>

            <Reveal className="mt-10 border-t border-uk-line pt-8">
              <Link
                href={ukText("/locations")}
                className="group inline-flex items-center gap-2 text-sm font-semibold text-uk-blue transition-colors hover:text-uk-blue-bright"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />{ukText("All locations")}</Link>
            </Reveal>
          </Container>
        </section>

        <CtaBand />
      </main>
      <Footer />
    </>
  );
}