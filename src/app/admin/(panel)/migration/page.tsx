import Link from "@/components/site/intent-link";
import { CircleAlert, CircleCheck, Info } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { requireRole } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import { getMigrationStatus, type SectionStatus } from "@/lib/migration";
import { ImportAllButton, ImportRowButton } from "./migrate-buttons";

export const metadata = { title: "Migration" };
export const dynamic = "force-dynamic";

// Content that still lives only in code. It has no admin page, so it changes
// with a code edit and a redeploy.
const STILL_IN_CODE = [
  "Home-page numbers (hero stats, “by the numbers”) and client logos",
  "Principles and values on /about and /why-ukvalley",
  "Office addresses on /contact",
  "Header and footer menus",
  "The grouped /faq page and PDF reports",
];

export default async function MigrationPage() {
  await requireRole("admin");

  let sections: SectionStatus[] = [];
  let dbError: string | undefined;
  if (!hasDatabaseUrl()) {
    dbError = "MONGODB_URI is not set.";
  } else {
    try {
      sections = await getMigrationStatus();
    } catch (e) {
      dbError = e instanceof Error ? e.message : "Could not read the database.";
    }
  }

  const pending = sections.filter((s) => s.state === "pending");
  const total = sections.length;

  return (
    <>
      <PageHeader
        title="Migration"
        crumbs={[{ label: "Migration" }]}
        description="Move the website's built-in content into the database so you can edit all of it from this panel. Until a section is imported, the live site keeps showing its built-in copy — so importing changes nothing visible."
      />

      {dbError ? (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Can&apos;t check the database ({dbError}). Connect it to import content.</span>
        </div>
      ) : (
        <>
          <section className="mb-6 rounded-2xl border border-uk-line bg-uk-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-lg font-semibold text-uk-heading">
                  {pending.length === 0 ? "All content is in the database" : `${total - pending.length} of ${total} sections imported`}
                </h2>
                <p className="mt-1 max-w-xl text-sm text-uk-muted">
                  Importing is safe to repeat: a section that already has content is skipped, never overwritten or duplicated.
                </p>
              </div>
              <ImportAllButton pendingCount={pending.length} />
            </div>
          </section>

          <section className="rounded-2xl border border-uk-line bg-uk-card">
            <ul className="divide-y divide-uk-line">
              {sections.map((s) => (
                <li key={s.key} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={s.adminHref} className="text-sm font-semibold text-uk-heading hover:text-uk-blue">
                        {s.label}
                      </Link>
                      {s.state === "migrated" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[0.7rem] font-semibold text-emerald-700 dark:text-emerald-300">
                          <CircleCheck className="h-3 w-3" /> In database
                        </span>
                      ) : (
                        <span className="rounded-full bg-uk-surface-3 px-2 py-0.5 text-[0.7rem] font-semibold text-uk-muted">
                          Built-in only
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-uk-muted">
                      {s.state === "migrated"
                        ? s.key === "settings"
                          ? "Saved in the database"
                          : `${s.dbCount} in the database${s.dbCount !== s.builtInCount ? ` (built-in copy has ${s.builtInCount})` : ""}`
                        : s.key === "settings"
                          ? "Using built-in defaults"
                          : `${s.builtInCount} built-in item${s.builtInCount === 1 ? "" : "s"} ready to import`}
                    </p>
                  </div>
                  {s.state === "pending" && <ImportRowButton sectionKey={s.key} label={s.label} />}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <section className="mt-6 flex items-start gap-3 rounded-2xl border border-uk-line bg-uk-card p-5">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-uk-blue" />
        <div className="text-sm text-uk-body">
          <p className="font-semibold text-uk-heading">Still edited in code, not here</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-uk-muted">
            {STILL_IN_CODE.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
