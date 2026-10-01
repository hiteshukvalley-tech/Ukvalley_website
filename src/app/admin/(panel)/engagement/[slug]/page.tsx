import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { getEngagementModelForAdmin } from "@/lib/engagement-store";
import { toEngagementModelValues } from "@/lib/engagement-validation";
import { EngagementModelForm } from "../engagement-model-form";

export const metadata = { title: "Edit model" };
export const dynamic = "force-dynamic";

export default async function EditEngagementModelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getEngagementModelForAdmin(slug);
  if (!item) notFound();

  return (
    <>
      <PageHeader
        title={item.name}
        crumbs={[{ label: "Engagement", href: "/admin/engagement" }, { label: "Edit" }]}
        description="Changes go live as soon as you save."
      />
      <EngagementModelForm mode="edit" slug={item.slug} initial={toEngagementModelValues(item)} />
    </>
  );
}
