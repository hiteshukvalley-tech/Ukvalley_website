import type { Metadata } from "next";
import Link from "@/components/site/intent-link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowLeft, Clock, BookOpen, Layers } from "lucide-react";
import { Header } from "@/components/site/header";
import { ScopingButton } from "@/components/site/scoping-modal";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { PageHero, heroExtras } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { CtaBand } from "@/components/site/cta";
import { getPosts } from "@/lib/blog-store";
import { jsonLd } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getPosts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = (await getPosts()).find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `https://ukvalley.com/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.date,
    },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const insights = await getPosts();
  const post = insights.find((p) => p.slug === slug);
  if (!post) notFound();

  const related = [
    ...insights.filter((p) => p.slug !== post.slug && p.category === post.category),
    ...insights.filter((p) => p.slug !== post.slug && p.category !== post.category),
  ].slice(0, 3);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { "@type": "Organization", name: "Ukvalley Technologies" },
    publisher: {
      "@type": "Organization",
      name: "Ukvalley Technologies",
      url: "https://ukvalley.com",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(articleSchema) }}
      />
      <ScrollProgress />
      <Header />
      <main id="main">
        <PageHero variant="insights"
          extras={heroExtras.insights}
          eyebrow={post.category}
          crumbs={[
            { label: "Home", href: "/" },
            { label: "Insights", href: "/blog" },
            { label: post.title },
          ]}
          title={post.title}
          description={post.excerpt}
        >
          <div className="mt-3 flex items-center gap-4 text-sm text-uk-gray">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {post.readTime}
            </span>
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
          </div>
        </PageHero>

        <section className="relative bg-uk-surface-2 section-py">
          <Container className="max-w-6xl">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.25fr_1fr] lg:items-start lg:gap-16">
              <div>
                <Reveal className="flex flex-col gap-6">
                  {post.body.map((para, i) => (
                    <p key={i} className="text-justify-prose text-lg leading-relaxed text-uk-body">
                      {para}
                    </p>
                  ))}
                </Reveal>

                <Reveal className="mt-10 border-t border-uk-line pt-8">
                  <Link
                    href="/blog"
                    className="group inline-flex items-center gap-2 text-sm font-semibold text-uk-blue transition-colors hover:text-uk-blue-bright"
                  >
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    All insights
                  </Link>
                </Reveal>
              </div>

              <Reveal className="flex flex-col gap-5">
                <div className="flex w-full flex-col rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-7">
                  <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-uk-heading">
                    <BookOpen className="h-4 w-4 text-uk-blue" />
                    About this guide
                  </h3>
                  <dl className="mt-4 flex flex-col divide-y divide-uk-line">
                    {[
                      { label: "Category", value: post.category },
                      { label: "Read time", value: post.readTime.replace(" read", "") },
                      {
                        label: "Published",
                        value: new Date(post.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
                      },
                    ].map((f) => (
                      <div key={f.label} className="flex items-baseline justify-between gap-4 py-3">
                        <dt className="text-sm text-uk-gray">{f.label}</dt>
                        <dd className="text-right font-medium text-uk-body">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                  {related.length > 0 && (
                    <>
                      <p className="mt-4 flex items-center gap-2 border-t border-uk-line pt-3 text-xs font-semibold uppercase tracking-[0.18em] text-uk-muted">
                        <Layers className="h-3.5 w-3.5 text-uk-blue" />
                        More on this
                      </p>
                      <ul className="mt-3 flex flex-col gap-2.5">
                        {related.map((r) => (
                          <li key={r.slug}>
                            <Link
                              href={`/blog/${r.slug}`}
                              className="text-sm font-medium leading-snug text-uk-body transition-colors hover:text-uk-blue"
                            >
                              {r.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-uk-blue/20 bg-uk-surface-blue p-6">
                  <h3 className="font-heading text-lg font-bold text-uk-heading">
                    Want this for your business?
                  </h3>
                  <p className="text-sm text-uk-gray">
                    Book a free 30-minute scoping call with a software architect.
                  </p>
                  <ScopingButton className="btn-sheen btn-lift group inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-uk-blue px-5 py-2.5 text-sm font-semibold text-white shadow-glow-blue-sm hover:bg-uk-blue-bright">
                    Book a scoping call
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </ScopingButton>
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        <CtaBand />
      </main>
      <Footer />
    </>
  );
}