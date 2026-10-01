import Link from "@/components/site/intent-link";
import { ChevronLeft, ChevronRight, CircleAlert, Search } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { MAX_FILES_PER_UPLOAD, MAX_FILE_BYTES, listMedia } from "@/lib/media-store";
import { MediaCard } from "./media-card";
import { UploadForm } from "./upload-form";

export const metadata = { title: "Media" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

type Props = { searchParams: Promise<{ q?: string; page?: string }> };

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export default async function MediaAdminPage({ searchParams }: Props) {
  const { q = "", page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const { items, total, totalBytes, dbError } = await listMedia({ q, page, pageSize: PAGE_SIZE });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const href = (p: number) => {
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `/admin/media?${qs}` : "/admin/media";
  };

  return (
    <>
      <PageHeader
        title="Media"
        crumbs={[{ label: "Media" }]}
        description="Upload images and copy their URL to use anywhere on the site. Files are stored in the database and served from /media/<id>."
      />

      {dbError && (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Could not read the media library ({dbError}). Uploads will not work until the database is connected.</span>
        </div>
      )}

      <UploadForm maxMb={MAX_FILE_BYTES / 1024 / 1024} maxFiles={MAX_FILES_PER_UPLOAD} />

      <section className="mt-8 rounded-2xl border border-uk-line bg-uk-card">
        <form method="get" className="flex flex-wrap items-center gap-3 border-b border-uk-line p-4">
          <label className="relative min-w-52 flex-1">
            <span className="sr-only">Search files</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-uk-muted" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search by file name"
              className="h-10 w-full rounded-lg border border-input bg-transparent pl-9 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </label>
          <button type="submit" className="h-10 rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading">
            Search
          </button>
          {q.trim() && <Link href="/admin/media" className="text-sm text-uk-muted hover:text-uk-heading">Clear</Link>}
        </form>

        {!dbError && total === 0 ? (
          <p className="p-10 text-center text-sm text-uk-muted">
            {q.trim() ? "No files match your search." : "No files yet. Upload your first image above."}
          </p>
        ) : (
          <>
            <p className="border-b border-uk-line px-4 py-2 text-xs text-uk-muted">
              {total} file{total === 1 ? "" : "s"}
              {q.trim() ? " found" : ` · ${formatSize(totalBytes)} used`}
            </p>
            <ul className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((m) => (
                <MediaCard
                  key={m.id}
                  item={{
                    id: m.id,
                    name: m.name,
                    sizeLabel: formatSize(m.size),
                    dateLabel: m.uploadedAt.toLocaleDateString("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }),
                  }}
                />
              ))}
            </ul>
            {pages > 1 && (
              <nav aria-label="Pagination" className="flex items-center justify-between gap-3 border-t border-uk-line p-4 text-sm">
                {page > 1 ? (
                  <Link href={href(page - 1)} className="inline-flex h-9 items-center gap-1 rounded-lg border border-uk-line px-3 text-uk-body hover:bg-uk-surface-2">
                    <ChevronLeft className="h-4 w-4" /> Newer
                  </Link>
                ) : <span />}
                <span className="text-uk-muted">Page {page} of {pages}</span>
                {page < pages ? (
                  <Link href={href(page + 1)} className="inline-flex h-9 items-center gap-1 rounded-lg border border-uk-line px-3 text-uk-body hover:bg-uk-surface-2">
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
