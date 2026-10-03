import Link from "@/components/site/intent-link";
import { ChevronLeft, ChevronRight, CircleAlert, FileText, Search, X } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { FlashToast } from "@/components/admin/toast";
import { listApplications } from "@/lib/applications-store";
import { getCareers } from "@/lib/careers-store";
import { APPLICATION_STATUSES, applicationStatusLabel, isApplicationStatus } from "@/lib/applications-validation";
import { ApplicationStatusBadge, formatApplicationDate } from "./application-ui";

export const metadata = { title: "Job applications" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

type Props = { searchParams: Promise<{ q?: string; status?: string; role?: string; page?: string; saved?: string }> };

export default async function ApplicationsAdminPage({ searchParams }: Props) {
  const { q = "", status = "all", role = "", page: pageParam, saved } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const activeStatus = isApplicationStatus(status) ? status : "all";

  const [{ items, total, counts, roles, dbError }, careers] = await Promise.all([
    listApplications({ status: activeStatus, position: role, q, page, pageSize: PAGE_SIZE }),
    // The roles the Careers page shows (built-in ones until roles are imported).
    getCareers(),
  ]);

  // Every open role is listed, even with no applications yet, followed by
  // any other positions people typed in.
  const byKey = new Map(roles.map((r) => [r.position.toLowerCase(), r]));
  const summary = [
    ...careers
      .map((c) => {
        const r = byKey.get(c.role.toLowerCase());
        return { position: c.role, open: true, total: r?.total ?? 0, new: r?.new ?? 0, latest: r?.latest ?? null };
      }),
    ...roles
      .filter((r) => !careers.some((c) => c.role.toLowerCase() === r.position.toLowerCase()))
      .map((r) => ({ ...r, open: false })),
  ];
  const grandTotal = roles.reduce((n, r) => n + r.total, 0);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  /** Link to this page with some filters changed; `null` clears one. */
  const href = (over: { status?: string; role?: string | null; q?: string | null; page?: number }) => {
    const p = new URLSearchParams();
    const s = over.status ?? activeStatus;
    const r = over.role === null ? "" : (over.role ?? role);
    const search = over.q === null ? "" : (over.q ?? q).trim();
    if (r) p.set("role", r);
    if (s !== "all") p.set("status", s);
    if (search) p.set("q", search);
    if (over.page && over.page > 1) p.set("page", String(over.page));
    const qs = p.toString();
    return qs ? `/admin/applications?${qs}` : "/admin/applications";
  };

  const tabs = [{ key: "all", label: "All" }, ...APPLICATION_STATUSES.map((s) => ({ key: s, label: applicationStatusLabel[s] }))] as const;

  return (
    <>
      <PageHeader
        title="Job applications"
        crumbs={[{ label: "Careers", href: "/admin/careers" }, { label: "Applications" }]}
        description="Applications sent from the Apply buttons on the Careers page, newest first. Open one to read it, download the resume, set its status and add notes."
      />

      {saved === "deleted" && <FlashToast message="Application deleted." />}
      {dbError && (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Could not read applications ({dbError}). Until the database is connected, the Careers form can&apos;t accept applications.</span>
        </div>
      )}

      {/* Applications per job role */}
      <section className="mb-6 rounded-2xl border border-uk-line bg-uk-card">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-uk-line px-4 py-3">
          <h2 className="font-heading text-base font-semibold text-uk-heading">Applications by role</h2>
          <span className="text-sm text-uk-muted">{grandTotal} total</span>
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
                {summary.map((r) => {
                  const active = role.toLowerCase() === r.position.toLowerCase();
                  return (
                    <tr key={r.position} className={active ? "bg-uk-blue/5" : undefined}>
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
                          <Link href={href({ role: r.position, status: "all", page: 1 })} className="text-sm font-medium text-uk-blue hover:underline">
                            {active ? "Showing" : "View"}
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-uk-line bg-uk-card">
        {role && (
          <div className="flex flex-wrap items-center gap-2 border-b border-uk-line px-4 py-3 text-sm">
            <span className="text-uk-muted">Role:</span>
            <span className="font-semibold text-uk-heading">{role}</span>
            <Link href={href({ role: null, page: 1 })} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-uk-muted hover:bg-uk-surface-2 hover:text-uk-heading">
              <X className="h-3.5 w-3.5" /> All roles
            </Link>
          </div>
        )}
        <div className="flex flex-wrap gap-1.5 border-b border-uk-line p-3" role="tablist" aria-label="Filter by status">
          {tabs.map((t) => {
            const active = activeStatus === t.key;
            return (
              <Link
                key={t.key}
                href={href({ status: t.key, page: 1 })}
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
          {role && <input type="hidden" name="role" value={role} />}
          {activeStatus !== "all" && <input type="hidden" name="status" value={activeStatus} />}
          <label className="relative min-w-52 flex-1">
            <span className="sr-only">Search applications</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-uk-muted" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search by name, email, phone, location or position"
              className="h-10 w-full rounded-lg border border-input bg-transparent pl-9 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </label>
          <button type="submit" className="h-10 rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading">
            Search
          </button>
          {q.trim() && (
            <Link href={href({ q: null, page: 1 })} className="text-sm text-uk-muted hover:text-uk-heading">
              Clear
            </Link>
          )}
        </form>

        {!dbError && grandTotal === 0 ? (
          <div className="p-10 text-center">
            <h2 className="font-heading text-lg font-semibold text-uk-heading">No applications yet</h2>
            <p className="mx-auto mt-1 max-w-lg text-sm text-uk-muted">
              When someone applies from the Careers page, the application appears here and HR gets an email.
            </p>
          </div>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-sm text-uk-muted">{dbError ? "No data." : "No applications match these filters."}</p>
        ) : (
          <>
            <p className="border-b border-uk-line px-4 py-2 text-xs text-uk-muted">
              Showing {(page - 1) * PAGE_SIZE + 1}–{(page - 1) * PAGE_SIZE + items.length} of {total}
            </p>
            <ul className="divide-y divide-uk-line">
              {items.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/admin/applications/${a.id}`}
                    className="flex flex-wrap items-start justify-between gap-3 px-4 py-4 transition-colors hover:bg-uk-surface-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`truncate text-sm text-uk-heading ${a.status === "new" ? "font-bold" : "font-semibold"}`}>{a.name}</span>
                        <ApplicationStatusBadge status={a.status} />
                      </div>
                      <p className="mt-0.5 text-sm font-medium text-uk-body">{a.position}</p>
                      <p className="mt-0.5 truncate text-xs text-uk-muted">
                        {a.email} · {a.phone} · {a.location} · {a.experience}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-uk-muted">
                      <span>{formatApplicationDate(a.createdAt)}</span>
                      <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> Resume</span>
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
