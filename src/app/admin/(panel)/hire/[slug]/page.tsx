import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { getHireForAdmin } from "@/lib/hire-store";
import { toHireValues } from "@/lib/hire-validation";
import { HireForm } from "../hire-form";

export const metadata = { title: "Edit role" };
export const dynamic = "force-dynamic";

export default async function EditHirePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const role = await getHireForAdmin(slug);
  if (!role) notFound();

  return (
    <>
      <PageHeader
        title={role.title}
        crumbs={[{ label: "Hire roles", href: "/admin/hire" }, { label: "Edit" }]}
        description="Changes go live as soon as you save."
      />
      <HireForm mode="edit" initial={toHireValues(role)} />
    </>
  );
}
