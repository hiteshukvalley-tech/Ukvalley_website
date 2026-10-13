import Link from "@/components/site/intent-link";
import { CircleAlert, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { FlashToast } from "@/components/admin/toast";
import { listApplications } from "@/lib/applications-store";
import { getCareers } from "@/lib/careers-store";
import { todayInIndia } from "@/lib/careers-shared";
import { formatApplicationDate } from "./application-ui";
import { applicantsHref, datesLabel, readDates, roleRows } from "./applications-list";
import { DateBoxes, DateModeSwitch } from "./date-filter";

export const metadata = { title: "Job applications" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ role?: string; mode?: string; from?: string; to?: string; date?: string; saved?: string }>;
};

/**
 * Overview: how many applications each role has (for the chosen date or
 * range). The applicants themselves are listed on the Applicants page.
 */
export default async function ApplicationsAdminPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { role, saved } = sp;
  const dates = readDates(sp);
  // Old links that filtered this page by role now open the applicants page for that role.
  if (role?.trim()) redirect(applicantsHref(role.trim(), dates));

  const [{ counts, roles, dbError }, careers] = await Promise.all([
    // Only the counts are used here, so fetch a single row.
    listApplications({ from: dates.from, to: dates.to, pageSize: 1 }),
    // The roles the Careers page shows (built-in ones until roles are imported).
    getCareers(),
  ]);

  const summary = roleRows(roles, careers);
  const grandTotal = roles.reduce((n, r) => n + r.total, 0);

  return (
    <>
      <PageHeader
        title="Job applications"
        crumbs={[{ label: "Careers", href: "/admin/careers" }, { label: "Applications" }]}
        description="How many applications each role has received. Pick a date or a date range to count only those days; open a role (or all applicants) to see the people who applied."
      />

      {saved === "deleted" && <FlashToast message="Application deleted." />}
      {dbError && (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Could not read applications ({dbError}). Until the database is connected, the Careers form can&apos;t accept applications.</span>
        </div>
      )}

      {/* Date filter type above the table; the date boxes sit in its header */}
      <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
        <span className="text-sm text-uk-muted">Filter by</span>
        <DateModeSwitch mode={dates.mode} from={dates.from} to={dates.to} />
      </div>

      {/* Applications per job role */}
      <section className="rounded-2xl border border-uk-line bg-uk-card">
        <div className="flex flex-wrap items-center gap-2 border-b border-uk-line p-3">
          <h2 className="px-1 font-heading text-base font-semibold text-uk-heading">Applications by role</h2>
          <DateBoxes mode={dates.mode} from={dates.from} to={dates.to} max={todayInIndia()} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-uk-line px-4 py-3">
          <p className="text-sm text-uk-body">
            <span className="font-semibold text-uk-heading">{grandTotal}</span> {grandTotal === 1 ? "application" : "applications"}
            {dates.from ? (
              <>
                {" "}{dates.to ? "from" : "on"} <span className="font-semibold text-uk-heading">{datesLabel(dates)}</span>
              </>
            ) : (
              " in total"
            )}
            {counts.new > 0 && <span className="text-uk-muted"> · {counts.new} new</span>}
          </p>
          <Link
            href={applicantsHref("", dates)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-uk-blue px-3 text-sm font-semibold text-uk-white transition-colors hover:bg-uk-blue-bright"
          >
            <Users className="h-4 w-4" /> View all applicants
          </Link>
        </div>
        {summary.length === 0 ? (
          <p className="p-6 text-center text-sm text-uk-muted">No open roles or applications yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="border-b border-uk-line text-left text-xs uppercase tracking-wide text-uk-muted">
                  <th className="px-4 py-2 font-medium">Role</th>
                  <th className="px-4 py-2 text-right font-medium">Applications</th>
                  <th className="px-4 py-2 text-right font-medium">New</th>
                  <th className="px-4 py-2 font-medium">Latest</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-uk-line">
                {summary.map((r) => (
                  <tr key={r.position}>
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-uk-heading">{r.position}</span>
                      {!r.open && <span className="ml-2 text-xs text-uk-muted">(not an open role)</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-uk-heading">{r.total}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {r.new > 0 ? <span className="rounded-full bg-uk-blue/15 px-2 py-0.5 text-xs font-semibold text-uk-blue">{r.new}</span> : <span className="text-uk-muted">0</span>}
                    </td>
                    <td className="px-4 py-2.5 text-uk-muted">{r.latest ? formatApplicationDate(r.latest) : "—"}</td>
                    <td className="px-4 py-2.5 text-right">
                      {r.total > 0 && (
                        <Link href={applicantsHref(r.position, dates)} className="text-sm font-medium text-uk-blue hover:underline">
                          View
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
