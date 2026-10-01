import { PageHeader } from "@/components/admin/page-header";
import { emptySolutionValues } from "@/lib/solutions-validation";
import { SolutionForm } from "../solution-form";
import { relationOptions } from "../relation-options";

export const metadata = { title: "Add solution" };
export const dynamic = "force-dynamic";

export default async function NewSolutionPage() {
  return (
    <>
      <PageHeader
        title="Add solution"
        crumbs={[{ label: "Solutions", href: "/admin/solutions" }, { label: "Add solution" }]}
        description="Create a new solution page. It is added to the end of the list."
      />
      <SolutionForm mode="create" initial={emptySolutionValues()} {...(await relationOptions())} />
    </>
  );
}
