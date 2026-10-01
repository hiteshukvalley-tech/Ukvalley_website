import { PageHeader } from "@/components/admin/page-header";
import { emptyLocationValues } from "@/lib/locations-validation";
import { LocationForm } from "../location-form";

export const metadata = { title: "Add location" };
export const dynamic = "force-dynamic";

export default function NewLocationPage() {
  return (
    <>
      <PageHeader
        title="Add location"
        crumbs={[{ label: "Locations", href: "/admin/locations" }, { label: "Add location" }]}
        description="Create a new location page. It is added to the end of the list."
      />
      <LocationForm mode="create" initial={emptyLocationValues()} />
    </>
  );
}
