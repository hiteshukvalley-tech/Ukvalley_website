import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site-origin";
import { fitTitle, withSharePreview } from "@/lib/page-metadata";
import Link from "@/components/site/intent-link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Award, Briefcase, CalendarDays, Check, Clock, Gift, GraduationCap, Laptop, ListChecks, MapPin, Target, Workflow,
} from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { CtaBand } from "@/components/site/cta";
import { ApplyButton, CareerApplyProvider, ShareJobButton } from "@/components/site/career-apply";
import { closedRoleHref } from "@/lib/applications-validation";
import { getCareers, isKnownCareerSlug } from "@/lib/careers-store";
import { getSiteSettings } from "@/lib/settings";
import { jsonLd } from "@/lib/utils";
import { formatExperience, formatPostedDate, type JobType } from "@/lib/careers-shared";
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
    title: fitTitle(`${c.role}, Careers`, c.role),
    // search results show about 160 characters; About the role can be much longer
    description: shorten(paragraphs(c.summary)[0] ?? "", 160),
    alternates: { canonical: `${SITE_URL}/careers/${c.slug}` },
  });
}

/** The non-empty lines of a multi-line text, trimmed. */
const paragraphs = (text: string) => text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

/** Cuts text to `max` characters at a word break, adding "…". */
const shorten = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 3).replace(/\s+\S*$/, "")}…` : text;

/** The job type as schema.org's employmentType (Google Jobs). */
const EMPLOYMENT_TYPE: Record<JobType, string> = {
  "Full-time": "FULL_TIME",
  "Part-time": "PART_TIME",
  Freelancing: "CONTRACTOR",
  Internship: "INTERN",
};

function ListCard({ icon: Icon, title, items }: { icon: typeof Check; title: string; items: string[] }) {
  // Every list is optional in the admin; an empty one isn't shown.
  if (items.length === 0) return null;
  return (
    <Reveal className="rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-7">
      <h2 className="flex items-center gap-2 font-heading text-xl font-bold text-uk-heading">
        <Icon className="h-5 w-5 text-uk-blue" />
        {ukText(title)}
      </h2>
      <ul className="mt-5 flex flex-col gap-3.5">
        {items.map((item, i) => (
          <li key={`${i}-${item}`} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-uk-blue/12 text-uk-blue">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            <p className="min-w-0 flex-1 text-sm leading-relaxed text-uk-body wrap-anywhere sm:text-base">{ukText(item)}</p>
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
  // A role moved to drafts or deleted: links shared while it was open go to the
  // Careers page, which says the opening is closed and lists the current ones.
  // An address that was never a role is a plain 404.
  if (!c) {
    if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 120 && (await isKnownCareerSlug(slug))) redirect(closedRoleHref(slug));
    notFound();
  }
  const others = careers.filter((x) => x.slug !== c.slug).slice(0, 4);

  const experience = formatExperience(c.experienceMin, c.experienceMax);
  // "About the role" is stored one paragraph per line.
  const aboutParagraphs = paragraphs(c.summary);
  // The hero shows the first paragraph, cut short; the card below has it all.
  const intro = shorten(aboutParagraphs[0] ?? "", 220);
  // A place name for search engines; "India" / "Remote (India)" aren't a locality.
  const locality = /^(remote|hybrid|india)\b/i.test(c.location) ? undefined : c.location;

  // Structured data so search engines can list the role as a job opening.
  const jobPosting = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: c.role,
    description: [c.summary, ...c.responsibilities, ...c.requirements, ...(c.qualifications ?? [])].join(" "),
    skills: c.requirements.join(", "),
    ...(c.qualifications?.length ? { qualifications: c.qualifications.join(", ") } : {}),
    datePosted: c.postedAt,
    employmentType: EMPLOYMENT_TYPE[c.type],
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
        // A shared link (/careers/<slug>?apply=1) opens this role's form at once.
        autoOpen={c.role}
        positions={careers.map((x) => x.role)}
        processes={Object.fromEntries(careers.map((x) => [x.role, x.hiringProcess]))}
      >
        <main id="main">
          <PageHero
            variant="company"
            eyebrow={ukText("Open role · Join our team")}
            crumbs={[{ label: "Home", href: "/" }, { label: "Careers", href: "/careers" }, { label: c.role }]}
            title={ukText(c.role)}
            titleClassName="wrap-break-word"
            description={intro ? ukText(intro) : undefined}
          />

          <section className="relative bg-uk-surface section-py">
            <Container className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-12">
              <div className="flex min-w-0 flex-col gap-6">
                {aboutParagraphs.length > 0 && (
                <Reveal className="rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-7">
                  <h2 className="flex items-center gap-2 font-heading text-xl font-bold text-uk-heading">
                    <Target className="h-5 w-5 text-uk-blue" />{ukText("About the role")}</h2>
                  {/* one paragraph per line typed in the admin, evenly spaced */}
                  <div className="mt-4 flex flex-col gap-4">
                    {aboutParagraphs.map((para, i) => (
                      <p key={i} className="text-base leading-relaxed text-uk-body wrap-anywhere sm:text-lg">{ukText(para)}</p>
                    ))}
                  </div>
                </Reveal>
                )}
                <ListCard icon={ListChecks} title={ukText("What you'll do here")} items={c.responsibilities} />
                <ListCard icon={Briefcase} title={ukText("Required skills")} items={c.requirements} />
                {c.qualifications && c.qualifications.length > 0 && (
                  <ListCard icon={GraduationCap} title={ukText("Qualifications")} items={c.qualifications} />
                )}
                <ListCard icon={Gift} title={ukText("What you'll get")} items={c.perks} />

                <Reveal className="rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-7">
                  <h2 id="hiring-process" className="scroll-mt-28 flex items-center gap-2 font-heading text-xl font-bold text-uk-heading">
                    <Workflow className="h-5 w-5 text-uk-blue" />{ukText("Your hiring journey")}</h2>
                  <p className="mt-2 text-sm text-uk-gray">
                    {ukText(c.hiringProcess.length)}{" "}{ukText("stage")}{ukText(c.hiringProcess.length === 1 ? "" : "s")}{" "}{ukText("from application to joining. We keep you posted by email at every step.")}</p>
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
                        <div className="min-w-0 flex-1 pt-1.5">
                          <h3 className="font-heading text-base font-bold text-uk-heading wrap-anywhere">{ukText(s.title)}</h3>
                          {s.desc && <p className="mt-1 text-sm leading-relaxed text-uk-body wrap-anywhere">{ukText(s.desc)}</p>}
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
                        <div className="min-w-0 flex-1">
                          <dt className="text-uk-muted">{ukText(label)}</dt>
                          <dd className="font-semibold text-uk-heading wrap-anywhere">{ukText(value)}</dd>
                        </div>
                      </div>
                    ))}
                  </dl>
                  <ApplyButton
                    position={c.role}
                    className="btn-sheen mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-uk-blue px-6 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright"
                  >{ukText("Apply now")}<ArrowRight className="h-4 w-4" />
                  </ApplyButton>
                  <ShareJobButton
                    url={`${SITE_URL}/careers/${c.slug}?apply=1`}
                    title={c.role}
                    className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-uk-line bg-uk-card px-6 text-sm font-semibold text-uk-heading transition-colors hover:border-uk-blue/50 hover:text-uk-blue"
                  />
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
                      <span className="font-heading text-base font-bold text-uk-heading wrap-anywhere group-hover:text-uk-blue">{ukText(o.role)}</span>
                      <span className="flex flex-wrap items-center gap-3 text-xs text-uk-gray">
                        <ModeBadge mode={o.mode} />
                        <span className="inline-flex min-w-0 items-center gap-1.5 wrap-anywhere"><MapPin className="h-3.5 w-3.5 flex-none text-uk-blue" />{ukText(o.location)}</span>
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

          <CtaBand related="careers" />
        </main>
      </CareerApplyProvider>
      <Footer />
    </>
  );
}
