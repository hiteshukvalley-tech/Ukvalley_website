import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { getLocationForAdmin } from "@/lib/locations-store";
import { toLocationValues } from "@/lib/locations-validation";
import { LocationForm } from "../location-form";

export const metadata = { title: "Edit location" };
export const dynamic = "force-dynamic";

export default async function EditLocationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const location = await getLocationForAdmin(slug);
  if (!location) notFound();

  return (
    <>
      <PageHeader
        title={location.city}
        crumbs={[{ label: "Locations", href: "/admin/locations" }, { label: "Edit" }]}
        description="Changes go live as soon as you save."
      />
      <LocationForm mode="edit" initial={toLocationValues(location)} />
    </>
  );
}
