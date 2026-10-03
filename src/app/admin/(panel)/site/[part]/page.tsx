import { notFound } from "next/navigation";
import Link from "@/components/site/intent-link";
import { CircleAlert, ExternalLink, Info } from "lucide-react";
import { requireAdmin } from "@/lib/admin-session";
import { PageHeader } from "@/components/admin/page-header";
import { CHROME_DEFS, isChromeKey } from "@/lib/site-content-schema";
import { getChromeForAdmin } from "@/lib/home-store";
import type { SectionValues } from "@/lib/home-schema";
import { SectionEditor } from "../../home/section-editor";
import { resetChromeAction, saveChromeAction } from "../actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/admin/site/[part]">) {
  const part = (await params).part;
  return { title: isChromeKey(part) ? CHROME_DEFS[part].label : "Site layout" };
}

export default async function SiteChromePage({ params }: PageProps<"/admin/site/[part]">) {
  await requireAdmin();
  const part = (await params).part;
  if (!isChromeKey(part)) notFound();
  const def = CHROME_DEFS[part];
  const { content, updated, dbError } = await getChromeForAdmin();
  const savedAt = updated[part];

  return (
    <>
      <PageHeader
        title={def.label}
        crumbs={[{ label: def.label }]}
        description={`${def.description} ${savedAt ? "" : "Showing the original text — nothing saved yet."}`}
        action={
          <Link
            href="/"
            target="_blank"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-uk-line bg-uk-card px-3 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
          >
            View site <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        }
      />

      {dbError && (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Could not read saved content ({dbError}). Saving will not work until the database is connected.</span>
        </div>
      )}

      <div className="mb-6 flex items-start gap-2 rounded-xl border border-uk-blue/25 bg-uk-blue/[0.06] px-4 py-3 text-sm text-uk-body">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-uk-blue" />
        <span>
          This shows on every page of the website.{" "}
          {part === "header"
            ? "Phone, email and social links are in Site settings."
            : "Phone, email, address and social links are in Site settings."}
        </span>
      </div>

      <SectionEditor
        def={def}
        initial={content[part] as unknown as SectionValues}
        visible
        version={savedAt ?? "default"}
        save={saveChromeAction.bind(null, part)}
        reset={resetChromeAction.bind(null, part)}
        where="every page"
      />
    </>
  );
}
