import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { getProcessStepForAdmin } from "@/lib/process-store";
import { toProcessStepValues } from "@/lib/process-validation";
import { ProcessStepForm } from "../process-step-form";

export const metadata = { title: "Edit step" };
export const dynamic = "force-dynamic";

export default async function EditProcessStepPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getProcessStepForAdmin(slug);
  if (!item) notFound();

  return (
    <>
      <PageHeader
        title={item.title}
        crumbs={[{ label: "Process", href: "/admin/process" }, { label: "Edit" }]}
        description="Changes go live as soon as you save."
      />
      <ProcessStepForm mode="edit" slug={item.slug} initial={toProcessStepValues(item)} />
    </>
  );
}
