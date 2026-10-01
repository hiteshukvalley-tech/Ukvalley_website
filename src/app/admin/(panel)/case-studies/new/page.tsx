import { PageHeader } from "@/components/admin/page-header";
import { emptyCaseValues } from "@/lib/cases-validation";
import { CaseForm } from "../case-form";

export const metadata = { title: "Add case study" };
export const dynamic = "force-dynamic";

export default function NewCasePage() {
  return (
    <>
      <PageHeader
        title="Add case study"
        crumbs={[{ label: "Case studies", href: "/admin/case-studies" }, { label: "Add case study" }]}
        description="Create a new case study. It is added to the top of the list."
      />
      <CaseForm mode="create" initial={emptyCaseValues()} />
    </>
  );
}
