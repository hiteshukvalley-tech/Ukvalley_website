import Link from "@/components/site/intent-link";
import { CircleAlert, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { listPostsForAdmin } from "@/lib/blog-store";
import { ImportButton } from "./import-button";
import { SortableList } from "./sortable-list";
import { FlashToast } from "@/components/admin/toast";

export const metadata = { title: "Blog" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; status?: string; saved?: string }> };

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default async function BlogAdminPage({ searchParams }: Props) {
  const { q = "", status = "all", saved } = await searchParams;
  const { items, dbError } = await listPostsForAdmin();

  const needle = q.trim().toLowerCase();
  const filtered = items.filter((p) => {
    if (status === "published" && !p.published) return false;
    if (status === "draft" && p.published) return false;
    return !needle || `${p.title} ${p.slug} ${p.category} ${p.excerpt}`.toLowerCase().includes(needle);
  });
  const filtering = Boolean(needle) || status !== "all";
  const drafts = items.filter((p) => !p.published).length;

  return (
    <>
      <PageHeader
        title="Blog"
        crumbs={[{ label: "Blog" }]}
        description="Articles shown on the home page and /blog, in this order — the first is featured. Drag rows to reorder. Draft posts are hidden from the live site."
        action={
          <Link
            href="/admin/blog/new"
            className="btn-sheen inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-4 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright"
          >
            <Plus className="h-4 w-4" /> Add post
          </Link>
        }
      />

      {saved === "created" && <FlashToast message="Post created. The live site is updating." />}
      {dbError && (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Could not read posts ({dbError}). Changes will not save until the database is connected.</span>
        </div>
      )}

      {!dbError && items.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-uk-line bg-uk-card p-10 text-center">
          <h2 className="font-heading text-lg font-semibold text-uk-heading">No posts in the database yet</h2>
          <p className="mx-auto mt-1 mb-5 max-w-lg text-sm text-uk-muted">
            The live site is showing its built-in articles. Import them to edit, unpublish or delete them here — the site will look identical until you change something.
          </p>
          <ImportButton />
        </section>
      ) : (
        <section className="rounded-2xl border border-uk-line bg-uk-card">
          <form method="get" className="flex flex-wrap items-center gap-3 border-b border-uk-line p-4">
            <label className="relative min-w-52 flex-1">
              <span className="sr-only">Search posts</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-uk-muted" />
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search by title, slug, category or summary"
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
              <Link href="/admin/blog" className="text-sm text-uk-muted hover:text-uk-heading">Clear</Link>
            )}
          </form>

          <p className="border-b border-uk-line px-4 py-2 text-xs text-uk-muted">
            {filtered.length} of {items.length} posts{drafts > 0 ? ` · ${drafts} draft${drafts === 1 ? "" : "s"}` : ""}
          </p>

          {filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-uk-muted">No posts match your search.</p>
          ) : (
            <SortableList
              // Re-mount from fresh server data after any save/refresh.
              key={filtered.map((p) => `${p.slug}:${p.published}:${p.title}:${p.date}`).join("|")}
              locked={filtering}
              initial={filtered.map((p) => ({
                slug: p.slug,
                title: p.title,
                category: p.category,
                date: fmtDate(p.date),
                readTime: p.readTime,
                published: p.published,
              }))}
            />
          )}
        </section>
      )}
    </>
  );
}
