import type { ComponentProps } from "react";
import { PageHero } from "./page-hero";
import { CustomSection } from "./custom-section";
import { Marked } from "./marked";
import { getPageContent } from "@/lib/pages-store";

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
