import type { Metadata } from "next";
import { withSharePreview } from "@/lib/page-metadata";
import Link from "@/components/site/intent-link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ShieldCheck, ChevronRight, Target, Gauge } from "lucide-react";
import { Header } from "@/components/site/header";
import { ScopingButton } from "@/components/site/scoping-modal";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { PageHero, oneLineTitle, heroExtras } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { CtaBand } from "@/components/site/cta";
import { getHireRoles } from "@/lib/hire-store";
import { ukText } from "@/lib/texts";

// Re-render at least once a minute so admin text overrides always show up.
export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getHireRoles()).map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = (await getHireRoles()).find((x) => x.slug === slug);
  if (!r) return {};
  return withSharePreview({
    title: `Hire ${r.title} — dedicated, verified, code you own`,
    description: r.description,
    alternates: { canonical: `https://ukvalley.com/hire/${r.slug}` },
  });
}

export default async function HireRolePage({ params }: Props) {
  const { slug } = await params;
  const hireRoles = await getHireRoles();
  const r = hireRoles.find((x) => x.slug === slug);
  if (!r) notFound();

  const others = hireRoles.filter((x) => x.slug !== r.slug).slice(0, 4);

  return (
    <>
      <ScrollProgress />
      <Header />
      <main id="main">
        <PageHero
          variant="hire"
          extras={heroExtras.hire}
          titleClassName={oneLineTitle.hire}
          eyebrow={ukText(`Hire ${r.shortLabel} ${r.noun ?? "developers"}`)}
          crumbs={[
            { label: "Home", href: "/" },
            { label: "Hire Developers", href: "/hire" },
            { label: r.title },
          ]}
          title={ukText(`Hire ${r.title}`)}
          description={ukText(r.description)}
        />

        {/* Metrics band */}
        <section className="relative border-y border-uk-line bg-uk-surface-2">
          <Container className="grid grid-cols-1 gap-px overflow-hidden sm:grid-cols-3">
            {r.metrics.map((m) => (
              <div key={m.label} className="flex flex-col gap-1 px-4 py-8 text-center">
                <span className="font-heading text-4xl font-bold text-uk-blue">{ukText(m.value)}</span>
                <span className="text-xs font-medium uppercase tracking-wider text-uk-gray">{ukText(m.label)}</span>
              </div>
            ))}
          </Container>
        </section>

        {/* The problem it solves */}
        <section className="relative bg-uk-surface section-py">
          <Container>
            <Reveal>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">
                <Target className="h-3.5 w-3.5" />{ukText("The problem it solves")}</span>
            </Reveal>
            <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1.25fr_1fr] lg:items-start lg:gap-16">
              <Reveal className="flex flex-col gap-5">
                <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("Why hire ")}{ukText(r.shortLabel)} {ukText(r.noun ?? "engineers")}{" "}{ukText("from us")}</h2>
                {r.longDescription.map((para, i) => (
                  <p key={i} className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">
                    {ukText(para)}
                  </p>
                ))}
              </Reveal>

              <Reveal className="flex flex-col gap-5">
                <div className="flex w-full flex-col rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-7">
                  <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText("What they bring on day one")}</h3>
                  <ul className="mt-4 flex flex-col gap-3.5">
                    {r.skills.slice(0, 4).map((sk) => (
                      <li key={sk.title} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-uk-blue/12 text-uk-blue">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                        <p className="text-sm leading-relaxed text-uk-body">{ukText(sk.title)}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex w-full flex-col rounded-2xl border border-uk-blue/20 bg-uk-surface-blue p-6 sm:p-7">
                  <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-uk-heading">
                    <Gauge className="h-4 w-4 text-uk-blue" />{ukText("At a glance")}</h3>
                  <dl className="mt-4 flex flex-col divide-y divide-uk-line">
                    {r.metrics.map((m) => (
                      <div key={m.label} className="flex items-baseline justify-between gap-4 py-3">
                        <dt className="text-sm text-uk-gray">{ukText(m.label)}</dt>
                        <dd className="whitespace-nowrap font-heading text-base font-bold text-uk-blue">{ukText(m.value)}</dd>
                      </div>
                    ))}
                    <div className="flex items-baseline justify-between gap-4 py-3">
                      <dt className="text-sm text-uk-gray">{ukText("Engagement models")}</dt>
                      <dd className="whitespace-nowrap font-heading text-base font-bold text-uk-blue">{ukText(r.engagement.length)}</dd>
                    </div>
                  </dl>
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        {/* Skills */}
        <section className="relative bg-uk-surface-2 section-py">
          <div className="absolute inset-0 bg-dots opacity-20" aria-hidden />
          <Container className="relative">
            <Reveal className="max-w-2xl">
              <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("What they bring to your team")}</h2>
            </Reveal>
            <Reveal staggerChildren className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {r.skills.map((sk) => (
                <div
                  key={sk.title}
                  className="flex flex-col gap-2 rounded-2xl border border-uk-line bg-uk-card p-6 card-hover"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-uk-blue/12 text-uk-blue">
                    <Check className="h-5 w-5" />
                  </span>
                  <h3 className="font-heading text-base font-bold text-uk-heading">
                    {ukText(sk.title)}
                  </h3>
                  <p className="text-sm leading-relaxed text-uk-gray">{ukText(sk.desc)}</p>
                </div>
              ))}
            </Reveal>

            <Reveal className="mt-10">
              <h3 className="font-heading text-base font-bold text-uk-heading">{ukText("Tools & stack")}</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {r.techs.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-uk-surface-blue px-2.5 py-1 text-[0.78rem] font-medium text-uk-body"
                  >
                    {ukText(t)}
                  </span>
                ))}
              </div>
            </Reveal>
          </Container>
        </section>

        {/* Engagement models */}
        <section className="relative bg-uk-surface section-py">
          <Container>
            <Reveal className="max-w-2xl">
              <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("Ways to engage")}</h2>
              <p className="mt-3 text-uk-gray">{ukText("Every model includes: NDA & IP assignment before day one, your repositories, code review culture and a one-week scale-or-pause notice period.")}</p>
            </Reveal>
            <Reveal staggerChildren className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {r.engagement.map((e) => (
                <div
                  key={e.name}
                  className="flex flex-col gap-2 rounded-2xl border border-uk-line bg-uk-card p-6 card-hover"
                >
                  <h3 className="font-heading text-base font-bold text-uk-blue">
                    {ukText(e.name)}
                  </h3>
                  <p className="text-sm leading-relaxed text-uk-gray">{ukText(e.desc)}</p>
                </div>
              ))}
            </Reveal>

            <Reveal className="mt-10 rounded-2xl border border-uk-blue/20 bg-uk-surface-blue p-6">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 flex-none text-uk-blue" />
                <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText("Replace-anytime guarantee")}</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-uk-gray">{ukText("If the engineer isn't the right fit, tell us — we replace them within a week at no extra cost, with a documented handover so context isn't lost. The guarantee is written into the agreement, not a verbal promise.")}</p>
            </Reveal>
          </Container>
        </section>

        {/* Process */}
        <section className="relative bg-uk-surface-2 section-py">
          <Container>
            <Reveal className="max-w-2xl">
              <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("How hiring works")}</h2>
              <p className="mt-3 text-uk-gray">{ukText("Four steps from enquiry to a working engineer — typically inside a week.")}</p>
            </Reveal>
            <Reveal staggerChildren className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {r.process.map((p, i) => (
                <div
                  key={p.title}
                  className="flex flex-col gap-3 rounded-2xl border border-uk-line bg-uk-card p-6 card-hover"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-uk-blue/12 font-heading text-sm font-bold text-uk-blue">
                    {ukText(String(i + 1).padStart(2, "0"))}
                  </span>
                  <h3 className="font-heading text-base font-bold text-uk-heading">
                    {ukText(p.title)}
                  </h3>
                  <p className="text-sm leading-relaxed text-uk-gray">{ukText(p.desc)}</p>
                </div>
              ))}
            </Reveal>
          </Container>
        </section>

        {/* FAQs */}
        <section className="relative bg-uk-surface section-py">
          <Container className="max-w-5xl">
            <Reveal className="max-w-2xl">
              <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("Common questions")}</h2>
            </Reveal>
            <Reveal staggerChildren className="mt-8 flex flex-col gap-4">
              {r.faqs.map((f) => (
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

        {/* Other roles */}
        <section className="relative bg-uk-surface-2 section-py">
          <Container>
            <Reveal className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("Hire other specialisations")}</h2>
              <Link
                href={ukText("/hire")}
                className="group inline-flex items-center gap-2 text-sm font-semibold text-uk-blue transition-colors hover:text-uk-blue-bright"
              >{ukText("All developers")}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
            <Reveal staggerChildren className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {others.map((o) => (
                <Link
                  key={o.slug}
                  href={ukText(`/hire/${o.slug}`)}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-uk-line bg-uk-card px-4 py-3 transition-colors hover:border-uk-blue/40"
                >
                  <span className="text-sm font-medium text-uk-heading">{ukText("Hire ")}{ukText(o.title)}
                  </span>
                  <ArrowRight className="h-4 w-4 flex-none text-uk-blue opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </Reveal>

            <Reveal className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-uk-blue/20 bg-uk-surface-blue p-6">
              <div>
                <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText("Ready to meet your first ")}{ukText(r.shortLabel)}{" "}{ukText("hire?")}</h3>
                <p className="mt-1 text-sm text-uk-gray">{ukText("A 30-minute scoping call starts the shortlist — typically interviewing within 48 hours.")}</p>
              </div>
              <ScopingButton className="btn-sheen btn-lift group inline-flex cursor-pointer items-center gap-2 rounded-full bg-uk-blue px-5 py-2.5 text-sm font-semibold text-white shadow-glow-blue-sm hover:bg-uk-blue-bright">{ukText("Start hiring")}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </ScopingButton>
            </Reveal>

            <Reveal className="mt-10 border-t border-uk-line pt-8">
              <Link
                href={ukText("/hire")}
                className="group inline-flex items-center gap-2 text-sm font-semibold text-uk-blue transition-colors hover:text-uk-blue-bright"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />{ukText("All developers")}</Link>
            </Reveal>
          </Container>
        </section>

        <CtaBand />
      </main>
      <Footer />
    </>
  );
}