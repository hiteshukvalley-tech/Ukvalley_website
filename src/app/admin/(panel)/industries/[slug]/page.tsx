import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { getIndustryForAdmin } from "@/lib/industries-store";
import { toIndustryValues } from "@/lib/industries-validation";
import { IndustryForm } from "../industry-form";

export const metadata = { title: "Edit industry" };
export const dynamic = "force-dynamic";

export default async function EditIndustryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const industry = await getIndustryForAdmin(slug);
  if (!industry) notFound();

  return (
    <>
      <PageHeader
        title={industry.name}
        crumbs={[{ label: "Industries", href: "/admin/industries" }, { label: "Edit" }]}
        description="Changes go live as soon as you save."
      />
      <IndustryForm mode="edit" initial={toIndustryValues(industry)} />
    </>
  );
}
