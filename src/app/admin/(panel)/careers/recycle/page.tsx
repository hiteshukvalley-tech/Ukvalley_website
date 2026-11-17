import Link from "@/components/site/intent-link";
import { ArrowLeft, CircleAlert, Recycle } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin-session";
import { listRecycledCareers } from "@/lib/careers-store";
import { RecycleActions } from "./recycle-actions";

export const metadata = { title: "Recycle openings" };
export const dynamic = "force-dynamic";

const deletedOn = (d: Date) => d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

/** Job openings deleted from Careers: restore one, or delete it for good. */
export default async function RecycleOpeningsPage() {
  await requireAdmin("careers");
  const { items, dbError } = await listRecycledCareers();
  const th = "whitespace-nowrap border-b border-uk-line px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-uk-muted";
  const td = "px-4 py-3 align-middle text-sm text-uk-body";

  return (
    <>
      <PageHeader
        title="Recycle openings"
        crumbs={[{ label: "Careers", href: "/admin/careers" }, { label: "Recycle openings" }]}
        description="Job openings deleted from Careers. Restore one to put it back in Careers as it was (published or draft), or delete it forever. Applications are kept either way."
        action={
          <Link
            href="/admin/careers"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
          >
            <ArrowLeft className="h-4 w-4" /> Job openings
          </Link>
        }
      />

      {dbError && (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Could not read deleted openings ({dbError}).</span>
        </div>
      )}

      <section className="rounded-2xl border border-uk-line bg-uk-card">
        <p className="border-b border-uk-line px-4 py-3 text-sm text-uk-body">
          <span className="font-semibold text-uk-heading">{items.length}</span> deleted {items.length === 1 ? "opening" : "openings"}
        </p>
        {items.length === 0 ? (
          <div className="p-10 text-center">
            <Recycle className="mx-auto h-8 w-8 text-uk-muted" />
            <h2 className="mt-2 font-heading text-lg font-semibold text-uk-heading">Nothing here</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-uk-muted">When you delete a job opening in Careers, it comes here so you can restore it later.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-sm">
              <thead>
                <tr>
                  <th scope="col" className={th}>Role</th>
                  <th scope="col" className={th}>Location · type</th>
                  <th scope="col" className={th}>Was</th>
                  <th scope="col" className={th}>Deleted</th>
                  <th scope="col" className={th}><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-uk-line">
                {items.map((c) => (
                  <tr key={c.id}>
                    <td className={td}>
                      <span className="font-semibold text-uk-heading">{c.role}</span>
                      <span className="block text-xs text-uk-muted">/careers/{c.slug}</span>
                    </td>
                    <td className={td}>{[c.location, c.type, c.mode].filter(Boolean).join(" · ")}</td>
                    <td className={td}>
                      <span
                        className={
                          c.published
                            ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                            : "rounded-full bg-uk-surface-3 px-2 py-0.5 text-xs font-semibold text-uk-muted"
                        }
                      >
                        {c.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className={td}>
                      <span className="whitespace-nowrap">{deletedOn(c.deletedAt)}</span>
                      {c.deletedBy && <span className="block text-xs text-uk-muted">by {c.deletedBy}</span>}
                    </td>
                    <td className={`${td} text-right`}>
                      <RecycleActions id={c.id} name={c.role} />
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
