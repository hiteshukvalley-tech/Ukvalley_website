import Link from "@/components/site/intent-link";
import { SITE_URL } from "@/lib/site-origin";
import { ChevronRight } from "lucide-react";
import { jsonLd } from "@/lib/utils";
import { ukText } from "@/lib/texts";

export type Crumb = { label: string; href?: string };

/**
 * Breadcrumb navigation with matching BreadcrumbList schema.
 * Renders an OrderedList semantically; the JSON-LD is emitted alongside.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${SITE_URL}${c.href}` } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(schema) }}
      />
      <nav aria-label="Breadcrumb" className="text-sm">
        <ol className="flex flex-wrap items-center gap-1.5 text-uk-muted">
          {items.map((c, i) => {
            const last = i === items.length - 1;
            return (
              <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
                {c.href && !last ? (
                  <Link
                    href={c.href}
                    className="transition-colors hover:text-uk-blue"
                  >
                    {ukText(c.label)}
                  </Link>
                ) : (
                  <span className={last ? "text-uk-heading" : ""}>
                    {ukText(c.label)}
                  </span>
                )}
                {!last && <ChevronRight className="h-3.5 w-3.5 text-uk-muted/60" />}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}