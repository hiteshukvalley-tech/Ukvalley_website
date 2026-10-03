import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { PageHero } from "@/components/site/page-hero";
import { Marked } from "@/components/site/marked";
import { CustomSection } from "@/components/site/custom-section";
import { getMainPage } from "@/lib/menu-store";
import { splitMarks } from "@/lib/home-schema";
import { ukText } from "@/lib/texts";

// Re-render at least once a minute so admin text overrides always show up.
export const revalidate = 60;

// A main-menu section added in Admin → Main menu: hero, a grid of cards and
// extra blocks, all edited there. Pages are rendered on first visit.
export async function generateMetadata({ params }: PageProps<"/s/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await getMainPage(slug);
  if (!page) return {};
  const title = splitMarks(page.heroTitle).map((p) => p.text).join("");
  return {
    title,
    description: page.heroDescription || undefined,
    alternates: { canonical: `https://ukvalley.com/s/${slug}` },
  };
}

export default async function MainSectionPublicPage({ params }: PageProps<"/s/[slug]">) {
  const { slug } = await params;
  const page = await getMainPage(slug);
  if (!page) notFound();
  const heroName = splitMarks(page.heroTitle).map((p) => p.text).join("");

  return (
    <>
      <ScrollProgress />
      <Header />
      <main id="main">
        <PageHero
          variant="company"
          eyebrow={ukText(page.heroEyebrow || heroName)}
          crumbs={[{ label: "Home", href: "/" }, { label: heroName }]}
          title={<Marked text={ukText(page.heroTitle)} />}
          description={ukText(page.heroDescription || undefined)}
        />
        {page.cards.length > 0 && (
          <CustomSection
            id={`${slug}-cards`}
            content={{
              adminName: page.adminName, eyebrow: "", title: page.cardsTitle, description: "",
              image: "", imageAlt: "", cards: page.cards, buttonLabel: "", buttonHref: "",
            }}
          />
        )}
        {page.blocks.map((b, i) => (
          <CustomSection key={i} id={`${slug}-block-${i + 1}`} content={{ adminName: b.title, cards: [], ...b }} />
        ))}
      </main>
      <Footer />
    </>
  );
}
