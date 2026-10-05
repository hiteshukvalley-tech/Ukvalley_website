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
  title: "Our Social Impact — giving back through technology",
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

        {/* Our social events — one gallery per kind of event */}
        {socialImpactGroups.map((g, i) => (
          <section
            key={g.id}
            id={g.id}
            className={`relative scroll-mt-24 section-py ${i % 2 === 0 ? "border-y border-uk-line bg-uk-surface-2" : "bg-uk-surface"}`}
          >
            <Container>
              <Reveal className="mx-auto flex max-w-2xl flex-col items-center text-center">
                {i === 0 && <span className={eyebrowCls}>{ukText("Our social events")}</span>}
                <h2 className={`${i === 0 ? "mt-5 " : ""}font-heading text-3xl font-bold text-uk-heading sm:text-4xl`}>{ukText(g.title)}</h2>
                {g.description.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).map((p) => (
                  <p key={p} className="mt-4 text-lg text-uk-gray">{ukText(p)}</p>
                ))}
              </Reveal>
              {g.photos.length > 0 && (
                <PhotoCarousel photos={g.photos.map((p) => ({ ...p, src: ukText(p.src), alt: ukText(p.alt) }))} caption={ukText(g.caption)} />
              )}
            </Container>
          </section>
        ))}

        <CtaBand />
        <PageBlocks pageKey="social-impact" />
      </main>
      <Footer />
    </>
  );
}
