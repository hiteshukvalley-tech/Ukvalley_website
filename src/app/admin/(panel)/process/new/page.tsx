import { PageHeader } from "@/components/admin/page-header";
import { emptyProcessStepValues } from "@/lib/process-validation";
import { ProcessStepForm } from "../process-step-form";

export const metadata = { title: "Add step" };
export const dynamic = "force-dynamic";

export default function NewProcessStepPage() {
  return (
    <>
      <PageHeader
        title="Add step"
        crumbs={[{ label: "Process", href: "/admin/process" }, { label: "Add step" }]}
        description="Add a delivery step. It is added to the end of the list. It is added to the end of the list."
      />
      <ProcessStepForm mode="create" initial={emptyProcessStepValues()} />
    </>
  );
}
