import Link from "@/components/site/intent-link";
import { ArrowRight, CircleAlert } from "lucide-react";
import { requireAdmin } from "@/lib/admin-session";
import { PageHeader } from "@/components/admin/page-header";
import { EDITABLE_PAGES } from "@/lib/pages-schema";
import { getPagesForAdmin } from "@/lib/pages-store";

export const metadata = { title: "Page text" };
export const dynamic = "force-dynamic";

export default async function PagesAdminPage() {
  await requireAdmin();
  const { byKey, dbError } = await getPagesForAdmin();
  return (
    <>
      <PageHeader
        title="Page text"
        crumbs={[{ label: "Page text" }]}
        description="Change the hero text of any inner page and add extra blocks (text, image, button) to it. The home page, header and footer have their own editors; services, solutions, products, industries, blog and the other lists are edited in their own sections."
      />
      {dbError && (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Could not read saved content ({dbError}). Saving will not work until the database is connected.</span>
        </div>
      )}
      <ul className="grid gap-3 sm:grid-cols-2">
        {EDITABLE_PAGES.map((p) => {
          const saved = byKey[p.key];
          const c = saved?.content;
          const edits = c ? [c.heroEyebrow, c.heroTitle, c.heroDescription].filter(Boolean).length : 0;
          const blocks = c?.blocks.length ?? 0;
          return (
            <li key={p.key}>
              <Link
                href={`/admin/pages/${p.key}`}
                className="group flex items-center gap-4 rounded-2xl border border-uk-line bg-uk-card p-5 transition-colors hover:border-uk-blue/40"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-heading text-base font-semibold text-uk-heading">{p.label}</span>
                  <span className="mt-0.5 block text-xs text-uk-muted">{p.href}</span>
                  <span className="mt-1 block text-xs text-uk-muted">
                    {edits || blocks
                      ? `${edits ? `${edits} hero field${edits === 1 ? "" : "s"} changed` : "Original hero"}${blocks ? ` · ${blocks} extra block${blocks === 1 ? "" : "s"}` : ""}`
                      : "Original text"}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-uk-muted transition-transform group-hover:translate-x-0.5 group-hover:text-uk-blue" />
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
