import Link from "@/components/site/intent-link";
import { ArrowUpRight, BookOpen, Clock } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { Marked } from "./marked";
import { getPosts } from "@/lib/blog-store";
import type { HomeContent } from "@/lib/home-defaults";
import { ukText } from "@/lib/texts";

// The homepage previews the first few articles (admin order, newest by default); the closing card links to
// the full library. Listing every article made the page far too long on
// phones.
const PREVIEW_COUNT = 4;

/** Articles come from Admin → Blog; text from Admin → Home page → Insights. */
export async function Insights({ content: c }: { content: HomeContent["insights"] }) {
  const insights = await getPosts();
  // Post count per category, most-covered first — derived from the data so
  // the closing card stays accurate as articles are added.
  const categories = Object.entries(
    insights.reduce<Record<string, number>>((acc, p) => {
      acc[p.category] = (acc[p.category] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  const latest = insights.slice(0, PREVIEW_COUNT);

  return (
    <section id="insights" className="relative bg-uk-surface-3 section-py">
      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex flex-col items-center">
          <SectionHeading
            align="center"
            eyebrow={ukText(c.eyebrow)}
            title={<Marked text={ukText(c.title)} />}
            description={ukText(c.description || undefined)}
          />
          <Reveal className="mt-6 self-end">
            <Link
              href={ukText("/blog")}
              className="group inline-flex items-center gap-2 text-sm font-semibold text-uk-blue transition-colors hover:text-uk-blue-bright"
            >
              {ukText(c.linkLabel)}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </Reveal>
        </div>

        <Reveal staggerChildren className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
          {latest.map((post) => (
            <article
              key={post.slug}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-uk-line card-premium card-spotlight bg-uk-card"
            >
              {/* top accent */}
              <div className="h-1 w-full bg-gradient-to-r from-uk-blue/40 to-uk-yellow/40 opacity-60 transition-opacity group-hover:opacity-100" aria-hidden />

              <div className="flex flex-1 flex-col gap-4 p-7">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 rounded-full bg-uk-blue/12 px-3 py-1 text-xs font-bold uppercase tracking-wider text-uk-blue">
                    {ukText(post.category)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-uk-gray">
                    <Clock className="h-3.5 w-3.5" />
                    {ukText(post.readTime)}
                  </span>
                </div>
                <h3 className="font-heading text-xl font-bold leading-snug text-uk-heading">
                  {ukText(post.title)}
                </h3>
                <p className="text-sm leading-relaxed text-uk-gray">{ukText(post.excerpt)}</p>
                <Link
                  href={ukText(`/blog/${post.slug}`)}
                  className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-uk-blue transition-colors group-hover:text-uk-blue-bright"
                >
                  {ukText(c.readLabel)}
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            </article>
          ))}

          {/* Closing card — completes the 2-column grid and routes readers
              to the full library. Spans both columns when the post count
              is even, so the grid never ends on an orphan cell. */}
          <Link
            href={ukText("/blog")}
            className={`group relative flex flex-col overflow-hidden rounded-3xl bg-uk-blue p-7 shadow-glow-blue-sm transition-all duration-300 hover:-translate-y-1 hover:bg-uk-blue-bright ${
              latest.length % 2 === 0 ? "md:col-span-2" : ""
            }`}
          >
            <div className="absolute inset-0 bg-blueprint opacity-30" aria-hidden />
            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-uk-white/10 blur-[80px] transition-all duration-700 group-hover:bg-uk-white/20" aria-hidden />

            <div className="relative flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full border border-uk-white/30 bg-uk-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-uk-white">
                <BookOpen className="h-3.5 w-3.5" />
                {ukText(c.libraryBadge)}
              </span>
              <span className="font-heading text-3xl font-bold leading-none text-uk-white">
                {insights.length}
              </span>
            </div>

            <h3 className="relative mt-4 font-heading text-xl font-bold leading-snug text-uk-white">
              {ukText(c.libraryTitle)}
            </h3>
            {c.libraryText && (
              <p className="relative mt-3 text-sm leading-relaxed text-uk-white/85">{ukText(c.libraryText)}</p>
            )}

            <ul className="relative mt-5 flex flex-wrap gap-2 border-t border-uk-white/20 pt-5">
              {categories.map((c) => (
                <li
                  key={c.name}
                  className="inline-flex items-center gap-1.5 rounded-full bg-uk-white/10 px-3 py-1 text-xs font-medium text-uk-white"
                >
                  {ukText(c.name)}
                  <span className="rounded-full bg-uk-white/20 px-1.5 text-[0.65rem] font-bold">
                    {c.count}
                  </span>
                </li>
              ))}
            </ul>

            <span className="relative mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-uk-white">
              {ukText(c.libraryCta)}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}