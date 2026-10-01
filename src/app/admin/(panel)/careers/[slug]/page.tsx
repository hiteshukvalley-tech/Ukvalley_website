import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { getCareerForAdmin } from "@/lib/careers-store";
import { toCareerValues } from "@/lib/careers-validation";
import { CareerForm } from "../career-form";

export const metadata = { title: "Edit role" };
export const dynamic = "force-dynamic";

export default async function EditCareerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const career = await getCareerForAdmin(slug);
  if (!career) notFound();

  return (
    <>
      <PageHeader
        title={career.role}
        crumbs={[{ label: "Careers", href: "/admin/careers" }, { label: "Edit" }]}
        description="Changes go live as soon as you save."
      />
      <CareerForm mode="edit" initial={toCareerValues(career)} />
    </>
  );
}
