import { PageHeader } from "@/components/admin/page-header";
import { emptyHireValues } from "@/lib/hire-validation";
import { HireForm } from "../hire-form";

export const metadata = { title: "Add role" };
export const dynamic = "force-dynamic";

export default function NewHirePage() {
  return (
    <>
      <PageHeader
        title="Add role"
        crumbs={[{ label: "Hire roles", href: "/admin/hire" }, { label: "Add role" }]}
        description="Create a new hire page. It is added to the end of the list."
      />
      <HireForm mode="create" initial={emptyHireValues()} />
    </>
  );
}
