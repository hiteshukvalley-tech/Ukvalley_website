import { notFound } from "next/navigation";
import { CircleAlert, ExternalLink } from "lucide-react";
import Link from "@/components/site/intent-link";
import { requireAdmin } from "@/lib/admin-session";
import { PageHeader } from "@/components/admin/page-header";
import type { SectionValues } from "@/lib/home-schema";
import { pageDef, emptyPageContent, isPageKey, pageInfo } from "@/lib/pages-schema";
import { getPagesForAdmin } from "@/lib/pages-store";
import { socialImpactEditorDefaults } from "@/lib/social-impact-data";
import { SectionEditor } from "../../home/section-editor";
import { resetPageAction, savePageAction } from "../actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/admin/pages/[page]">) {
  const info = pageInfo((await params).page);
  return { title: info ? `${info.label} · Page text` : "Page text" };
}

export default async function PageTextEditor({ params }: PageProps<"/admin/pages/[page]">) {
  await requireAdmin("pages");
  const key = (await params).page;
  if (!isPageKey(key)) notFound();
  const info = pageInfo(key)!;
  const { byKey, dbError } = await getPagesForAdmin();
  const saved = byKey[key];
  let initial = saved?.content ?? emptyPageContent;
  // Our social impact: start from the sections the page shows today, so they
  // can be edited, reordered or removed and new ones added below them.
  if (key === "social-impact") {
    const d = socialImpactEditorDefaults();
    initial = {
      ...initial,
      introEyebrow: initial.introEyebrow || d.introEyebrow,
      introTitle: initial.introTitle || d.introTitle,
      introText: initial.introText || d.introText,
      galleries: initial.galleries.length ? initial.galleries : d.galleries,
    };
  }

  return (
    <>
      <PageHeader
        title={info.label}
        crumbs={[{ label: "Page text", href: "/admin/pages" }, { label: info.label }]}
        description={
          key === "social-impact"
            ? "Edit the intro and the page sections (each a title, text and an optional photo gallery): reorder or remove them, or add new ones with “Add section”. Hero fields you leave empty keep the page's built-in text. Extra blocks appear at the end of the page, above the footer."
            : "Hero fields you leave empty keep the page's built-in text. Extra blocks appear at the end of the page, above the footer."
        }
        action={
          <Link
            href={info.href}
            target="_blank"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-uk-line bg-uk-card px-3 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
          >
            View page <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        }
      />
      {dbError && (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Could not read saved content ({dbError}). Saving will not work until the database is connected.</span>
        </div>
      )}
      <SectionEditor
        def={pageDef(key)}
        initial={initial as unknown as SectionValues}
        visible
        version={saved?.updatedAt ?? "default"}
        save={savePageAction.bind(null, key)}
        reset={resetPageAction.bind(null, key)}
        where="this page"
      />
    </>
  );
}
