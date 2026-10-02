import { notFound } from "next/navigation";
import Link from "@/components/site/intent-link";
import { ArrowLeft, ArrowRight, CircleAlert, Info } from "lucide-react";
import { requireAdmin } from "@/lib/admin-session";
import { PageHeader } from "@/components/admin/page-header";
import { HOME_SECTIONS, homeSectionDef, type SectionValues } from "@/lib/home-schema";
import { getHomeForAdmin } from "@/lib/home-store";
import { SectionEditor } from "../section-editor";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/admin/home/[section]">) {
  const def = homeSectionDef((await params).section);
  return { title: def ? `${def.label} · Home page` : "Home page" };
}

export default async function HomeSectionPage({ params }: PageProps<"/admin/home/[section]">) {
  await requireAdmin();
  const def = homeSectionDef((await params).section);
  if (!def) notFound();

  const { page, updated, dbError } = await getHomeForAdmin();
  const index = HOME_SECTIONS.indexOf(def);
  const prev = HOME_SECTIONS[index - 1];
  const next = HOME_SECTIONS[index + 1];
  const savedAt = updated[def.key];

  return (
    <>
      <PageHeader
        title={def.label}
        crumbs={[{ label: "Home page", href: "/admin/home" }, { label: def.label }]}
        description={`${def.description} ${savedAt ? "" : "Showing the original text — nothing saved yet."}`}
      />

      {dbError && (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Could not read saved content ({dbError}). Saving will not work until the database is connected.</span>
        </div>
      )}

      {def.managedBy && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-uk-blue/25 bg-uk-blue/[0.06] px-4 py-3 text-sm text-uk-body">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-uk-blue" />
          <span>
            The cards in this section are edited in{" "}
            {def.managedBy.map((m, i) => (
              <span key={m.href}>
                {i > 0 && ", "}
                <Link href={m.href} className="font-semibold text-uk-blue hover:text-uk-blue-bright">{m.label}</Link>
              </span>
            ))}
            . Here you edit the text around them.
          </span>
        </div>
      )}

      <SectionEditor
        def={def}
        initial={page.content[def.key] as unknown as SectionValues}
        visible={page.visible[def.key]}
        version={savedAt ?? "default"}
      />

      <nav aria-label="Other sections" className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm">
        {prev ? (
          <Link href={`/admin/home/${prev.key}`} className="inline-flex items-center gap-1.5 font-medium text-uk-muted hover:text-uk-heading">
            <ArrowLeft className="h-4 w-4" /> {prev.label}
          </Link>
        ) : <span />}
        {next && (
          <Link href={`/admin/home/${next.key}`} className="inline-flex items-center gap-1.5 font-medium text-uk-muted hover:text-uk-heading">
            {next.label} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </nav>
    </>
  );
}
