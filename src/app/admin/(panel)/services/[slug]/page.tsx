import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { getServiceForAdmin } from "@/lib/services-store";
import { toServiceValues } from "@/lib/services-validation";
import { ServiceForm } from "../service-form";

export const metadata = { title: "Edit service" };
export const dynamic = "force-dynamic";

export default async function EditServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await getServiceForAdmin(slug);
  if (!service) notFound();

  return (
    <>
      <PageHeader
        title={service.title}
        crumbs={[{ label: "Services", href: "/admin/services" }, { label: "Edit" }]}
        description="Changes go live as soon as you save."
      />
      <ServiceForm mode="edit" initial={toServiceValues(service)} />
    </>
  );
}
