import type { ComponentProps } from "react";
import { PageHero } from "./page-hero";
import { CustomSection } from "./custom-section";
import { Marked } from "./marked";
import { getPageContent } from "@/lib/pages-store";
import { Container } from "./container";
import { Reveal } from "./reveal";
import { ukText } from "@/lib/texts";

/**
 * PageHero whose text can be replaced from Admin → Page text. A field left
 * empty there keeps the text the page passes in.
 */
export async function EditableHero({ pageKey, ...hero }: { pageKey: string } & ComponentProps<typeof PageHero>) {
  const c = await getPageContent(pageKey);
  return (
    <PageHero
      {...hero}
      eyebrow={c.heroEyebrow || hero.eyebrow}
      title={c.heroTitle ? <Marked text={c.heroTitle} /> : hero.title}
      description={c.heroDescription || hero.description}
    />
  );
}

/** The extra blocks the admin added to a page (Admin → Page text), in order. */
export async function PageBlocks({ pageKey }: { pageKey: string }) {
  const { blocks } = await getPageContent(pageKey);
  return (
    <>
      {blocks.map((b, i) => (
        <CustomSection
          key={i}
          id={`block-${pageKey}-${i + 1}`}
          content={{ adminName: b.title, cards: [], ...b }}
        />
      ))}
    </>
  );
}

const FOUNDER_DEFAULTS = {
  eyebrow: "Meet the owner",
  name: "Umesh K",
  role: "Chief Executive Officer",
  image: "/team/ceo-ukvalley.webp",
  imageAlt: "Umesh K, Chief Executive Officer of Ukvalley Technologies",
  description:
    "Umesh leads Ukvalley Technologies and owns growth, client relationships and the operating model that keeps every project accountable.\n\nHe built the company on one idea: small and mid-sized businesses deserve the same engineering rigour as the enterprise, at a cost that makes sense — with the engineers who scope a project being the ones who build it.",
  company:
    "Ukvalley Technologies is an unfunded, engineer-led software company based in Maharashtra, India. Since 2017 we have built custom software, CRM, ERP, HRMS and mobile apps for Indian SMEs and global startups, and we run our own products in production as proof.",
  facts: [
    { label: "Company", value: "Ukvalley Technologies" },
    { label: "Founded", value: "2017" },
    { label: "Headquarters", value: "Maharashtra, India" },
    { label: "Email", value: "sales@ukvalley.com" },
  ],
};

const paragraphs = (text: string) => text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

/**
 * Owner and company introduction for the About page. Every field comes from
 * Admin → Page text → About us; a field left empty keeps the built-in text.
 */
export async function FounderSection({ pageKey }: { pageKey: string }) {
  const c = await getPageContent(pageKey);
  const d = FOUNDER_DEFAULTS;
  const image = c.founderImage || d.image;
  const facts = c.founderFacts.length ? c.founderFacts : d.facts;
  const bio = paragraphs(c.founderDescription || d.description);
  const about = paragraphs(c.companyDescription || d.company);
  return (
    <section id="owner" className="relative scroll-mt-24 bg-uk-surface section-py">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Reveal className="mx-auto w-full max-w-sm">
            <div className="overflow-hidden rounded-3xl border border-uk-line bg-uk-card p-2 shadow-float">
              {/* plain <img>: the admin can point this at /media/<id> or any https address */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={ukText(c.founderImageAlt || d.imageAlt)}
                loading="lazy"
                className="aspect-[4/5] w-full rounded-[1.25rem] object-cover object-top"
              />
            </div>
          </Reveal>
          <Reveal className="flex flex-col gap-5">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">
              {c.founderEyebrow || ukText(d.eyebrow)}
            </span>
            <div>
              <h2 className="font-heading text-3xl font-bold text-uk-heading sm:text-4xl">{c.founderName || ukText(d.name)}</h2>
              <p className="mt-1 text-base font-semibold text-uk-blue">{c.founderRole || ukText(d.role)}</p>
            </div>
            <div className="space-y-4 text-lg leading-relaxed text-uk-gray">
              {bio.map((p, i) => <p key={i}>{ukText(p)}</p>)}
            </div>
            <div className="rounded-2xl border border-uk-line bg-uk-card p-5 sm:p-6">
              <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText("About the company")}</h3>
              <div className="mt-2 space-y-3 text-sm leading-relaxed text-uk-gray">
                {about.map((p, i) => <p key={i}>{ukText(p)}</p>)}
              </div>
              <dl className="mt-4 grid gap-x-6 gap-y-3 border-t border-uk-line pt-4 text-sm sm:grid-cols-2">
                {facts.map((f, i) => (
                  <div key={i} className="flex items-baseline justify-between gap-4">
                    <dt className="flex-none text-uk-gray">{ukText(f.label)}</dt>
                    <dd className="text-right font-medium text-uk-body">{ukText(f.value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
