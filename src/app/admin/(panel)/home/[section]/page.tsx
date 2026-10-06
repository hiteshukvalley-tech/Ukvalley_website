import { notFound } from "next/navigation";
import Link from "@/components/site/intent-link";
import { ArrowLeft, ArrowRight, CircleAlert, Info } from "lucide-react";
import { requireAdmin } from "@/lib/admin-session";
import { PageHeader } from "@/components/admin/page-header";
import { canonicalSectionKey, homeSectionDef, isHomeSectionKey, type SectionValues } from "@/lib/home-schema";
import { CUSTOM_SECTION_DEF, isCustomKey } from "@/lib/site-content-schema";
import { getHomeForAdmin } from "@/lib/home-store";
import { SectionEditor } from "../section-editor";
import { DeleteSectionButton } from "../delete-section-button";
import { resetHomeSectionAction, saveHomeSectionAction } from "../actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/admin/home/[section]">) {
  const key = canonicalSectionKey((await params).section);
  const def = homeSectionDef(key);
  return { title: def ? `${def.label} · Home page` : "Home page" };
}

export default async function HomeSectionPage({ params }: PageProps<"/admin/home/[section]">) {
  await requireAdmin("home");
  const key = canonicalSectionKey((await params).section);
  const { page, updated, dbError } = await getHomeForAdmin();

  const customSection = isCustomKey(key) ? page.custom.find((c) => c.id === key) : undefined;
  const builtIn = isHomeSectionKey(key) ? homeSectionDef(key) : undefined;
  if (!customSection && !builtIn) notFound();

  const def = customSection ? CUSTOM_SECTION_DEF : builtIn!;
  const label = customSection ? customSection.values.adminName || "Custom section" : def.label;
  const label_of = (id: string) =>
    page.custom.find((c) => c.id === id)?.values.adminName ?? homeSectionDef(id)?.label ?? id;

  const index = page.order.indexOf(key);
  const prev = index > 0 ? page.order[index - 1] : undefined;
  const next = index >= 0 ? page.order[index + 1] : undefined;
  const savedAt = updated[key];

  const initial = (customSection ? customSection.values : page.content[key as keyof typeof page.content]) as unknown as SectionValues;
  const visible = customSection ? customSection.visible : page.visible[key as keyof typeof page.visible];

  return (
    <>
      <PageHeader
        title={label}
        crumbs={[{ label: "Home page", href: "/admin/home" }, { label }]}
        description={
          customSection
            ? `A section you added. Position ${index + 1} of ${page.order.length} on the home page — change it in the list.`
            : `${def.description} ${savedAt ? "" : "Showing the original text — nothing saved yet."}`
        }
        action={customSection ? <DeleteSectionButton id={key} name={label} /> : undefined}
      />

      {dbError && (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Could not read saved content ({dbError}). Saving will not work until the database is connected.</span>
        </div>
      )}

      {builtIn?.managedBy && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-uk-blue/25 bg-uk-blue/[0.06] px-4 py-3 text-sm text-uk-body">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-uk-blue" />
          <span>
            The cards in this section are edited in{" "}
            {builtIn.managedBy.map((m, i) => (
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
        initial={initial}
        visible={visible}
        version={savedAt ?? "default"}
        save={saveHomeSectionAction.bind(null, key)}
        reset={customSection ? undefined : resetHomeSectionAction.bind(null, key)}
      />

      <nav aria-label="Other sections" className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm">
        {prev ? (
          <Link href={`/admin/home/${prev}`} className="inline-flex items-center gap-1.5 font-medium text-uk-muted hover:text-uk-heading">
            <ArrowLeft className="h-4 w-4" /> {label_of(prev)}
          </Link>
        ) : <span />}
        {next && (
          <Link href={`/admin/home/${next}`} className="inline-flex items-center gap-1.5 font-medium text-uk-muted hover:text-uk-heading">
            {label_of(next)} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </nav>
    </>
  );
}
