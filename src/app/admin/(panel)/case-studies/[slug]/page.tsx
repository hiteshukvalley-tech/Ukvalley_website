import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { getCaseForAdmin } from "@/lib/cases-store";
import { toCaseValues } from "@/lib/cases-validation";
import { CaseForm } from "../case-form";

export const metadata = { title: "Edit case study" };
export const dynamic = "force-dynamic";

export default async function EditCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const study = await getCaseForAdmin(slug);
  if (!study) notFound();

  return (
    <>
      <PageHeader
        title={study.title}
        crumbs={[{ label: "Case studies", href: "/admin/case-studies" }, { label: "Edit" }]}
        description="Changes go live as soon as you save."
      />
      <CaseForm mode="edit" initial={toCaseValues(study)} />
    </>
  );
}
