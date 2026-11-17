import Link from "@/components/site/intent-link";
import { CircleAlert } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { FlashToast } from "@/components/admin/toast";
import { requireAdmin } from "@/lib/admin-session";
import { listApplications } from "@/lib/applications-store";
import { todayInIndia } from "@/lib/careers-shared";
import { APPLICATION_STATUSES, applicationStatusLabel, isApplicationStatus, type ApplicationStatus } from "@/lib/applications-validation";
import {
  ApplicationsList, datesLabel, hasColumns, listHref, readColumns, readDates, readListPaging, readView, type ListFilters,
} from "../applications-list";

export const metadata = { title: "Application status" };
export const dynamic = "force-dynamic";

const STATUS_PATH = "/admin/applications/status";

type Props = {
  searchParams: Promise<{
    q?: string; status?: string; mode?: string; from?: string; to?: string; date?: string; page?: string; per?: string; saved?: string; view?: string;
    /** the table's column filters (c_name, c_email …) */
    [column: `c_${string}`]: string | undefined;
  }>;
};

// The same buttons as the Job role picker on All applicants.
const chip = (active: boolean) =>
  active
    ? "inline-flex h-9 items-center gap-2 rounded-lg bg-uk-blue/15 px-3 text-sm font-semibold text-uk-blue"
    : "inline-flex h-9 items-center gap-2 rounded-lg border border-uk-line px-3 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading";

/**
 * Every hiring status with how many applications are in it, as a row of
 * buttons. Picking one lists its applicants below, as cards or a table.
 */
export default async function ApplicationStatusPage({ searchParams }: Props) {
  await requireAdmin("applications");
  const sp = await searchParams;
  const { q = "", status = "all", page: pageParam, per, saved } = sp;

  const dates = readDates(sp);
  const view = readView(sp.view);
  // 28 cards per page in the Grid (full rows), 25 rows in the Table.
  const { page, pageSize } = readListPaging(view, pageParam, per);
  const keep: Record<string, string> = {};
  if (view === "table") keep.view = "table";
  // The column filters live in the table's header, so they only apply in the table view.
  const columns = view === "table" ? readColumns(sp) : undefined;
  const filters: ListFilters = {
    basePath: STATUS_PATH,
    keep,
    status: isApplicationStatus(status) ? status : "all",
    q,
    dates,
    pageSize,
    columns,
  };

  const { items, total, counts, dbError } = await listApplications({
    status: filters.status, q, from: dates.from, to: dates.to, columns, page, pageSize,
  });

  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total > 0 && page > pages) redirect(listHref(filters, { page: pages }));

  const statusHref = (s: ApplicationStatus | "all") => listHref(filters, { status: s, page: 1 });
  const picked = filters.status;

  return (
    <>
      <PageHeader
        title="Application status"
        crumbs={[
          { label: "Careers", href: "/admin/careers" },
          { label: "Applications", href: "/admin/applications" },
          { label: "Application status" },
        ]}
        description="How many applications are at each hiring stage. Pick a status to see its applicants below, as cards or a table."
      />

      {saved === "deleted" && <FlashToast message="Application deleted." />}
      {dbError && (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Could not read applications ({dbError}).</span>
        </div>
      )}

      {/* Status picker: every hiring stage with its count, like the Job role picker on All applicants */}
      <nav aria-label="Application status" className="mb-6 rounded-2xl border border-uk-line bg-uk-card p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
          <p className="text-xs font-medium uppercase tracking-wide text-uk-muted">Status</p>
          <p className="text-xs text-uk-muted">
            {counts.all} {counts.all === 1 ? "application" : "applications"}
            {dates.from ? ` ${dates.to ? "from" : "on"} ${datesLabel(dates)}` : " in total"}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["all", ...APPLICATION_STATUSES] as const).map((k) => {
            const active = picked === k;
            return (
              <Link key={k} href={statusHref(k)} aria-current={active ? "page" : undefined} className={chip(active)}>
                {k === "all" ? "All statuses" : applicationStatusLabel[k]}
                <span className="rounded-full bg-uk-surface-3 px-2 py-0.5 text-[0.7rem] font-semibold text-uk-body">{counts[k]}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <ApplicationsList
        filters={filters}
        items={items}
        total={total}
        counts={counts}
        page={page}
        today={todayInIndia()}
        noneYet={!dates.from && !hasColumns(columns) && counts.all === 0}
        dbError={dbError}
        view={view}
        viewSwitch
        statusTabs={false}
      />
    </>
  );
}
