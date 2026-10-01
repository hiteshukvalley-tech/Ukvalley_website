import { PageHeader } from "@/components/admin/page-header";
import { emptyTechCategoryValues } from "@/lib/tech-stack-validation";
import { TechCategoryForm } from "../tech-category-form";

export const metadata = { title: "Add category" };
export const dynamic = "force-dynamic";

export default function NewTechCategoryPage() {
  return (
    <>
      <PageHeader
        title="Add category"
        crumbs={[{ label: "Tech stack", href: "/admin/tech-stack" }, { label: "Add category" }]}
        description="Add a technology category. It is added to the end of the list. It is added to the end of the list."
      />
      <TechCategoryForm mode="create" initial={emptyTechCategoryValues()} />
    </>
  );
}
