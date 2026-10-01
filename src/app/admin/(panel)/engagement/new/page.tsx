import { PageHeader } from "@/components/admin/page-header";
import { emptyEngagementModelValues } from "@/lib/engagement-validation";
import { EngagementModelForm } from "../engagement-model-form";

export const metadata = { title: "Add model" };
export const dynamic = "force-dynamic";

export default function NewEngagementModelPage() {
  return (
    <>
      <PageHeader
        title="Add model"
        crumbs={[{ label: "Engagement", href: "/admin/engagement" }, { label: "Add model" }]}
        description="Add an engagement model. It is added to the end of the list. It is added to the end of the list."
      />
      <EngagementModelForm mode="create" initial={emptyEngagementModelValues()} />
    </>
  );
}
