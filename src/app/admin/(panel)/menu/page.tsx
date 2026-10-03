import { CircleAlert } from "lucide-react";
import { requireAdmin } from "@/lib/admin-session";
import { PageHeader } from "@/components/admin/page-header";
import { getMenuForAdmin } from "@/lib/menu-store";
import { AddSectionForm, MenuEditor } from "./menu-editor";

export const metadata = { title: "Main menu" };
export const dynamic = "force-dynamic";

export default async function MenuAdminPage() {
  await requireAdmin();
  const { items, updatedAt, pages, dbError } = await getMenuForAdmin();
  const pageNames = Object.fromEntries(pages.map((p) => [p.slug, p.name]));
  return (
    <>
      <PageHeader
        title="Main menu"
        crumbs={[{ label: "Main menu" }]}
        description="The menu at the top of every page: Services, Solutions, Work, Company, Hire, Insights and any section you add. Rename items, change their order, hide them, edit their links and add new main sections."
      />
      {dbError && (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Showing the original menu — could not read the saved one ({dbError}). Saving will not work until the database is connected.</span>
        </div>
      )}
      <MenuEditor key={updatedAt ?? "default"} initial={items} pageNames={pageNames} />
      <div className="mt-8">
        <AddSectionForm />
      </div>
    </>
  );
}
