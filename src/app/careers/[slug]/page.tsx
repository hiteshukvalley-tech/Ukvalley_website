import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site-origin";
import { fitTitle, withSharePreview } from "@/lib/page-metadata";
import Link from "@/components/site/intent-link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Award, Briefcase, CalendarDays, Check, Clock, Gift, Laptop, ListChecks, MapPin, Target, Workflow,
} from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { CtaBand } from "@/components/site/cta";
import { ApplyButton, CareerApplyProvider } from "@/components/site/career-apply";
import { getCareers } from "@/lib/careers-store";
import { getSiteSettings } from "@/lib/settings";
import { jsonLd } from "@/lib/utils";
import { formatExperience, formatPostedDate } from "@/lib/careers-shared";
import { ModeBadge } from "@/components/site/careers-board";
import { ukText } from "@/lib/texts";

// Re-render at least once a minute so admin text overrides always show up.
export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getCareers()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = (await getCareers()).find((x) => x.slug === slug);
  if (!c) return {};
  return withSharePreview({
    title: fitTitle(`${c.role} — Careers`, c.role),
    description: c.summary,
    alternates: { canonical: `${SITE_URL}/careers/${c.slug}` },
  });
}

/**
 * The free-text "Type" field (e.g. "Full-time", "Contract", "Internship") as
 * schema.org's employmentType values; anything unrecognised is left out.
 */
function employmentType(type: string): string | undefined {
  const t = type.toLowerCase();
  if (/intern/.test(t)) return "INTERN";
  if (/contract|freelanc|consult/.test(t)) return "CONTRACTOR";
  if (/temp/.test(t)) return "TEMPORARY";
  if (/part[\s-]*time/.test(t)) return "PART_TIME";
  if (/full[\s-]*time|permanent/.test(t)) return "FULL_TIME";
  return undefined;
}

function ListCard({ icon: Icon, title, items }: { icon: typeof Check; title: string; items: string[] }) {
  return (
    <Reveal className="rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-7">
      <h2 className="flex items-center gap-2 font-heading text-xl font-bold text-uk-heading">
        <Icon className="h-5 w-5 text-uk-blue" />
        {ukText(title)}
      </h2>
      <ul className="mt-5 flex flex-col gap-3.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-uk-blue/12 text-uk-blue">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            <p className="text-sm leading-relaxed text-uk-body sm:text-base">{ukText(item)}</p>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

export default async function CareerPage({ params }: Props) {
  const { slug } = await params;
  const [careers, settings] = await Promise.all([getCareers(), getSiteSettings()]);
  const c = careers.find((x) => x.slug === slug);
  if (!c) notFound();
  const others = careers.filter((x) => x.slug !== c.slug).slice(0, 4);

  const experience = formatExperience(c.experienceMin, c.experienceMax);
  // A place name for search engines; "India" / "Remote (India)" aren't a locality.
  const locality = /^(remote|hybrid|india)\b/i.test(c.location) ? undefined : c.location;

  // Structured data so search engines can list the role as a job opening.
  const jobPosting = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: c.role,
    description: [c.summary, ...c.responsibilities, ...c.requirements].join(" "),
    datePosted: c.postedAt,
    ...(employmentType(c.type) ? { employmentType: employmentType(c.type) } : {}),
    // No closing date is stored for a role, so there's no validThrough.
    hiringOrganization: {
      "@type": "Organization",
      name: settings.name,
      url: `${SITE_URL}`,
      logo: `${SITE_URL}/brand/ukvalley-logo.png`,
    },
    directApply: true,
    ...(c.experienceMin > 0
      ? { experienceRequirements: { "@type": "OccupationalExperienceRequirements", monthsOfExperience: c.experienceMin * 12 } }
      : {}),
    ...(c.mode === "Remote"
      ? { jobLocationType: "TELECOMMUTE", applicantLocationRequirements: { "@type": "Country", name: "India" } }
      : {
          jobLocation: {
            "@type": "Place",
            address: { "@type": "PostalAddress", ...(locality ? { addressLocality: locality } : {}), addressCountry: "IN" },
          },
        }),
  };

  const overview: { icon: typeof Briefcase; label: string; value: React.ReactNode }[] = [
    { icon: Briefcase, label: "Role", value: c.role },
    { icon: MapPin, label: "Location", value: c.location },
    { icon: Laptop, label: "Job mode", value: c.mode },
    { icon: Clock, label: "Employment type", value: c.type },
    { icon: Award, label: "Experience", value: experience },
    { icon: CalendarDays, label: "Published", value: <time dateTime={c.postedAt}>{ukText(formatPostedDate(c.postedAt))}</time> },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(jobPosting) }} />
      <ScrollProgress />
      <Header />
      <CareerApplyProvider
        positions={careers.map((x) => x.role)}
        processes={Object.fromEntries(careers.map((x) => [x.role, x.hiringProcess]))}
      >
        <main id="main">
          <PageHero
            variant="company"
            eyebrow={ukText("Open role · Join our team")}
            crumbs={[{ label: "Home", href: "/" }, { label: "Careers", href: "/careers" }, { label: c.role }]}
            title={ukText(c.role)}
            description={ukText(c.summary)}
          />

          <section className="relative bg-uk-surface section-py">
            <Container className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_22rem] lg:items-start lg:gap-12">
              <div className="flex flex-col gap-6">
                <Reveal className="rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-7">
                  <h2 className="flex items-center gap-2 font-heading text-xl font-bold text-uk-heading">
                    <Target className="h-5 w-5 text-uk-blue" />{ukText("About this role")}</h2>
                  <p className="mt-4 text-base leading-relaxed text-uk-body sm:text-lg">{ukText(c.summary)}</p>
                </Reveal>
                <ListCard icon={ListChecks} title={ukText("What you'll do here")} items={c.responsibilities} />
                <ListCard icon={Briefcase} title={ukText("What you'll bring")} items={c.requirements} />
                <ListCard icon={Gift} title={ukText("What you'll get")} items={c.perks} />

                <Reveal className="rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-7">
                  <h2 id="hiring-process" className="scroll-mt-28 flex items-center gap-2 font-heading text-xl font-bold text-uk-heading">
                    <Workflow className="h-5 w-5 text-uk-blue" />{ukText("Your hiring journey")}</h2>
                  <p className="mt-2 text-sm text-uk-gray">
                    {ukText(c.hiringProcess.length)}{" "}{ukText("stage")}{ukText(c.hiringProcess.length === 1 ? "" : "s")}{" "}{ukText("from application to offer. We keep you posted by email at every step.")}</p>
                  <ol className="relative mt-6 flex flex-col gap-6" aria-labelledby="hiring-process">
                    {c.hiringProcess.map((s, i) => (
                      <li key={`${i}-${s.title}`} className="relative flex gap-4">
                        {/* connector line to the next stage */}
                        {i < c.hiringProcess.length - 1 && (
                          <span className="absolute left-[1.125rem] top-10 -bottom-6 w-px bg-uk-blue/25" aria-hidden />
                        )}
                        <span className="relative flex h-9 w-9 flex-none items-center justify-center rounded-full border border-uk-blue/30 bg-uk-blue/10 font-heading text-sm font-bold text-uk-blue">
                          {i + 1}
                        </span>
                        <div className="pt-1.5">
                          <h3 className="font-heading text-base font-bold text-uk-heading">{ukText(s.title)}</h3>
                          <p className="mt-1 text-sm leading-relaxed text-uk-body">{ukText(s.desc)}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </Reveal>
              </div>

              {/* Job overview + apply — first on phones, stays in view on large screens */}
              <aside className="order-first lg:order-none lg:sticky lg:top-28">
                <div className="rounded-2xl border border-uk-blue/20 bg-uk-surface-blue p-6">
                  <h2 className="font-heading text-lg font-bold text-uk-heading">{ukText("Job overview")}</h2>
                  <dl className="mt-4 flex flex-col divide-y divide-uk-line text-sm">
                    {overview.map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-start gap-3 py-3">
                        <Icon className="mt-0.5 h-4 w-4 text-uk-blue" aria-hidden />
                        <div>
                          <dt className="text-uk-muted">{ukText(label)}</dt>
                          <dd className="font-semibold text-uk-heading">{ukText(value)}</dd>
                        </div>
                      </div>
                    ))}
                  </dl>
                  <ApplyButton
                    position={c.role}
                    className="btn-sheen mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-uk-blue px-6 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright"
                  >{ukText("Apply now")}<ArrowRight className="h-4 w-4" />
                  </ApplyButton>
                  <a
                    href={ukText("#hiring-process")}
                    className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-sm font-medium text-uk-blue hover:text-uk-blue-bright"
                  >
                    <Workflow className="h-4 w-4" aria-hidden />{ukText("See the ")}{ukText(c.hiringProcess.length)}{ukText("-stage hiring journey")}</a>
                  <p className="mt-4 text-xs text-uk-muted">{ukText("Questions about this role? Write to")}{" "}
                    <a href={ukText(`mailto:${settings.hr.email}`)} className="font-semibold text-uk-blue hover:text-uk-blue-bright">
                      {ukText(settings.hr.email)}
                    </a>
                    .
                  </p>
                </div>
                <Link href={ukText("/careers#open-roles")} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-uk-muted hover:text-uk-heading">
                  <ArrowLeft className="h-4 w-4" />{ukText("Back to all jobs")}</Link>
              </aside>
            </Container>
          </section>

          {others.length > 0 && (
            <section className="relative border-t border-uk-line bg-uk-surface-2 section-py">
              <Container>
                <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("More roles you may like")}</h2>
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {others.map((o) => (
                    <Link
                      key={o.slug}
                      href={ukText(`/careers/${o.slug}`)}
                      className="group flex flex-col gap-2 rounded-2xl border border-uk-line bg-uk-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-uk-blue/40 hover:shadow-premium-lg"
                    >
                      <span className="font-heading text-base font-bold text-uk-heading group-hover:text-uk-blue">{ukText(o.role)}</span>
                      <span className="flex flex-wrap items-center gap-3 text-xs text-uk-gray">
                        <ModeBadge mode={o.mode} />
                        <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-uk-blue" />{ukText(o.location)}</span>
                        <span className="inline-flex items-center gap-1.5"><Award className="h-3.5 w-3.5 text-uk-blue" />{ukText(formatExperience(o.experienceMin, o.experienceMax))}</span>
                        <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-uk-blue" />{ukText(formatPostedDate(o.postedAt))}</span>
                      </span>
                      <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-uk-blue">{ukText("View role ")}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </Link>
                  ))}
                </div>
              </Container>
            </section>
          )}

          <CtaBand />
        </main>
      </CareerApplyProvider>
      <Footer />
    </>
  );
}
