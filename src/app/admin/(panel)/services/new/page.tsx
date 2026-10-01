import { PageHeader } from "@/components/admin/page-header";
import { emptyServiceValues } from "@/lib/services-validation";
import { ServiceForm } from "../service-form";

export const metadata = { title: "Add service" };

export default function NewServicePage() {
  return (
    <>
      <PageHeader
        title="Add service"
        crumbs={[{ label: "Services", href: "/admin/services" }, { label: "Add service" }]}
        description="Create a new service card. It is added to the end of the list."
      />
      <ServiceForm mode="create" initial={emptyServiceValues} />
    </>
  );
}
