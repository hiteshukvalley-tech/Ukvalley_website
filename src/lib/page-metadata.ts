import type { Metadata } from "next";
import { getPageContent } from "@/lib/pages-store";
import { ukText } from "@/lib/texts";
import { SITE_INDEXABLE } from "@/lib/site-origin";

/** Room for a page title before the root layout's " | Ukvalley" (60 characters in all). */
const TITLE_ROOM = 60 - " | Ukvalley".length;

/**
 * The first of the given titles that fits a search result (≤ 60 characters
 * with the brand), longest wording first; the last one when none fit. For
 * titles built from admin data, e.g. fitTitle(`Hire ${role} — code you own`, `Hire ${role}`).
 */
export function fitTitle(...candidates: string[]): string {
  return candidates.find((t) => t.length <= TITLE_ROOM) ?? candidates[candidates.length - 1];
}

/**
 * A headline (blog post, case study) as a page title that fits a search
 * result: as written when it fits with the brand, then without the brand, then
 * without a trailing "(…)", then only the part before its "?", ":" or " — ".
 * Fuller wordings to try first (with the brand) can be passed after it.
 */
export function headlineTitle(headline: string, ...fuller: string[]): Metadata["title"] {
  const full = fuller.find((t) => t.length <= TITLE_ROOM);
  if (full) return full;
  const noAside = headline.replace(/\s*\([^)]*\)\s*\.?$/, "").replace(/\.$/, "");
  const lead = noAside.split(/(?<=\?)\s|:\s|\s[—–]\s/)[0];
  for (const t of [headline, noAside, lead]) {
    if (t.length <= TITLE_ROOM) return t;
    if (t.length <= 60) return { absolute: t };
  }
  return lead;
}

/**
 * Gives a page its own share preview (Open Graph / Twitter) from its title,
 * description and canonical address. Without this every page inherits the
 * home page's preview from the root layout. Fields the page sets itself win.
 */
export function withSharePreview(meta: Metadata): Metadata {
  const title =
    typeof meta.title === "string" ? meta.title : meta.title && "absolute" in meta.title ? meta.title.absolute : undefined;
  const description = meta.description ?? undefined;
  const url = typeof meta.alternates?.canonical === "string" ? meta.alternates.canonical : undefined;
  return {
    ...meta,
    openGraph: {
      type: "website",
      locale: "en_IN",
      siteName: "Ukvalley Technologies",
      title,
      description,
      ...(url ? { url } : {}),
      ...meta.openGraph,
    },
    twitter: { card: "summary_large_image", title, description, ...meta.twitter },
    // A page's own robots setting can't make a test deployment indexable.
    ...(SITE_INDEXABLE ? {} : { robots: { index: false, follow: false } }),
  };
}

/**
 * Metadata for an inner page: the page's own title and description, replaced
 * by the SEO fields in Admin → Page text when they are filled in.
 */
export async function editableMetadata(pageKey: string, base: Metadata): Promise<Metadata> {
  const c = await getPageContent(pageKey);
  const title = c.seoTitle || ukText(typeof base.title === "string" ? base.title : "") || undefined;
  const description = c.seoDescription || ukText(base.description ?? "") || undefined;
  return withSharePreview({ ...base, title, description });
}
