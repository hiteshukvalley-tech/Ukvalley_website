import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site-origin";
import { editableMetadata } from "@/lib/page-metadata";
import Link from "@/components/site/intent-link";
import { ArrowUpRight, Target, Check, Gauge } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { heroArtwork } from "@/components/site/page-hero";
import { EditableHero, PageBlocks } from "@/components/site/page-extras";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { FlagshipProductCard } from "@/components/site/flagship-product-card";
import { CtaBand } from "@/components/site/cta";
import { FLAGSHIP_SIDE_CARDS, flagshipRowsClass, getProducts, splitFlagship } from "@/lib/products-store";
import type { Product } from "@/lib/site-data";
import { ukText } from "@/lib/texts";

// Re-render at least once a minute so admin text overrides always show up.
export const revalidate = 60;


// Title and description can be replaced in Admin → Page text (SEO fields).
export const generateMetadata = () => editableMetadata("products", baseMetadata);
const baseMetadata: Metadata = {
  title: "Products — our own IP in production",
  description:
    "TeleValley, Ezzu CRM, Custom ERP, LMS, Evento, Emailz and more — software products and platforms Ukvalley designed, built and runs in production.",
  alternates: { canonical: `${SITE_URL}/products` },
};

export default async function ProductsPage() {
  const products = await getProducts();
  const { flagship, rest } = splitFlagship(products);
  // Without a flagship every card goes in the main grid.
  const beside = flagship ? rest.slice(0, FLAGSHIP_SIDE_CARDS) : rest;
  const below = flagship ? rest.slice(FLAGSHIP_SIDE_CARDS) : [];
  return (
    <>
      <ScrollProgress />
      <Header />
      <main id="main">
        <EditableHero pageKey="products" variant="work"
          image={heroArtwork.work}
          eyebrow={ukText("Our products")}
          crumbs={[{ label: "Home", href: "/" }, { label: "Products" }]}
          title={
            <>{ukText("We don't just bill hours —")}{" "}
              <span className="text-gradient-blue">{ukText("we build & run our own IP.")}</span>
            </>
          }
          description={ukText("A product portfolio in production is proof most service firms can't offer. The same engineers who build yours build and run these.")}
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
                <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("Why we build and run our own products, not just yours")}</h2>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">{ukText("Every dev shop claims it can build production software. Most have never had to operate what they built — no on-call rotation, no paying users at 2am, no P&L riding on their own uptime. That's a different discipline, and it never shows up in a portfolio screenshot.")}</p>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">{ukText("The gap becomes obvious over time: an agency that only ever ships and hands off never has to live with its own architecture debt or its own scaling mistakes, so those lessons never make it into your project. A system built to be delivered once and never touched again quietly accumulates decisions nobody had to defend under real load.")}</p>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">{ukText("TeleValley, Ezzu CRM, our Custom ERP, the LMS, Evento, Emailz and the rest of this portfolio are proof of the opposite: products and platforms we designed, built, deployed and still support today, with real users depending on them. The architects who maintain these products review the code on yours.")}</p>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">{ukText("Every product started the same way: a real operational problem inside our own business, solved first for ourselves and then hardened enough to hand to a paying customer. TeleValley began as our own sales floor's telephony bill; HR Agency Management began as the candidate-and-client backbone a recruitment agency needed built from nothing. That origin is why the FAQs on each product page read like operator questions, not marketing copy — because they were, the first time someone asked them.")}</p>
              </Reveal>

              <Reveal className="flex flex-col gap-5">
                <div className="flex w-full flex-col rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-7">
                  <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText("Why that matters to you")}</h3>
                  <p className="mt-1 text-sm text-uk-gray">{ukText("What operating our own software changes about how we build yours.")}</p>
                  <ul className="mt-5 flex flex-col gap-4">
                    {[
                      "Real production discipline, not just delivery discipline",
                      "Architects who've felt their own scaling mistakes firsthand",
                      "Products you can try or deploy before you hire us for anything else",
                      "The same review culture and on-call standards applied to your codebase",
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
                      { label: "Products in production", value: String(products.length), sub: "Designed, built and operated by us" },
                      { label: "Building since", value: "2017", sub: "Same founding team throughout" },
                      { label: "Platforms covered", value: "4+", sub: "Flutter, Next.js, Laravel, Django" },
                      { label: "Who reviews yours", value: "Same architects", sub: "As review these products daily" },
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

        <section className="relative bg-uk-surface-2 section-py">
          <Container>
            <div className={flagship ? "grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]" : "grid grid-cols-1"}>
              {/* Featured — flagship card on the left */}
              {flagship && (
                <Reveal>
                  <FlagshipProductCard featured={flagship} />
                </Reveal>
              )}

              {/* Up to 4 cards stacked on the right, rows stretched to fill
                  the flagship card's height so both sides stay even */}
              <Reveal
                staggerChildren
                className={
                  flagship
                    ? `grid h-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-1 ${flagshipRowsClass[beside.length] ?? ""}`
                    : "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
                }
              >
                {beside.map((p) => <ProductCard key={p.slug} p={p} />)}
              </Reveal>
            </div>

            {/* Everything else in a grid below */}
            {below.length > 0 && (
              <Reveal staggerChildren className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {below.map((p) => <ProductCard key={p.slug} p={p} />)}
              </Reveal>
            )}
          </Container>
        </section>

        <CtaBand />
        <PageBlocks pageKey="products" />
      </main>
      <Footer />
    </>
  );
}

function ProductCard({ p }: { p: Product }) {
  return (
    <Link
      href={ukText(`/products/${p.slug}`)}
      className="group relative flex h-full flex-col gap-2.5 overflow-hidden rounded-2xl border border-uk-line bg-uk-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-uk-blue/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-xl font-bold text-uk-heading">{ukText(p.name)}</h3>
          <p className="text-sm text-uk-blue">{ukText(p.tagline)}</p>
        </div>
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-uk-surface-blue text-uk-blue transition-all group-hover:bg-uk-blue group-hover:text-uk-white">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
      <p className="text-sm leading-relaxed text-uk-gray">{ukText(p.description)}</p>
      <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
        {p.highlights.map((h) => (
          <span key={h} className="rounded-md bg-uk-surface-blue px-2 py-1 text-[0.7rem] font-medium text-uk-body">
            {ukText(h)}
          </span>
        ))}
      </div>
    </Link>
  );
}