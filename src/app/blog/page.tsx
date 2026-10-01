import type { Metadata } from "next";
import Link from "@/components/site/intent-link";
import { ArrowRight, Clock, Target, Check, Gauge } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { PageHero, heroExtras } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { CtaBand } from "@/components/site/cta";
import { getPosts } from "@/lib/blog-store";

export const metadata: Metadata = {
  title: "Insights — software, CRM & ERP buyer's guides",
  description:
    "Plain-English guides for Indian SMEs choosing CRM vs ERP, and how to ship real software in weeks — not months. Written by the engineers who build it.",
  alternates: { canonical: "https://ukvalley.com/blog" },
};

export default async function BlogPage() {
  const insights = await getPosts();
  // Order comes from the admin (drag and drop): the first post is featured.
  const [featured, ...rest] = insights;
  const categoryCount = new Set(insights.map((p) => p.category)).size;
  const avgReadTime = Math.round(
    insights.reduce((n, p) => n + (parseInt(p.readTime, 10) || 0), 0) / insights.length
  );
  return (
    <>
      <ScrollProgress />
      <Header />
      <main id="main">
        <PageHero variant="insights"
          extras={heroExtras.insights}
          eyebrow="Insights"
          crumbs={[{ label: "Home", href: "/" }, { label: "Insights" }]}
          title={
            <>
              Buyer&apos;s guides and engineering notes —{" "}
              <span className="text-gradient-blue">written by the builders.</span>
            </>
          }
          description="No fluff, no SEO filler. Practical frames for choosing software and shipping it, from the team doing the work."
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
                  Why most vendor blogs are content-marketing filler — and this one isn't
                </h2>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">
                  Most agency blogs exist for search rankings, not readers: a thousand words restating the title, written by a copywriter who has never shipped the thing being described, padded with keywords until it ranks. You finish the article no closer to a decision than when you started.
                </p>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">
                  That filler costs readers real time — ten minutes spent on a listicle that could have been a single paragraph, or worse, advice that quietly steers toward whatever the agency happens to sell rather than what the reader's situation actually calls for.
                </p>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">
                  Every article below is written by the architects and engineers doing the actual work — buyer's guides, engineering notes and process breakdowns with specific numbers and trade-offs, not adjectives.
                </p>
              </Reveal>

              <Reveal className="flex flex-col gap-5">
                <div className="flex w-full flex-col rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-7">
                  <h3 className="font-heading text-lg font-bold text-uk-heading">What you won't find here</h3>
                  <ul className="mt-4 flex flex-col gap-3.5">
                    {[
                      "Keyword-stuffed listicles with no real answer",
                      "Advice that happens to point at whatever we sell",
                      "Content written by someone who's never shipped the thing",
                      "Vague timelines guessed rather than measured",
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
                      { label: "Guides published", value: String(insights.length), sub: "And growing every month" },
                      { label: "Topic categories", value: String(categoryCount), sub: "Buyer's guides to engineering" },
                      { label: "Average read time", value: `${avgReadTime} min`, sub: "Written to be finished" },
                      { label: "Written by", value: "The builders", sub: "Not a copywriter" },
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

        <section className="relative bg-uk-surface-2 section-py">
          <Container>
            {/* Featured — same card colour as the posts below (white card) */}
            <Reveal>
              <Link
                href={`/blog/${featured.slug}`}
                className="group grid grid-cols-1 gap-8 rounded-3xl border border-uk-line bg-uk-card p-8 transition-all duration-300 hover:border-uk-blue/50 sm:p-10 lg:grid-cols-2"
              >
                <div className="flex flex-col gap-4">
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-uk-blue/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-uk-blue">
                    Featured · {featured.category}
                  </span>
                  <h2 className="font-heading text-2xl font-bold leading-snug text-uk-heading sm:text-3xl">
                    {featured.title}
                  </h2>
                  <p className="text-uk-gray">{featured.excerpt}</p>
                  <span className="mt-2 inline-flex items-center gap-2 text-sm text-uk-blue">
                    Read article
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
                <div className="flex flex-col justify-end gap-3 lg:items-end">
                  <span className="inline-flex items-center gap-1.5 text-xs text-uk-gray">
                    <Clock className="h-3.5 w-3.5" />
                    {featured.readTime}
                  </span>
                  <time className="text-sm text-uk-gray" dateTime={featured.date}>
                    {new Date(featured.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </time>
                </div>
              </Link>
            </Reveal>

            {/* Rest — same size and layout as the featured card */}
            <Reveal staggerChildren className="mt-8 grid grid-cols-1 gap-6">
              {rest.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group grid grid-cols-1 gap-8 rounded-3xl border border-uk-line bg-uk-card p-8 transition-all duration-300 hover:border-uk-blue/50 sm:p-10 lg:grid-cols-2"
                >
                  <div className="flex flex-col gap-4">
                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-uk-blue/12 px-3 py-1 text-xs font-bold uppercase tracking-widest text-uk-blue">
                      {post.category}
                    </span>
                    <h2 className="font-heading text-2xl font-bold leading-snug text-uk-heading sm:text-3xl">
                      {post.title}
                    </h2>
                    <p className="text-uk-gray">{post.excerpt}</p>
                    <span className="mt-2 inline-flex items-center gap-2 text-sm text-uk-blue">
                      Read article
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                  <div className="flex flex-col justify-end gap-3 lg:items-end">
                    <span className="inline-flex items-center gap-1.5 text-xs text-uk-gray">
                      <Clock className="h-3.5 w-3.5" />
                      {post.readTime}
                    </span>
                    <time className="text-sm text-uk-gray" dateTime={post.date}>
                      {new Date(post.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </time>
                  </div>
                </Link>
              ))}
            </Reveal>
          </Container>
        </section>

        <CtaBand />
      </main>
      <Footer />
    </>
  );
}