import { PageHeader } from "@/components/admin/page-header";
import { emptyIndustryValues } from "@/lib/industries-validation";
import { IndustryForm } from "../industry-form";

export const metadata = { title: "Add industry" };
export const dynamic = "force-dynamic";

export default function NewIndustryPage() {
  return (
    <>
      <PageHeader
        title="Add industry"
        crumbs={[{ label: "Industries", href: "/admin/industries" }, { label: "Add industry" }]}
        description="Create a new sector page. It is added to the end of the list."
      />
      <IndustryForm mode="create" initial={emptyIndustryValues()} />
    </>
  );
}
