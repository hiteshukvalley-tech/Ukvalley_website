import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { getTechCategoryForAdmin } from "@/lib/tech-stack-store";
import { toTechCategoryValues } from "@/lib/tech-stack-validation";
import { TechCategoryForm } from "../tech-category-form";

export const metadata = { title: "Edit category" };
export const dynamic = "force-dynamic";

export default async function EditTechCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getTechCategoryForAdmin(slug);
  if (!item) notFound();

  return (
    <>
      <PageHeader
        title={item.label}
        crumbs={[{ label: "Tech stack", href: "/admin/tech-stack" }, { label: "Edit" }]}
        description="Changes go live as soon as you save."
      />
      <TechCategoryForm mode="edit" slug={item.slug} initial={toTechCategoryValues(item)} />
    </>
  );
}
