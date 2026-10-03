import { CircleAlert, ExternalLink, FileText, LayoutPanelTop } from "lucide-react";
import Link from "@/components/site/intent-link";
import { PageHeader } from "@/components/admin/page-header";
import { hasDatabaseUrl } from "@/lib/db/client";
import { EDITABLE_PAGES } from "@/lib/pages-schema";
import { readTextOverrides } from "@/lib/texts-store";
import { describePath, groupByName, groupBySlug, isScanPath, listScanPaths, scanPage, type PathGroup } from "./scan";
import { ResetAllButton, TextsEditor, type TextRow } from "./texts-editor";

/** Changes whenever what the page shows changes, so the editor starts fresh after a save. */
function rowsKey(rows: TextRow[]): string {
  let h = 5381;
  for (const r of rows) for (let i = 0; i < r.current.length; i++) h = ((h << 5) + h + r.current.charCodeAt(i)) | 0;
  return `${rows.length}:${h}`;
}

async function loadOverrides() {
  if (!hasDatabaseUrl()) return { overrides: [] as { o: string; r: string }[], dbError: "MONGODB_URI is not set." };
  try {
    return { overrides: await readTextOverrides(), dbError: undefined };
  } catch (e) {
    return { overrides: [], dbError: e instanceof Error ? e.message : "Could not read saved texts." };
  }
}

const DbBanner = ({ error }: { error?: string }) =>
  error ? (
    <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <span>Could not read saved edits ({error}). Saving will not work until the database is connected.</span>
    </div>
  ) : null;

function PageList({ groups, showHeadings }: { groups: PathGroup[]; showHeadings: boolean }) {
  return (
    <div className="space-y-10">
      {groups.map((g) => {
        const slug = groupByName(g.group)?.slug ?? "added";
        return (
          <section key={g.group}>
            {showHeadings && (
              <h2 className="mb-3 font-heading text-lg font-bold text-uk-heading">
                {g.group} <span className="text-sm font-medium text-uk-muted">· {g.entries.length} page{g.entries.length === 1 ? "" : "s"}</span>
              </h2>
            )}
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {g.entries.map((p) => (
                <li key={p.path}>
                  <Link
                    href={`/admin/texts/${slug}?path=${encodeURIComponent(p.path)}`}
                    className="flex items-center gap-3 rounded-xl border border-uk-line bg-uk-card px-4 py-3 text-sm transition-colors hover:border-uk-blue/40"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-uk-blue" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-uk-heading">{p.label}</span>
                      <span className="block truncate text-xs text-uk-muted">{p.tag}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/**
 * The text editor area. `group` = one website section (its pages, or one page
 * of it when `path` is given); no group = every section.
 */
export async function TextsView({ group, path, q }: { group?: string; path?: string; q?: string }) {
  const { overrides, dbError } = await loadOverrides();
  const section = group ? groupBySlug(group) : undefined;

  // ── one page ──
  if (path && isScanPath(path)) {
    const [{ items, error }, info] = await Promise.all([scanPage(path), describePath(path)]);
    const pageName = info?.label ?? "This page";
    const byR = new Map<string, string>();
    for (const x of overrides) if (x.r !== x.o && !byR.has(x.r)) byR.set(x.r, x.o);
    const byO = new Map(overrides.map((x) => [x.o, x.r]));

    const rows: TextRow[] = items.map((it, i) => {
      const edited = byR.has(it.value);
      const original = edited ? byR.get(it.value)! : it.value;
      const stuck = !edited && byO.has(it.value) && byO.get(it.value) !== it.value;
      return {
        id: `${i}`, kind: it.kind, region: it.region, role: it.role, count: it.count,
        sectionKey: it.region === "Page" ? `p${it.sectionId}` : it.region,
        sectionTitle: it.sectionTitle, cardId: it.cardId, cardTitle: it.cardTitle,
        original, current: it.value, edited, stuckOverride: stuck ? byO.get(it.value)! : undefined,
      };
    });
    const blocksKey = EDITABLE_PAGES.find((p) => p.href === path)?.key;
    const listHref = section ? `/admin/texts/${section.slug}` : "/admin/texts";

    return (
      <>
        <PageHeader
          title={pageName}
          crumbs={[
            ...(section ? [{ label: section.name, href: listHref }] : [{ label: "All pages", href: "/admin/texts" }]),
            { label: pageName === section?.name ? `${pageName} page` : pageName },
          ]}
          description="Everything on this page, organised by section: open a section to edit its text, buttons and images (cards are grouped inside their section). Save, and the page is checked to confirm each change is really showing."
          action={
            <div className="flex flex-wrap items-center gap-2">
              {blocksKey && (
                <Link
                  href={`/admin/pages/${blocksKey}`}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-uk-line bg-uk-card px-3 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
                >
                  <LayoutPanelTop className="h-3.5 w-3.5" /> Add extra blocks
                </Link>
              )}
              <Link
                href={path}
                target="_blank"
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-uk-line bg-uk-card px-3 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
              >
                View page <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          }
        />
        <DbBanner error={dbError} />
        {error ? (
          <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
        ) : (
          <TextsEditor key={`${rowsKey(rows)}|${q ?? ""}`} path={path} rows={rows} initialQuery={q} />
        )}
      </>
    );
  }

  // ── list of pages ──
  const all = await listScanPaths();
  const groups = section ? all.filter((g) => g.group === section.name) : all;
  return (
    <>
      <PageHeader
        title={section ? `${section.name} — pages` : "All pages"}
        crumbs={section ? [{ label: section.name }] : [{ label: "All pages" }]}
        description={
          section
            ? `Every ${section.name.toLowerCase()} page. Open one to edit its text, buttons and images, section by section.`
            : "Every page of the website, by menu section. The home page has its own editor; the header menu and footer are under Site layout."
        }
        action={section ? undefined : <ResetAllButton />}
      />
      <DbBanner error={dbError} />
      {groups.length === 0 ? (
        <p className="rounded-2xl border border-uk-line bg-uk-card p-10 text-center text-sm text-uk-muted">No pages here yet.</p>
      ) : (
        <PageList groups={groups} showHeadings={!section} />
      )}
    </>
  );
}
