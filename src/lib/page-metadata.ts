import type { Metadata } from "next";
import { getPageContent } from "@/lib/pages-store";
import { ukText } from "@/lib/texts";

/**
 * Gives a page its own share preview (Open Graph / Twitter) from its title,
 * description and canonical address. Without this every page inherits the
 * home page's preview from the root layout. Fields the page sets itself win.
 */
export function withSharePreview(meta: Metadata): Metadata {
  const title = typeof meta.title === "string" ? meta.title : undefined;
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
