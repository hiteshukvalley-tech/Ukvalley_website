import Link from "@/components/site/intent-link";
import { ArrowLeft, CircleAlert } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { FlashToast } from "@/components/admin/toast";
import { readPaging } from "@/lib/pagination";
import { listApplications } from "@/lib/applications-store";
import { getCareers } from "@/lib/careers-store";
import { todayInIndia } from "@/lib/careers-shared";
import { isApplicationStatus } from "@/lib/applications-validation";
import {
  APPLICANTS_PATH, ApplicationsList, applicantsHref, hasColumns, listHref, readColumns, readDates, readView, roleRows, type ListFilters,
} from "../applications-list";

export const metadata = { title: "Applicants" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    role?: string; q?: string; status?: string; mode?: string; from?: string; to?: string; date?: string; page?: string; per?: string; saved?: string; view?: string;
    /** the table's column filters (c_name, c_email …) */
    [column: `c_${string}`]: string | undefined;
  }>;
};

const chip = (active: boolean) =>
  active
    ? "inline-flex h-9 items-center gap-2 rounded-lg bg-uk-blue/15 px-3 text-sm font-semibold text-uk-blue"
    : "inline-flex h-9 items-center gap-2 rounded-lg border border-uk-line px-3 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading";

/**
 * Every applicant, or one job role's: a role picker on top, then the same
 * status, date and search filters as the Job applications page.
 */
export default async function ApplicantsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { q = "", status = "all", page: pageParam, per, saved } = sp;
  const role = (sp.role ?? "").trim().slice(0, 100);

  const { page, pageSize } = readPaging(pageParam, per, 25);
  const dates = readDates(sp);
  const view = readView(sp.view);
  const keep: Record<string, string> = {};
  if (role) keep.role = role;
  if (view === "table") keep.view = "table";
  // The column filters live in the table's header, so they only apply in the table view.
  const columns = view === "table" ? readColumns(sp) : undefined;
  const filters: ListFilters = {
    basePath: APPLICANTS_PATH,
    keep,
    status: isApplicationStatus(status) ? status : "all",
    q,
    dates,
    pageSize,
    columns,
  };

  const [{ items, total, counts, roles, dbError }, careers] = await Promise.all([
    listApplications({ status: filters.status, position: role || undefined, q, from: dates.from, to: dates.to, columns, page, pageSize }),
    getCareers(),
  ]);
  const rows = roleRows(roles, careers);
  const allCount = roles.reduce((n, r) => n + r.total, 0);
  // The role's spelling as shown in the table, if it differs only in case.
  const title = role ? (rows.find((r) => r.position.toLowerCase() === role.toLowerCase())?.position ?? role) : "All applicants";

  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total > 0 && page > pages) redirect(listHref(filters, { page: pages }));

  return (
    <>
      <PageHeader
        title={title}
        crumbs={[
          { label: "Careers", href: "/admin/careers" },
          { label: "Applications", href: "/admin/applications" },
          { label: role ? title : "All applicants" },
        ]}
        description={
          role
            ? `Applications for ${title}, newest first. Pick another role above the list, or All roles to see everyone.`
            : "Every applicant for every role, newest first. Pick a role to see only its applications."
        }
        action={
          <Link
            href="/admin/applications"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
          >
            <ArrowLeft className="h-4 w-4" /> Job applications
          </Link>
        }
      />

      {saved === "deleted" && <FlashToast message="Application deleted." />}
      {dbError && (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Could not read applications ({dbError}).</span>
        </div>
      )}

      {/* Role picker: all applicants, or one job role's */}
      <nav aria-label="Job role" className="mb-6 rounded-2xl border border-uk-line bg-uk-card p-3">
        <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-uk-muted">Job role</p>
        <div className="flex flex-wrap gap-1.5">
          <Link href={applicantsHref("", dates, view)} aria-current={!role ? "page" : undefined} className={chip(!role)}>
            All roles
            <span className="rounded-full bg-uk-surface-3 px-2 py-0.5 text-[0.7rem] font-semibold text-uk-body">{allCount}</span>
          </Link>
          {rows.map((r) => {
            const active = role.toLowerCase() === r.position.toLowerCase();
            return (
              <Link key={r.position} href={applicantsHref(r.position, dates, view)} aria-current={active ? "page" : undefined} className={chip(active)}>
                {r.position}
                <span className="rounded-full bg-uk-surface-3 px-2 py-0.5 text-[0.7rem] font-semibold text-uk-body">{r.total}</span>
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
        showPosition={!role}
        view={view}
        viewSwitch
      />
    </>
  );
}
