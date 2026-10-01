import { CircleAlert } from "lucide-react";
import { requireRole } from "@/lib/admin-session";
import { PageHeader } from "@/components/admin/page-header";
import { getSettingsForAdmin } from "@/lib/settings";
import { toValues } from "@/lib/settings-validation";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Site settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireRole("admin");
  const { settings, updatedAt, dbError } = await getSettingsForAdmin();

  return (
    <>
      <PageHeader
        title="Site settings"
        crumbs={[{ label: "Site settings" }]}
        description={
          updatedAt
            ? `Company, contact and social details for the whole website. Last saved ${new Date(updatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}.`
            : "Company, contact and social details for the whole website. Nothing saved yet — the site is using its built-in defaults."
        }
      />
      {dbError && (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Showing defaults — could not read saved settings ({dbError}). Saving will not work until the database is connected.</span>
        </div>
      )}
      <SettingsForm initial={toValues(settings)} />
    </>
  );
}
