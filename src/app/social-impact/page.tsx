import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site-origin";
import { editableMetadata } from "@/lib/page-metadata";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { heroExtras } from "@/components/site/page-hero";
import { EditableHero, PageBlocks } from "@/components/site/page-extras";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { CtaBand } from "@/components/site/cta";
import { PhotoCarousel } from "@/components/site/photo-gallery";
import { resolveSocialImpact } from "@/lib/social-impact-data";
import { getPageContent } from "@/lib/pages-store";
import { ukText } from "@/lib/texts";

// Re-render at least once a minute so admin text overrides always show up.
export const revalidate = 60;

// Title and description can be replaced in Admin → Page text (SEO fields).
export const generateMetadata = () => editableMetadata("social-impact", baseMetadata);
const baseMetadata: Metadata = {
  title: "Social impact: giving back through technology",
  description:
    "How Ukvalley Technologies gives back: tree plantation drives, sports days, celebrations and AI workshops that build digital skills in the communities we serve.",
  alternates: { canonical: `${SITE_URL}/social-impact` },
};

const eyebrowCls =
  "inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue";

// The intro and the event galleries are edited in Admin → Page text → Our
// social impact; until something is saved there, the built-in content shows.
export default async function SocialImpactPage() {
  const { intro: socialImpactIntro, groups: socialImpactGroups } = resolveSocialImpact(await getPageContent("social-impact"));
  return (
    <>
      <ScrollProgress />
      <Header />
      <main id="main">
        <EditableHero
          pageKey="social-impact"
          variant="company"
          extras={heroExtras.company}
          eyebrow={ukText("Our social impact")}
          crumbs={[{ label: "Home", href: "/" }, { label: "Our Social Impact" }]}
          title={
            <>{ukText("Technology that")}{" "}
              <span className="text-gradient-blue">{ukText("gives back")}</span>{" "}{ukText("to our community")}</>
          }
          description={ukText("Innovation should drive business success and contribute positively to society. See how we empower people and communities through technology, learning and togetherness.")}
        />

        {/* Intro */}
        <section className="relative bg-uk-surface section-py">
          <Container>
            <Reveal className="mx-auto flex max-w-3xl flex-col gap-5">
              <span className={eyebrowCls}>{ukText(socialImpactIntro.eyebrow)}</span>
              <h2 className="font-heading text-3xl font-bold text-uk-heading sm:text-4xl">{ukText(socialImpactIntro.title)}</h2>
              <div className="space-y-4 text-base leading-relaxed text-uk-body sm:text-lg">
                {socialImpactIntro.paragraphs.map((p) => (
                  <p key={p}>{ukText(p)}</p>
                ))}
              </div>
            </Reveal>
          </Container>
        </section>

        {/* Our social events: one card per event, in the order set in the admin
            (a new section is added at the top there, so it shows first here).
            Photos and text sit side by side and swap sides from card to card;
            on phones the photos come first and the text below them. */}
        {socialImpactGroups.length > 0 && (
          <section id="social-events" className="relative scroll-mt-24 border-y border-uk-line bg-uk-surface-2 section-py">
            <Container>
              <Reveal className="mx-auto flex max-w-2xl flex-col items-center text-center">
                <span className={eyebrowCls}>{ukText("Our social events")}</span>
                <h2 className="mt-5 font-heading text-3xl font-bold text-uk-heading sm:text-4xl">
                  {ukText("Moments that bring our team and community together")}
                </h2>
              </Reveal>

              <div className="mt-12 flex flex-col gap-10 lg:mt-16 lg:gap-14">
                {socialImpactGroups.map((g, i) => {
                  const paragraphs = g.description.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
                  const hasPhotos = g.photos.length > 0;
                  // photos on the left for 1st, 3rd, 5th… cards, on the right for the others
                  const photosRight = i % 2 === 1;
                  return (
                    <Reveal key={g.id}>
                      <article
                        id={g.id}
                        className={`group relative scroll-mt-28 overflow-hidden rounded-3xl border border-uk-line bg-uk-card shadow-premium transition-[transform,box-shadow,border-color] duration-500 hover:-translate-y-1 hover:border-uk-blue/30 hover:shadow-premium-lg ${
                          hasPhotos ? "grid lg:grid-cols-2" : ""
                        }`}
                      >
                        {hasPhotos && (
                          <div className={`relative ${photosRight ? "lg:order-2" : ""}`}>
                            <PhotoCarousel
                              compact
                              photos={g.photos.map((p) => ({ ...p, src: ukText(p.src), alt: ukText(p.alt) }))}
                              caption={ukText(g.caption)}
                            />
                          </div>
                        )}

                        <div className={`relative flex flex-col justify-center p-6 sm:p-8 lg:p-12 ${photosRight ? "lg:order-1" : ""}`}>
                          {/* soft brand glow in the corner away from the photos */}
                          <div
                            aria-hidden
                            className={`pointer-events-none absolute -top-24 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgba(49,0,255,0.10),transparent)] ${
                              photosRight ? "-left-24" : "-right-24"
                            }`}
                          />
                          <div className="relative flex items-center gap-3">
                            <span className="font-heading text-4xl font-bold leading-none text-uk-blue/20 sm:text-5xl" aria-hidden>
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            {g.caption && (
                              <span className="inline-flex items-center rounded-full bg-uk-yellow/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-uk-heading">
                                {ukText(g.caption)}
                              </span>
                            )}
                          </div>
                          <h3 className="relative mt-5 font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText(g.title)}</h3>
                          <span className="relative mt-4 block h-1 w-14 rounded-full bg-gradient-to-r from-uk-blue to-uk-yellow" aria-hidden />
                          {paragraphs.map((p) => (
                            <p key={p} className="relative mt-4 text-base leading-relaxed text-uk-body sm:text-lg">
                              {ukText(p)}
                            </p>
                          ))}
                          {hasPhotos && (
                            <p className="relative mt-6 text-sm font-medium text-uk-muted">
                              {g.photos.length === 1 ? ukText("1 photo") : `${g.photos.length} ${ukText("photos")}`}
                              {g.photos.length > 1 && <span className="hidden sm:inline"> · {ukText("swipe or use the arrows to browse")}</span>}
                            </p>
                          )}
                        </div>
                      </article>
                    </Reveal>
                  );
                })}
              </div>
            </Container>
          </section>
        )}

        <CtaBand related="social-impact" />
        <PageBlocks pageKey="social-impact" />
      </main>
      <Footer />
    </>
  );
}
