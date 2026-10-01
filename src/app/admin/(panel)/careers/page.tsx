import Link from "@/components/site/intent-link";
import { CircleAlert, CircleCheck, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { listCareersForAdmin } from "@/lib/careers-store";
import { ImportButton } from "./import-button";
import { CareerList } from "./sortable-list";

export const metadata = { title: "Careers" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; status?: string; saved?: string }> };

export default async function CareersAdminPage({ searchParams }: Props) {
  const { q = "", status = "all", saved } = await searchParams;
  const { items, dbError } = await listCareersForAdmin();

  const needle = q.trim().toLowerCase();
  const filtered = items.filter((c) => {
    if (status === "published" && !c.published) return false;
    if (status === "draft" && c.published) return false;
    return !needle || `${c.role} ${c.slug} ${c.location} ${c.type}`.toLowerCase().includes(needle);
  });
  // Reordering only makes sense against the full list, so lock it while filtering.
  const filtering = Boolean(needle) || status !== "all";
  const drafts = items.filter((c) => !c.published).length;

  return (
    <>
      <PageHeader
        title="Careers"
        crumbs={[{ label: "Careers" }]}
        description="Open roles listed on /careers and the Team page, in this order. Drag rows to reorder. Draft roles are hidden from the live site."
        action={
          <Link
            href="/admin/careers/new"
            className="btn-sheen inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-4 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright"
          >
            <Plus className="h-4 w-4" /> Add role
          </Link>
        }
      />

      {saved === "created" && (
        <div role="status" className="mb-6 flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" /> Role created. The live site is updating.
        </div>
      )}
      {dbError && (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Could not read open roles ({dbError}). Changes will not save until the database is connected.</span>
        </div>
      )}

      {!dbError && items.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-uk-line bg-uk-card p-10 text-center">
          <h2 className="font-heading text-lg font-semibold text-uk-heading">No open roles in the database yet</h2>
          <p className="mx-auto mt-1 mb-5 max-w-lg text-sm text-uk-muted">
            The live site is showing its built-in open roles. Import them to edit, reorder or unpublish them here — the site will look identical until you change something.
          </p>
          <ImportButton />
        </section>
      ) : (
        <section className="rounded-2xl border border-uk-line bg-uk-card">
          <form method="get" className="flex flex-wrap items-center gap-3 border-b border-uk-line p-4">
            <label className="relative min-w-52 flex-1">
              <span className="sr-only">Search open roles</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-uk-muted" />
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search by role, location or type"
                className="h-10 w-full rounded-lg border border-input bg-transparent pl-9 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </label>
            <label>
              <span className="sr-only">Filter by status</span>
              <select
                name="status"
                defaultValue={status}
                className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring"
              >
                <option value="all" className="bg-uk-card">All statuses</option>
                <option value="published" className="bg-uk-card">Published</option>
                <option value="draft" className="bg-uk-card">Draft</option>
              </select>
            </label>
            <button type="submit" className="h-10 rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading">
              Apply
            </button>
            {filtering && (
              <Link href="/admin/careers" className="text-sm text-uk-muted hover:text-uk-heading">Clear</Link>
            )}
          </form>

          <p className="border-b border-uk-line px-4 py-2 text-xs text-uk-muted">
            {filtered.length} of {items.length} open roles{drafts > 0 ? ` · ${drafts} draft${drafts === 1 ? "" : "s"}` : ""}
          </p>

          {filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-uk-muted">No open roles match your search.</p>
          ) : (
            <CareerList
              // Re-mount from fresh server data after any save/refresh.
              key={filtered.map((c) => `${c.slug}:${c.published}:${c.role}`).join("|")}
              locked={filtering}
              initial={filtered.map((c) => ({
                slug: c.slug,
                title: c.role,
                type: c.type,
                location: c.location,
                published: c.published,
              }))}
            />
          )}
        </section>
      )}
    </>
  );
}
