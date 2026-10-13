import type { Metadata } from "next";
import Link from "@/components/site/intent-link";
import { ArrowRight, ArrowUpRight, Mail, ShieldCheck } from "lucide-react";
import { SITE_URL } from "@/lib/site-origin";
import { editableMetadata } from "@/lib/page-metadata";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { EditableHero, PageBlocks, getFounder } from "@/components/site/page-extras";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { RelatedChips } from "@/components/site/related-chips";
import { ClosingPanel, closingButtonCls } from "@/components/site/cta";
import { FactRows } from "@/components/site/fact-rows";
import { getSiteSettings } from "@/lib/settings";
import { getServices } from "@/lib/services-store";
import { ukText } from "@/lib/texts";

// Re-render at least once a minute so admin text overrides always show up.
export const revalidate = 60;

// Title and description can be replaced in Admin → Page text (SEO fields).
export const generateMetadata = () => editableMetadata("media", baseMetadata);
const baseMetadata: Metadata = {
  title: "Media & press enquiries",
  description:
    "Journalists and editors: contact the Ukvalley Technologies media desk for interviews, briefings and verified comment on custom software, CRM and ERP. A reply within one business day.",
  alternates: { canonical: `${SITE_URL}/media` },
};

const eyebrowCls =
  "inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue";
const h2Cls = "font-heading text-3xl font-bold text-uk-heading sm:text-4xl";
const cardCls = "rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-7";
const primaryBtn =
  "btn-sheen btn-lift group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-uk-blue px-6 text-sm font-semibold text-white shadow-glow-blue-sm hover:bg-uk-blue-bright sm:w-auto";
const secondaryBtn =
  "btn-lift group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-uk-line bg-white/80 px-6 text-sm font-semibold text-uk-heading backdrop-blur hover:border-uk-blue/50 hover:text-uk-blue-bright dark:bg-uk-card/80 sm:w-auto";

export default async function MediaPage() {
  const [s, services, founder] = await Promise.all([getSiteSettings(), getServices(), getFounder()]);
  const email = s.email;
  const mailto = `mailto:${email}?subject=${encodeURIComponent("Media enquiry")}`;
  const phone = s.phonePrimary;
  const topics = services.slice(0, 3);

  return (
    <>
      <ScrollProgress />
      <Header />
      <main id="main">
        <EditableHero
          pageKey="media"
          variant="company"
          eyebrow={ukText("Media")}
          crumbs={[{ label: "Home", href: "/" }, { label: "Media" }]}
          title={
            <>{ukText("Media &")}{" "}
              <span className="text-gradient-blue">{ukText("press enquiries")}</span>
            </>
          }
          description={ukText("Journalists, editors and event organisers: one desk for interviews, briefings and comment. A reply within one business day.")}
        >
          <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <a href={mailto} className={primaryBtn}>
              <Mail className="h-4 w-4" />
              {ukText("Contact the media desk")}
            </a>
            <Link href="/press-kit" className={secondaryBtn}>
              {ukText("Press kit")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </EditableHero>

        {/* How the desk works */}
        <section className="relative bg-uk-surface section-py">
          <Container>
            <Reveal className="flex max-w-3xl flex-col gap-5">
              <span className={eyebrowCls}>{ukText("How the media desk works")}</span>
              <h2 className={h2Cls}>{ukText("Three things you can count on")}</h2>
            </Reveal>
            <Reveal staggerChildren className="mt-8 grid gap-5 md:grid-cols-3">
              {[
                { t: "One named spokesperson", d: `Every quote comes from ${founder.name}, ${founder.role}. No anonymous “company sources”.` },
                { t: "A reply within one business day", d: "Send your questions and deadline; we confirm what we can answer and when." },
                { t: "Only facts we can back up", d: "Figures and examples come from our own records. If we can't verify something, we say so." },
              ].map((p, i) => (
                <div key={p.t} className={`${cardCls} flex flex-col gap-3`}>
                  <span className="font-heading text-3xl font-bold tabular-nums text-uk-blue/80">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText(p.t)}</h3>
                  <p className="text-sm leading-relaxed text-uk-gray">{ukText(p.d)}</p>
                </div>
              ))}
            </Reveal>
          </Container>
        </section>

        {/* Commentary topics */}
        {topics.length > 0 && (
          <section className="relative border-y border-uk-line bg-uk-surface-2 section-py">
            <Container>
              <Reveal className="flex max-w-3xl flex-col gap-5">
                <span className={eyebrowCls}>{ukText("What we comment on")}</span>
                <h2 className={h2Cls}>{ukText(`${topics.length === 3 ? "Three" : topics.length} subjects, verified commentary`)}</h2>
                <p className="text-base leading-relaxed text-uk-body sm:text-lg">
                  {ukText("We speak on the work we do every day, and only that.")}
                </p>
              </Reveal>
              <Reveal staggerChildren className="mt-8 grid gap-5 md:grid-cols-3">
                {topics.map((t) => (
                  <Link
                    key={t.href}
                    href={ukText(t.href)}
                    className="group flex h-full flex-col gap-3 rounded-2xl border border-uk-line bg-uk-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-uk-blue/40"
                  >
                    <h3 className="font-heading text-xl font-bold text-uk-heading">{ukText(t.title)}</h3>
                    <p className="flex-1 text-sm leading-relaxed text-uk-gray">{ukText(t.blurb)}</p>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-uk-blue">
                      {ukText("Learn more")}
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                ))}
              </Reveal>
            </Container>
          </section>
        )}

        {/* Spokesperson — profile card and fact rows */}
        <section id="spokesperson" className="relative scroll-mt-24 bg-uk-surface section-py">
          <Container>
            <div className="mx-auto flex max-w-5xl flex-col gap-6">
              <Reveal className="mx-auto w-full max-w-3xl rounded-2xl border border-uk-line bg-uk-card p-6 shadow-float sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  {/* plain <img>: the admin can point this at /media/<id> or any https address */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={founder.image} alt={founder.imageAlt} loading="lazy" className="h-28 w-28 flex-none rounded-2xl object-cover object-top" />
                  <div className="flex flex-col gap-4">
                    <span className={eyebrowCls}>{ukText("Media contact")}</span>
                    <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{founder.name}, {founder.role} {ukText("and official spokesperson")}</h2>
                    <div className="flex flex-col gap-1.5">
                      <a href={mailto} className="inline-flex h-11 w-fit items-center gap-2 rounded-lg border border-uk-line px-5 text-sm font-semibold text-uk-heading transition-colors hover:border-uk-blue/50 hover:text-uk-blue">
                        <Mail className="h-4 w-4" /> {ukText("Contact the media desk")}
                      </a>
                      <span className="text-xs text-uk-muted">{ukText("Response within one business day.")}</span>
                    </div>
                    <p className="text-base leading-relaxed text-uk-body">
                      {ukText("For interview requests, technical briefings or background information, contact the media desk directly. Every press enquiry is answered within one business day.")}
                    </p>
                  </div>
                </div>
              </Reveal>
              <FactRows
                rows={[
                  { term: <a href={mailto} className="text-uk-blue underline-offset-4 hover:underline">{email}</a>, desc: ukText("Interview requests, technical briefings and background.") },
                  { term: founder.name, desc: ukText(`${founder.role}, and the official spokesperson on the record.`) },
                  { term: ukText("One business day"), desc: ukText("Every press enquiry is answered within it, sooner when you are on deadline.") },
                  ...(phone ? [{ term: <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="text-uk-blue underline-offset-4 hover:underline">{phone}</a>, desc: ukText("For urgent press enquiries, mention it is for a story.") }] : []),
                ]}
              />
            </div>
          </Container>
        </section>

        {/* Proof standard — dark band */}
        <section className="relative overflow-hidden bg-[#0b0820] section-py">
          <div className="absolute inset-0 bg-blueprint opacity-[0.08]" aria-hidden />
          <Container>
            <Reveal className="relative mx-auto flex max-w-3xl flex-col gap-5 rounded-2xl border border-white/10 bg-white/[0.04] p-7 sm:p-10">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-yellow/40 bg-uk-yellow/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-uk-yellow">
                <ShieldCheck className="h-3.5 w-3.5" /> {ukText("Proof standard")}
              </span>
              <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">{ukText("We don't make up numbers, awards or quotes")}</h2>
              <p className="text-base leading-relaxed text-white/80 sm:text-lg">
                {ukText("Anything we tell a journalist, client results, project counts, timelines, comes from our own records and can be checked. Client names are shared only with the client's permission.")}
              </p>
            </Reveal>
          </Container>
        </section>

        <section className="relative bg-uk-surface pt-10 text-center">
          <p className="text-sm text-uk-gray">
            {ukText("For our name, approved descriptions, logo files and usage rules, see the")}{" "}
            <Link href="/press-kit" className="font-semibold text-uk-blue hover:underline">{ukText("Press kit")}</Link>.
          </p>
        </section>

        {/* Related pages and the closing ask */}
        <section className="relative bg-uk-surface px-5 section-py lg:px-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-14">
            <RelatedChips page="media" />
            <ClosingPanel
              title={ukText("On deadline and need this confirmed?")}
              description={ukText("The media desk answers within one business day, and faster if your deadline is shorter. Ask for the figure, the background or the quote, we will confirm in writing what we can, and say plainly what we cannot.")}
              note={ukText("Response within one business day.")}
            >
              <a href={mailto} className={closingButtonCls}>
                <Mail className="h-4 w-4" /> {ukText("Contact the media desk")}
              </a>
            </ClosingPanel>
          </div>
        </section>

        <PageBlocks pageKey="media" />
      </main>
      <Footer />
    </>
  );
}
