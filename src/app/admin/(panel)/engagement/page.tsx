import Link from "@/components/site/intent-link";
import { CircleAlert, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { listEngagementModelsForAdmin } from "@/lib/engagement-store";
import { ImportButton } from "./import-button";
import { EngagementModelList } from "./sortable-list";
import { FlashToast } from "@/components/admin/toast";

export const metadata = { title: "Engagement" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; status?: string; saved?: string }> };

export default async function EngagementModelsAdminPage({ searchParams }: Props) {
  const { q = "", status = "all", saved } = await searchParams;
  const { items, dbError } = await listEngagementModelsForAdmin();

  const needle = q.trim().toLowerCase();
  const filtered = items.filter((c) => {
    if (status === "published" && !c.published) return false;
    if (status === "draft" && c.published) return false;
    return !needle || `${c.name} ${c.best} ${c.desc}`.toLowerCase().includes(needle);
  });
  // Reordering only makes sense against the full list, so lock it while filtering.
  const filtering = Boolean(needle) || status !== "all";
  const drafts = items.filter((c) => !c.published).length;

  return (
    <>
      <PageHeader
        title="Engagement"
        crumbs={[{ label: "Engagement" }]}
        description="Ways to work with Ukvalley, shown on the home page, /engagement and /pricing, in this order. Drag rows to reorder. Draft models are hidden from the live site."
        action={
          <Link
            href="/admin/engagement/new"
            className="btn-sheen inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-4 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright"
          >
            <Plus className="h-4 w-4" /> Add model
          </Link>
        }
      />

      {saved === "created" && <FlashToast message="Model added. The live site is updating." />}
      {dbError && (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Could not read engagement models ({dbError}). Changes will not save until the database is connected.</span>
        </div>
      )}

      {!dbError && items.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-uk-line bg-uk-card p-10 text-center">
          <h2 className="font-heading text-lg font-semibold text-uk-heading">No engagement models in the database yet</h2>
          <p className="mx-auto mt-1 mb-5 max-w-lg text-sm text-uk-muted">
            The live site is showing its built-in engagement models. Import them to edit, reorder or unpublish them here — the site will look identical until you change something.
          </p>
          <ImportButton />
        </section>
      ) : (
        <section className="rounded-2xl border border-uk-line bg-uk-card">
          <form method="get" className="flex flex-wrap items-center gap-3 border-b border-uk-line p-4">
            <label className="relative min-w-52 flex-1">
              <span className="sr-only">Search engagement models</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-uk-muted" />
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search by name, best-for or description"
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
              <Link href="/admin/engagement" className="text-sm text-uk-muted hover:text-uk-heading">Clear</Link>
            )}
          </form>

          <p className="border-b border-uk-line px-4 py-2 text-xs text-uk-muted">
            {filtered.length} of {items.length} engagement models{drafts > 0 ? ` · ${drafts} draft${drafts === 1 ? "" : "s"}` : ""}
          </p>

          {filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-uk-muted">No engagement models match your search.</p>
          ) : (
            <EngagementModelList
              // Re-mount from fresh server data after any save/refresh.
              key={filtered.map((c) => `${c.slug}:${c.published}:${c.name}`).join("|")}
              locked={filtering}
              initial={filtered.map((c) => ({
                slug: c.slug,
                title: c.name,
                subtitle: c.best,
                published: c.published,
              }))}
            />
          )}
        </section>
      )}
    </>
  );
}
