import { PageHeader } from "@/components/admin/page-header";
import { emptyTeamValues } from "@/lib/team-validation";
import { TeamForm } from "../team-form";

export const metadata = { title: "Add member" };
export const dynamic = "force-dynamic";

export default function NewTeamPage() {
  return (
    <>
      <PageHeader
        title="Add member"
        crumbs={[{ label: "Team", href: "/admin/team" }, { label: "Add member" }]}
        description="Add a person to the leadership list. It is added to the end of the list."
      />
      <TeamForm mode="create" initial={emptyTeamValues()} />
    </>
  );
}
