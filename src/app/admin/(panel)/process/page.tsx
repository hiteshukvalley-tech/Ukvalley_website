import Link from "@/components/site/intent-link";
import { CircleAlert, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { listProcessStepsForAdmin } from "@/lib/process-store";
import { ImportButton } from "./import-button";
import { ProcessStepList } from "./sortable-list";
import { FlashToast } from "@/components/admin/toast";

export const metadata = { title: "Process" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; status?: string; saved?: string }> };

export default async function ProcessStepsAdminPage({ searchParams }: Props) {
  const { q = "", status = "all", saved } = await searchParams;
  const { items, dbError } = await listProcessStepsForAdmin();

  const needle = q.trim().toLowerCase();
  const filtered = items.filter((c) => {
    if (status === "published" && !c.published) return false;
    if (status === "draft" && c.published) return false;
    return !needle || `${c.title} ${c.duration} ${c.desc}`.toLowerCase().includes(needle);
  });
  // Reordering only makes sense against the full list, so lock it while filtering.
  const filtering = Boolean(needle) || status !== "all";
  const drafts = items.filter((c) => !c.published).length;

  return (
    <>
      <PageHeader
        title="Process"
        crumbs={[{ label: "Process" }]}
        description="The delivery steps shown on the home page, /process and /solutions, in this order. Step numbers (01, 02 …) follow the order automatically. Drag rows to reorder. Draft steps are hidden from the live site."
        action={
          <Link
            href="/admin/process/new"
            className="btn-sheen inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-4 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright"
          >
            <Plus className="h-4 w-4" /> Add step
          </Link>
        }
      />

      {saved === "created" && <FlashToast message="Step added. The live site is updating." />}
      {dbError && (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Could not read process steps ({dbError}). Changes will not save until the database is connected.</span>
        </div>
      )}

      {!dbError && items.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-uk-line bg-uk-card p-10 text-center">
          <h2 className="font-heading text-lg font-semibold text-uk-heading">No process steps in the database yet</h2>
          <p className="mx-auto mt-1 mb-5 max-w-lg text-sm text-uk-muted">
            The live site is showing its built-in process steps. Import them to edit, reorder or unpublish them here — the site will look identical until you change something.
          </p>
          <ImportButton />
        </section>
      ) : (
        <section className="rounded-2xl border border-uk-line bg-uk-card">
          <form method="get" className="flex flex-wrap items-center gap-3 border-b border-uk-line p-4">
            <label className="relative min-w-52 flex-1">
              <span className="sr-only">Search process steps</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-uk-muted" />
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search by title, duration or description"
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
              <Link href="/admin/process" className="text-sm text-uk-muted hover:text-uk-heading">Clear</Link>
            )}
          </form>

          <p className="border-b border-uk-line px-4 py-2 text-xs text-uk-muted">
            {filtered.length} of {items.length} process steps{drafts > 0 ? ` · ${drafts} draft${drafts === 1 ? "" : "s"}` : ""}
          </p>

          {filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-uk-muted">No process steps match your search.</p>
          ) : (
            <ProcessStepList
              // Re-mount from fresh server data after any save/refresh.
              key={filtered.map((c) => `${c.slug}:${c.published}:${c.title}`).join("|")}
              locked={filtering}
              initial={filtered.map((c) => ({
                slug: c.slug,
                title: c.title,
                subtitle: `${c.duration} · ${c.points.length} points`,
                published: c.published,
              }))}
            />
          )}
        </section>
      )}
    </>
  );
}
