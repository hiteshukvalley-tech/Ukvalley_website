import Link from "@/components/site/intent-link";
import { CircleAlert, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/admin-session";
import { PageHeader } from "@/components/admin/page-header";
import { homeSectionDef } from "@/lib/home-schema";
import { getHomeForAdmin } from "@/lib/home-store";
import { SectionList, type SectionRow } from "./section-list";

export const metadata = { title: "Home page" };
export const dynamic = "force-dynamic";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

export default async function HomeSectionsPage() {
  await requireAdmin("home");
  const { page, updated, dbError } = await getHomeForAdmin();

  const rows: SectionRow[] = page.order.flatMap((id): SectionRow[] => {
    const savedAt = updated[id];
    const note = savedAt ? `Last saved ${fmt(savedAt)}` : "Original text";
    const custom = page.custom.find((c) => c.id === id);
    if (custom) {
      return [{
        id, custom: true, note,
        label: custom.values.adminName || "Custom section",
        description: custom.values.title.replace(/\*/g, ""),
        shown: custom.visible,
      }];
    }
    const def = homeSectionDef(id);
    if (!def) return [];
    return [{
      id, custom: false, note,
      label: def.label,
      description: def.description,
      shown: page.visible[def.key],
      cards: def.managedBy?.map((m) => m.label).join(", "),
    }];
  });
  const hidden = rows.filter((r) => !r.shown).length;

  return (
    <>
      <PageHeader
        title="Home page"
        crumbs={[{ label: "Home page" }]}
        description={`Edit every section of the home page and choose the order visitors see them in. ${rows.length} sections${hidden ? `, ${hidden} hidden` : ""}.`}
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

      <SectionList rows={rows} />
    </>
  );
}
