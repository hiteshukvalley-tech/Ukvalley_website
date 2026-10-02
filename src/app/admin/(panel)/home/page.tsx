import Link from "@/components/site/intent-link";
import { ArrowRight, CircleAlert, ExternalLink, Eye, EyeOff } from "lucide-react";
import { requireAdmin } from "@/lib/admin-session";
import { PageHeader } from "@/components/admin/page-header";
import { HOME_SECTIONS } from "@/lib/home-schema";
import { getHomeForAdmin } from "@/lib/home-store";

export const metadata = { title: "Home page" };
export const dynamic = "force-dynamic";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

export default async function HomeSectionsPage() {
  await requireAdmin();
  const { page, updated, dbError } = await getHomeForAdmin();
  const hidden = HOME_SECTIONS.filter((s) => !page.visible[s.key]).length;

  return (
    <>
      <PageHeader
        title="Home page"
        crumbs={[{ label: "Home page" }]}
        description={`Edit every section of the home page, in the order visitors see them. ${HOME_SECTIONS.length} sections${hidden ? `, ${hidden} hidden` : ""}.`}
        action={
          <Link
            href="/"
            target="_blank"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-uk-line bg-uk-card px-3 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
          >
            View home page <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        }
      />
      {dbError && (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Showing the original text — could not read saved content ({dbError}). Saving will not work until the database is connected.</span>
        </div>
      )}

      <ol className="space-y-3">
        {HOME_SECTIONS.map((s, i) => {
          const shown = page.visible[s.key];
          const savedAt = updated[s.key];
          return (
            <li key={s.key}>
              <Link
                href={`/admin/home/${s.key}`}
                className="group flex items-center gap-4 rounded-2xl border border-uk-line bg-uk-card p-5 transition-colors hover:border-uk-blue/40"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-uk-blue/10 font-heading text-sm font-bold text-uk-blue">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-heading text-base font-semibold text-uk-heading">{s.label}</span>
                    <span
                      className={
                        shown
                          ? "inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300"
                          : "inline-flex items-center gap-1 rounded-full bg-uk-surface-3 px-2 py-0.5 text-[11px] font-semibold text-uk-muted"
                      }
                    >
                      {shown ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {shown ? "Shown" : "Hidden"}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-sm text-uk-muted">{s.description}</span>
                  <span className="mt-1 block text-xs text-uk-muted">
                    {savedAt ? `Last saved ${fmt(savedAt)}` : "Original text"}
                    {s.managedBy && ` · Cards: ${s.managedBy.map((m) => m.label).join(", ")}`}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-uk-muted transition-transform group-hover:translate-x-0.5 group-hover:text-uk-blue" />
              </Link>
            </li>
          );
        })}
      </ol>
    </>
  );
}
