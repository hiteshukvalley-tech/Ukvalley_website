import Link from "@/components/site/intent-link";
import { ChevronLeft, ChevronRight, CircleAlert, CircleCheck, Download, Search } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { isLeadStatus, leadStatusLabel, listLeads, type LeadStatus } from "@/lib/leads-store";
import { formatLeadDate, sourceLabel, StatusBadge } from "./lead-ui";

export const metadata = { title: "Leads" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

type Props = { searchParams: Promise<{ q?: string; status?: string; page?: string; saved?: string }> };

export default async function LeadsAdminPage({ searchParams }: Props) {
  const { q = "", status = "all", page: pageParam, saved } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const activeStatus = isLeadStatus(status) ? status : "all";

  const { items, total, counts, dbError } = await listLeads({
    status: activeStatus,
    q,
    page,
    pageSize: PAGE_SIZE,
  });

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (over: { status?: string; page?: number }) => {
    const p = new URLSearchParams();
    const s = over.status ?? activeStatus;
    if (s !== "all") p.set("status", s);
    if (q.trim()) p.set("q", q.trim());
    if (over.page && over.page > 1) p.set("page", String(over.page));
    const qs = p.toString();
    return qs ? `/admin/leads?${qs}` : "/admin/leads";
  };

  const tabs: { key: "all" | LeadStatus; label: string }[] = [
    { key: "all", label: "All" },
    { key: "new", label: leadStatusLabel.new },
    { key: "contacted", label: leadStatusLabel.contacted },
    { key: "closed", label: leadStatusLabel.closed },
  ];

  return (
    <>
      <PageHeader
        title="Leads"
        crumbs={[{ label: "Leads" }]}
        description="Enquiries from the Contact page and the “Book a scoping call” popup, newest first. Open one to follow up, set its status and add notes."
        action={
          // A plain link (not next/link): it downloads a file, not a page.
          // eslint-disable-next-line @next/next/no-html-link-for-pages
          <a
            href="/admin/leads/export"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
          >
            <Download className="h-4 w-4" /> Export CSV
          </a>
        }
      />

      {saved === "deleted" && (
        <div role="status" className="mb-6 flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" /> Lead deleted.
        </div>
      )}
      {dbError && (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Could not read leads ({dbError}). Until the database is connected, the website forms fall back to the visitor&apos;s email app and nothing is saved here.</span>
        </div>
      )}

      <section className="rounded-2xl border border-uk-line bg-uk-card">
        <div className="flex flex-wrap gap-1.5 border-b border-uk-line p-3" role="tablist" aria-label="Filter by status">
          {tabs.map((t) => {
            const active = activeStatus === t.key;
            return (
              <Link
                key={t.key}
                href={href({ status: t.key })}
                role="tab"
                aria-selected={active}
                className={
                  active
                    ? "inline-flex h-9 items-center gap-2 rounded-lg bg-uk-blue/15 px-3 text-sm font-semibold text-uk-blue"
                    : "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-uk-muted transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
                }
              >
                {t.label}
                <span className="rounded-full bg-uk-surface-3 px-2 py-0.5 text-[0.7rem] font-semibold text-uk-body">{counts[t.key]}</span>
              </Link>
            );
          })}
        </div>

        <form method="get" className="flex flex-wrap items-center gap-3 border-b border-uk-line p-4">
          {activeStatus !== "all" && <input type="hidden" name="status" value={activeStatus} />}
          <label className="relative min-w-52 flex-1">
            <span className="sr-only">Search leads</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-uk-muted" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search by name, email, company, phone or message"
              className="h-10 w-full rounded-lg border border-input bg-transparent pl-9 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </label>
          <button type="submit" className="h-10 rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading">
            Search
          </button>
          {q.trim() && (
            <Link href={activeStatus === "all" ? "/admin/leads" : `/admin/leads?status=${activeStatus}`} className="text-sm text-uk-muted hover:text-uk-heading">
              Clear
            </Link>
          )}
        </form>

        {!dbError && counts.all === 0 ? (
          <div className="p-10 text-center">
            <h2 className="font-heading text-lg font-semibold text-uk-heading">No enquiries yet</h2>
            <p className="mx-auto mt-1 max-w-lg text-sm text-uk-muted">
              When someone sends the Contact form or the scoping-call popup, it appears here.
            </p>
          </div>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-sm text-uk-muted">{dbError ? "No data." : "No leads match your search."}</p>
        ) : (
          <>
            <p className="border-b border-uk-line px-4 py-2 text-xs text-uk-muted">
              Showing {(page - 1) * PAGE_SIZE + 1}–{(page - 1) * PAGE_SIZE + items.length} of {total}
            </p>
            <ul className="divide-y divide-uk-line">
              {items.map((l) => (
                <li key={l.id}>
                  <Link
                    href={`/admin/leads/${l.id}`}
                    className="flex flex-wrap items-start justify-between gap-3 px-4 py-4 transition-colors hover:bg-uk-surface-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`truncate text-sm text-uk-heading ${l.status === "new" ? "font-bold" : "font-semibold"}`}>{l.name}</span>
                        <StatusBadge status={l.status} label={leadStatusLabel[l.status]} />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-uk-muted">
                        {l.email}
                        {l.company ? ` · ${l.company}` : ""}
                        {l.service ? ` · ${l.service}` : ""}
                        {l.budget ? ` · ${l.budget}` : ""}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-uk-body">{l.message}</p>
                    </div>
                    <div className="shrink-0 text-right text-xs text-uk-muted">
                      <p>{formatLeadDate(l.createdAt)}</p>
                      <p className="mt-0.5">{sourceLabel(l.source)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            {pages > 1 && (
              <nav aria-label="Pagination" className="flex items-center justify-between gap-3 border-t border-uk-line p-4 text-sm">
                {page > 1 ? (
                  <Link href={href({ page: page - 1 })} className="inline-flex h-9 items-center gap-1 rounded-lg border border-uk-line px-3 text-uk-body hover:bg-uk-surface-2">
                    <ChevronLeft className="h-4 w-4" /> Newer
                  </Link>
                ) : <span />}
                <span className="text-uk-muted">Page {page} of {pages}</span>
                {page < pages ? (
                  <Link href={href({ page: page + 1 })} className="inline-flex h-9 items-center gap-1 rounded-lg border border-uk-line px-3 text-uk-body hover:bg-uk-surface-2">
                    Older <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : <span />}
              </nav>
            )}
          </>
        )}
      </section>
    </>
  );
}
