"use client";

import Link from "@/components/site/intent-link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PAGE_SIZES } from "@/lib/pagination";

const btn =
  "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-lg border border-uk-line px-2.5 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading";
const off = "pointer-events-none opacity-40";

/** 1 … 4 5 [6] 7 8 … 20 */
function windowOf(page: number, pages: number): (number | "…")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(pages - 1, page + 1);
  if (from > 2) out.push("…");
  for (let i = from; i <= to; i++) out.push(i);
  if (to < pages - 1) out.push("…");
  out.push(pages);
  return out;
}

/**
 * The same page navigation for every admin list: "Showing 1–10 of 42", a
 * rows-per-page picker, and first / previous / numbers / next / last. The page
 * and size live in the address (?page=&per=); other filters are kept.
 */
export function Pagination({
  total, page, pageSize, noun = "records", sizes = PAGE_SIZES, defaultSize = sizes[0], className,
}: {
  total: number;
  page: number;
  pageSize: number;
  noun?: string;
  sizes?: readonly number[];
  /** the size used when the address has no ?per= (left out of the address) */
  defaultSize?: number;
  className?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const sp = useSearchParams();
  if (total === 0) return null;

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(total, page * pageSize);
  // Nothing to switch between: fewer rows than the smallest page size.
  if (pages === 1 && total <= Math.min(...sizes)) {
    return <p className={cn("border-t border-uk-line px-4 py-3 text-xs text-uk-muted", className)}>Showing all {total} {noun}</p>;
  }

  const hrefFor = (p: number, per = pageSize) => {
    const q = new URLSearchParams(sp.toString());
    if (p > 1) q.set("page", String(p));
    else q.delete("page");
    if (per !== defaultSize) q.set("per", String(per));
    else q.delete("per");
    const s = q.toString();
    return s ? `${pathname}?${s}` : pathname;
  };

  return (
    <nav aria-label="Pagination" className={cn("flex flex-wrap items-center justify-between gap-3 border-t border-uk-line p-4 text-sm", className)}>
      <div className="flex flex-wrap items-center gap-3 text-xs text-uk-muted">
        <span>Showing {first}–{last} of {total} {noun}</span>
        <label className="inline-flex items-center gap-2">
          Rows per page
          <select
            value={pageSize}
            onChange={(e) => router.push(hrefFor(1, Number(e.target.value)))}
            aria-label="Rows per page"
            className="h-8 rounded-lg border border-uk-line bg-uk-card px-2 text-xs text-uk-heading outline-none focus-visible:border-ring [&>option]:bg-uk-card [&>option]:text-uk-heading"
          >
            {sizes.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>
      {pages > 1 && (
        <div className="flex items-center gap-1.5">
          <Link href={hrefFor(1)} aria-label="First page" aria-disabled={page <= 1} className={cn(btn, page <= 1 && off)}><ChevronsLeft className="h-4 w-4" /></Link>
          <Link href={hrefFor(page - 1)} aria-label="Previous page" aria-disabled={page <= 1} className={cn(btn, page <= 1 && off)}><ChevronLeft className="h-4 w-4" /></Link>
          {windowOf(page, pages).map((n, i) =>
            n === "…" ? (
              <span key={`gap${i}`} className="px-1 text-uk-muted" aria-hidden>…</span>
            ) : (
              <Link
                key={n}
                href={hrefFor(n)}
                aria-label={`Page ${n}`}
                aria-current={n === page ? "page" : undefined}
                className={cn(btn, n === page && "border-uk-blue bg-uk-blue text-uk-white hover:bg-uk-blue-bright hover:text-uk-white")}
              >
                {n}
              </Link>
            )
          )}
          <Link href={hrefFor(page + 1)} aria-label="Next page" aria-disabled={page >= pages} className={cn(btn, page >= pages && off)}><ChevronRight className="h-4 w-4" /></Link>
          <Link href={hrefFor(pages)} aria-label="Last page" aria-disabled={page >= pages} className={cn(btn, page >= pages && off)}><ChevronsRight className="h-4 w-4" /></Link>
        </div>
      )}
    </nav>
  );
}
