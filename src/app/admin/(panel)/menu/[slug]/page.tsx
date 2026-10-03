import { notFound } from "next/navigation";
import { CircleAlert, ExternalLink } from "lucide-react";
import Link from "@/components/site/intent-link";
import { requireAdmin } from "@/lib/admin-session";
import { PageHeader } from "@/components/admin/page-header";
import type { SectionValues } from "@/lib/home-schema";
import { MAIN_PAGE_DEF, isMainPageSlug } from "@/lib/menu-schema";
import { getMainPageForAdmin } from "@/lib/menu-store";
import { SectionEditor } from "../../home/section-editor";
import { DeleteMainPageButton } from "../delete-main-page-button";
import { saveMainPageAction } from "../actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Main section page" };

export default async function MainSectionPage({ params }: PageProps<"/admin/menu/[slug]">) {
  await requireAdmin();
  const slug = (await params).slug;
  if (!isMainPageSlug(slug)) notFound();
  const { content, updatedAt, dbError } = await getMainPageForAdmin(slug);
  if (!content && !dbError) notFound();
  const name = content?.adminName || slug;

  return (
    <>
      <PageHeader
        title={name}
        crumbs={[{ label: "Main menu", href: "/admin/menu" }, { label: name }]}
        description={`The page behind this menu item, at /s/${slug}. Add it to a position in the menu from Main menu.`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/s/${slug}`}
              target="_blank"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-uk-line bg-uk-card px-3 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
            >
              View page <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <DeleteMainPageButton slug={slug} name={name} />
          </div>
        }
      />
      {dbError && (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Could not read this page ({dbError}). Saving will not work until the database is connected.</span>
        </div>
      )}
      {content && (
        <SectionEditor
          def={MAIN_PAGE_DEF}
          initial={content as unknown as SectionValues}
          visible
          version={updatedAt ?? "default"}
          save={saveMainPageAction.bind(null, slug)}
          where="this page"
        />
      )}
    </>
  );
}
