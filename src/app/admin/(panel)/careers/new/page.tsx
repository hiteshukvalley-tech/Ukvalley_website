import { PageHeader } from "@/components/admin/page-header";
import { emptyCareerValues } from "@/lib/careers-validation";
import { CareerForm } from "../career-form";

export const metadata = { title: "Add role" };
export const dynamic = "force-dynamic";

export default function NewCareerPage() {
  return (
    <>
      <PageHeader
        title="Add role"
        crumbs={[{ label: "Careers", href: "/admin/careers" }, { label: "Add role" }]}
        description="Create a new open role. It is added to the end of the list."
      />
      <CareerForm mode="create" initial={emptyCareerValues()} />
    </>
  );
}
