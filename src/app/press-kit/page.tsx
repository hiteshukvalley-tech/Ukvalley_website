import type { Metadata } from "next";
import Link from "@/components/site/intent-link";
import { ArrowRight, ArrowUpRight, Check, Download, Mail, X } from "lucide-react";
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
import { BoilerplateTabs } from "@/components/site/boilerplate-tabs";
import { FactRows } from "@/components/site/fact-rows";
import { getSiteSettings } from "@/lib/settings";
import { getServices } from "@/lib/services-store";
import { getChrome } from "@/lib/home-store";
import { OFFICIAL_LOGO } from "@/lib/site-content-schema";
import { ukText } from "@/lib/texts";

// Re-render at least once a minute so admin text overrides always show up.
export const revalidate = 60;

// Title and description can be replaced in Admin → Page text (SEO fields).
export const generateMetadata = () => editableMetadata("press-kit", baseMetadata);
const baseMetadata: Metadata = {
  title: "Press kit: logos, boilerplates & brand facts",
  description:
    "Ukvalley Technologies press kit: how to write our name, approved company descriptions, logo files with usage rules, brand colours and our media contact.",
  alternates: { canonical: `${SITE_URL}/press-kit` },
};

const eyebrowCls =
  "inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue";
const h2Cls = "font-heading text-3xl font-bold text-uk-heading sm:text-4xl";
const cardCls = "rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-7";
const primaryBtn =
  "btn-sheen btn-lift group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-uk-blue px-6 text-sm font-semibold text-white shadow-glow-blue-sm hover:bg-uk-blue-bright sm:w-auto";
const secondaryBtn =
  "btn-lift group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-uk-line bg-white/80 px-6 text-sm font-semibold text-uk-heading backdrop-blur hover:border-uk-blue/50 hover:text-uk-blue-bright dark:bg-uk-card/80 sm:w-auto";

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** The brand colours used across the site (globals.css tokens). */
const COLOURS = [
  { name: "Ukvalley Blue", hex: "#3100FF", use: "Primary colour: buttons, links, highlights" },
  { name: "Violet", hex: "#684DFF", use: "Primary colour on dark backgrounds" },
  { name: "Sky Blue", hex: "#287BFF", use: "Gradients and accents" },
  { name: "Signal Yellow", hex: "#FFF500", use: "Small accents only, badges and dots" },
];

const TYPEFACES = [
  { name: "Space Grotesk", use: "Headings" },
  { name: "Plus Jakarta Sans", use: "Body text" },
  { name: "Sora", use: "Large page titles" },
];

export default async function PressKitPage() {
  const [s, services, founder, { header }] = await Promise.all([getSiteSettings(), getServices(), getFounder(), getChrome()]);
  const year = s.foundedYear;
  const name = s.name; // e.g. "Ukvalley Technologies"
  const mediaEmail = s.email;
  const logo = header.logoImage || OFFICIAL_LOGO;

  // Three approved descriptions, built from the company's own details so they
  // stay true when Site settings change.
  const boilerplates = [
    {
      key: "25", label: "25 Words", size: "Short",
      use: "Listings, directories and speaker bios",
      text: `${name} is an engineer-led software company in ${s.city}. Since ${year} it has built custom software, CRM, ERP and mobile apps for growing businesses.`,
    },
    {
      key: "50", label: "50 Words", size: "Standard",
      use: "Press releases and news articles",
      text: `${name} is an engineer-led software company based in ${s.city}. Since ${year}, it has designed, built and supported custom software, CRM, ERP, HRMS and mobile apps for Indian SMEs and global startups. The engineers who scope each project are the ones who build it, and the company runs its own products in production.`,
    },
    {
      key: "100", label: "100 Words", size: "Full",
      use: "Company profiles and feature articles",
      text: `${name} is an engineer-led software company based in ${s.city}. Since ${year}, it has helped Indian SMEs and global startups replace spreadsheets and disconnected tools with software built around how they actually work, custom web and mobile apps, CRM, ERP, HRMS, cloud and support. Its salaried, in-house team scopes, builds and maintains every system, with written estimates, fixed proposals and support plans after launch. The company also builds and runs its own products, including the TeleValley sales-calling platform, so the standards it applies to client work are tested on its own software every day.`,
    },
  ];

  const disciplines = services.slice(0, 4);

  const downloads = [
    { title: "Full logo", detail: "PNG, transparent background, for light backgrounds", file: logo, name: "ukvalley-logo.png", preview: logo, contain: true },
    { title: "Round mark", detail: "PNG, 512 × 512, app icons and small spaces", file: "/icon.png", name: "ukvalley-mark.png", preview: "/icon.png", contain: true },
    { title: "Share image", detail: "PNG, 1200 × 630, articles and social posts", file: "/brand/share-image.png", name: "ukvalley-share-image.png", preview: "/brand/share-image.png", contain: false },
  ];

  return (
    <>
      <ScrollProgress />
      <Header />
      <main id="main">
        <EditableHero
          pageKey="press-kit"
          variant="company"
          eyebrow={ukText("Press kit")}
          crumbs={[{ label: "Home", href: "/" }, { label: "Press kit" }]}
          title={
            <>{ukText("Ukvalley press kit &")}{" "}
              <span className="text-gradient-blue">{ukText("brand assets")}</span>
            </>
          }
          description={ukText("For editors, journalists and event organisers: how to write our name, approved company descriptions, logo files and the person to contact.")}
        >
          <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <a href="#downloads" className={primaryBtn}>
              <Download className="h-4 w-4" />
              {ukText("Download brand assets")}
            </a>
            <Link href="/media" className={secondaryBtn}>
              {ukText("Media enquiries")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </EditableHero>

        {/* What this kit settles */}
        <section className="relative bg-uk-surface section-py">
          <Container>
            <Reveal className="flex flex-col gap-5">
              <span className={eyebrowCls}>{ukText("What this kit settles")}</span>
              <h2 className={h2Cls}>{ukText("Everything you need to write about us correctly")}</h2>
            </Reveal>
            <Reveal staggerChildren className="mt-8 grid gap-5 md:grid-cols-3">
              {[
                { t: "How to write our name", d: "One word, a capital U and a lowercase v, every time." },
                { t: "Three approved descriptions", d: "25, 50 and 100 words, ready to paste into an article or listing." },
                { t: "Logo files with usage rules", d: "Official logo, round mark and share image, plus colours and type." },
              ].map((i) => (
                <div key={i.t} className={`${cardCls} flex gap-4`}>
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-uk-blue/12 text-uk-blue">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </span>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText(i.t)}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-uk-gray">{ukText(i.d)}</p>
                  </div>
                </div>
              ))}
            </Reveal>
          </Container>
        </section>

        {/* Our name */}
        <section id="name" className="relative scroll-mt-24 border-y border-uk-line bg-uk-surface-2 section-py">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16">
              <Reveal className="flex flex-col gap-5">
                <span className={eyebrowCls}>{ukText("Our name")}</span>
                <h2 className={h2Cls}>{ukText("One word: a capital U, a lowercase v")}</h2>
                <p className="text-base leading-relaxed text-uk-body sm:text-lg">
                  {ukText(`Write our name as “Ukvalley”, or “${name}” in full the first time it appears. The logo sets the name in capitals; that styling belongs to the logo only, not to running text.`)}
                </p>
              </Reveal>
              <Reveal className="grid gap-4 sm:grid-cols-2">
                <div className={cardCls}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">{ukText("Correct")}</p>
                  <ul className="mt-4 space-y-3">
                    {["Ukvalley", name].map((n) => (
                      <li key={n} className="flex items-center gap-2.5 font-heading text-lg font-bold text-uk-heading">
                        <Check className="h-4 w-4 flex-none text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
                        {ukText(n)}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={cardCls}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-destructive">{ukText("Incorrect")}</p>
                  <ul className="mt-4 space-y-3">
                    {["UKValley", "UK Valley", "Uk Valley", "UKVALLEY", "Uk-Valley"].map((n) => (
                      <li key={n} className="flex items-center gap-2.5 text-base text-uk-gray line-through decoration-destructive/60">
                        <X className="h-4 w-4 flex-none text-destructive" strokeWidth={3} />
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        {/* Company boilerplates — tabs, like the reference press kit */}
        <section id="boilerplates" className="relative scroll-mt-24 bg-uk-surface section-py">
          <Container>
            <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
              <span className={eyebrowCls}>{ukText("Company boilerplates")}</span>
              <h2 className={h2Cls}>{ukText("Three approved descriptions")}</h2>
              <p className="text-base leading-relaxed text-uk-body sm:text-lg">
                {ukText("Choose the length the piece needs. Each is approved for publication as written.")}
              </p>
            </Reveal>
            <Reveal className="mt-10">
              {/* tab labels show the real word count, so they stay accurate if Site settings change */}
              <BoilerplateTabs items={boilerplates.map((b) => ({ ...b, label: `${words(b.text)} ${ukText("Words")}`, size: ukText(b.size), use: ukText(b.use) }))} />
            </Reveal>
          </Container>
        </section>

        {/* Core disciplines */}
        {disciplines.length > 0 && (
          <section className="relative border-y border-uk-line bg-uk-surface-2 section-py">
            <Container>
              <Reveal className="flex max-w-3xl flex-col gap-5">
                <span className={eyebrowCls}>{ukText("What we do")}</span>
                <h2 className={h2Cls}>{ukText("Our core disciplines")}</h2>
              </Reveal>
              <Reveal staggerChildren className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {disciplines.map((d, i) => (
                  <Link
                    key={d.href}
                    href={ukText(d.href)}
                    className="group flex h-full flex-col gap-3 rounded-2xl border border-uk-line bg-uk-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-uk-blue/40"
                  >
                    <span className="font-heading text-sm font-bold tabular-nums text-uk-blue">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText(d.title)}</h3>
                    <p className="flex-1 text-sm leading-relaxed text-uk-gray">{ukText(d.blurb)}</p>
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

        {/* Leadership — profile card and fact rows */}
        <section id="leadership" className="relative scroll-mt-24 bg-uk-surface section-py">
          <Container>
            <div className="mx-auto flex max-w-5xl flex-col gap-6">
              <Reveal className="mx-auto w-full max-w-3xl rounded-2xl border border-uk-line bg-uk-card p-6 shadow-float sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  {/* plain <img>: the admin can point this at /media/<id> or any https address */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={founder.image} alt={founder.imageAlt} loading="lazy" className="h-28 w-28 flex-none rounded-2xl object-cover object-top" />
                  <div className="flex flex-col gap-3">
                    <span className={eyebrowCls}>{ukText("Leadership and media desk")}</span>
                    <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{founder.name}, {founder.role}</h2>
                    {founder.bio[0] && <p className="text-base leading-relaxed text-uk-body">{ukText(founder.bio[0])}</p>}
                  </div>
                </div>
              </Reveal>
              <FactRows
                rows={[
                  { term: founder.name, desc: ukText(`${founder.role}, ${name}.`) },
                  { term: ukText(s.city), desc: ukText("Where the team operates from.") },
                  {
                    term: <a href={`mailto:${mediaEmail}?subject=${encodeURIComponent("Media enquiry")}`} className="text-uk-blue underline-offset-4 hover:underline">{mediaEmail}</a>,
                    desc: ukText("Asset requests, interviews, a headshot or a higher-resolution logo, sent the same day."),
                  },
                ]}
              />
            </div>
          </Container>
        </section>

        {/* Downloads: logos, colours, type */}
        <section id="downloads" className="relative scroll-mt-24 border-y border-uk-line bg-uk-surface-2 section-py">
          <Container>
            <Reveal className="flex max-w-3xl flex-col gap-5">
              <span className={eyebrowCls}>{ukText("Brand assets")}</span>
              <h2 className={h2Cls}>{ukText("Logo files and how to use them")}</h2>
            </Reveal>
            <Reveal staggerChildren className="mt-8 grid gap-5 md:grid-cols-3">
              {downloads.map((f) => (
                <div key={f.title} className="flex flex-col overflow-hidden rounded-2xl border border-uk-line bg-uk-card">
                  <div className="flex aspect-[16/9] items-center justify-center bg-white p-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.preview} alt={ukText(`${f.title} preview`)} loading="lazy" className={f.contain ? "h-full max-h-28 w-auto max-w-full object-contain" : "h-full w-full rounded-lg object-cover"} />
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <div>
                      <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText(f.title)}</h3>
                      <p className="text-sm text-uk-gray">{ukText(f.detail)}</p>
                    </div>
                    <a href={f.file} download={f.name} className="mt-auto inline-flex h-10 w-fit items-center gap-2 rounded-full bg-uk-blue px-4 text-sm font-semibold text-white hover:bg-uk-blue-bright">
                      <Download className="h-4 w-4" /> {ukText("Download")}
                    </a>
                  </div>
                </div>
              ))}
            </Reveal>

            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              <Reveal className={cardCls}>
                <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText("Usage rules")}</h3>
                <ul className="mt-4 space-y-3">
                  {[
                    "Leave clear space around the logo at least the height of the round mark's “UK”.",
                    "Don't stretch, rotate, recolour, outline or add effects to the logo.",
                    "On dark or busy backgrounds, place the logo on a white panel.",
                    "Don't combine our logo with another logo into a new mark.",
                  ].map((r) => (
                    <li key={r} className="flex items-start gap-2.5 text-sm leading-relaxed text-uk-body">
                      <Check className="mt-0.5 h-4 w-4 flex-none text-uk-blue" strokeWidth={3} />
                      {ukText(r)}
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal className={cardCls}>
                <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText("Brand colours")}</h3>
                <ul className="mt-4 space-y-3">
                  {COLOURS.map((c) => (
                    <li key={c.hex} className="flex items-center gap-3">
                      <span className="h-10 w-10 flex-none rounded-xl border border-uk-line" style={{ background: c.hex }} aria-hidden />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-uk-heading">
                          {ukText(c.name)} <span className="font-mono text-xs font-medium text-uk-muted">{c.hex}</span>
                        </span>
                        <span className="block text-xs text-uk-gray">{ukText(c.use)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal className={cardCls}>
                <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText("Typefaces")}</h3>
                <ul className="mt-4 space-y-3">
                  {TYPEFACES.map((t) => (
                    <li key={t.name} className="flex items-baseline justify-between gap-4 border-b border-uk-line pb-3 last:border-0 last:pb-0">
                      <span className="text-base font-semibold text-uk-heading">{t.name}</span>
                      <span className="text-xs text-uk-gray">{ukText(t.use)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-uk-muted">{ukText("All three are free Google Fonts.")}</p>
              </Reveal>
            </div>
          </Container>
        </section>

        {/* Related pages and the closing ask */}
        <section className="relative bg-uk-surface px-5 section-py lg:px-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-14">
            <RelatedChips page="press-kit" />
            <ClosingPanel
              title={ukText("Need a fact checked, or an asset that is not here?")}
              description={ukText("Ask the media desk directly. We will confirm what we can in writing, and if you need the logo in a format we have not published, we will send it.")}
              note={ukText("A reply within one business day.")}
            >
              <a href="#downloads" className={closingButtonCls}>
                <Download className="h-4 w-4" /> {ukText("Download brand assets")}
              </a>
              <a href={`mailto:${mediaEmail}?subject=${encodeURIComponent("Media enquiry")}`} className={closingButtonCls}>
                <Mail className="h-4 w-4" /> {ukText("Email the media desk")}
              </a>
            </ClosingPanel>
          </div>
        </section>

        <PageBlocks pageKey="press-kit" />
      </main>
      <Footer />
    </>
  );
}
