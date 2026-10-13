import Link from "@/components/site/intent-link";
import { ArrowRight, CalendarCheck, CircleAlert } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin-session";
import { readPaging } from "@/lib/pagination";
import { listApplications } from "@/lib/applications-store";
import { formatPostedDate, todayInIndia } from "@/lib/careers-shared";
import { isApplicationStatus } from "@/lib/applications-validation";
import {
  ApplicationsList, applicantsHref, listHref, readColumns, readView, type ListFilters,
} from "../applications/applications-list";

export const metadata = { title: "Today's applications" };
export const dynamic = "force-dynamic";

const PATH = "/admin/todays-applications";

type Props = {
  searchParams: Promise<{
    q?: string; status?: string; page?: string; per?: string; view?: string;
    /** the table's column filters (c_name, c_email …) */
    [column: `c_${string}`]: string | undefined;
  }>;
};

/**
 * Only the applications that came in today (India time, from midnight), newest
 * first — with the same status tabs, search, Grid / Table views and table
 * filters as All applicants. It moves on to the new day by itself.
 */
export default async function TodaysApplicationsPage({ searchParams }: Props) {
  await requireAdmin("applications");
  const sp = await searchParams;
  const { q = "", status = "all", page: pageParam, per } = sp;
  const today = todayInIndia();

  const { page, pageSize } = readPaging(pageParam, per, 25);
  const view = readView(sp.view);
  const columns = view === "table" ? readColumns(sp) : undefined;
  const filters: ListFilters = {
    basePath: PATH,
    keep: view === "table" ? { view: "table" } : {},
    status: isApplicationStatus(status) ? status : "all",
    q,
    dates: { mode: "single", from: today, to: "" },
    pageSize,
    columns,
    lockDates: true,
  };

  const { items, total, counts, dbError } = await listApplications({
    status: filters.status, q, from: today, columns, page, pageSize,
  });
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total > 0 && page > pages) redirect(listHref(filters, { page: pages }));

  return (
    <>
      <PageHeader
        title="Today's applications"
        crumbs={[
          { label: "Careers", href: "/admin/careers" },
          { label: "Applications", href: "/admin/applications" },
          { label: "Today" },
        ]}
        description={`Applications received today, ${formatPostedDate(today)} (India time), newest first. Older ones are in All applicants.`}
        action={
          <Link
            href={applicantsHref("", undefined, view)}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
          >
            All applicants <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      {dbError && (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Could not read applications ({dbError}).</span>
        </div>
      )}

      {/* Today at a glance */}
      {!dbError && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-uk-line bg-uk-card p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-uk-blue/12 text-uk-blue">
            <CalendarCheck className="h-5 w-5" />
          </span>
          <p className="text-sm text-uk-body">
            <span className="font-heading text-2xl font-bold text-uk-heading">{counts.all}</span>{" "}
            {counts.all === 1 ? "application" : "applications"} today
            {counts.new > 0 && (
              <>
                {" · "}
                <span className="font-semibold text-uk-blue">{counts.new} still new</span>
              </>
            )}
          </p>
        </div>
      )}

      <ApplicationsList
        filters={filters}
        items={items}
        total={total}
        counts={counts}
        page={page}
        today={today}
        noneYet={false}
        dbError={dbError}
        view={view}
        viewSwitch
      />
    </>
  );
}
