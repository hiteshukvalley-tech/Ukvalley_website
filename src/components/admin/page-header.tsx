import Link from "@/components/site/intent-link";
import { ChevronRight } from "lucide-react";

/** Standard title block used at the top of every admin page. */
export function PageHeader({
  title,
  description,
  crumbs = [],
  action,
}: {
  title: string;
  description?: string;
  crumbs?: { label: string; href?: string }[];
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1 text-xs text-uk-muted">
          <Link href="/admin" className="hover:text-uk-heading">Admin</Link>
          {crumbs.map((c) => (
            <span key={c.label} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3" />
              {c.href ? <Link href={c.href} className="hover:text-uk-heading">{c.label}</Link> : c.label}
            </span>
          ))}
        </nav>
        <h1 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-uk-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
