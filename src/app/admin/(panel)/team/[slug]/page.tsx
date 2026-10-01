import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { getTeamMemberForAdmin } from "@/lib/team-store";
import { toTeamValues } from "@/lib/team-validation";
import { TeamForm } from "../team-form";

export const metadata = { title: "Edit member" };
export const dynamic = "force-dynamic";

export default async function EditTeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const member = await getTeamMemberForAdmin(slug);
  if (!member) notFound();

  return (
    <>
      <PageHeader
        title={member.name}
        crumbs={[{ label: "Team", href: "/admin/team" }, { label: "Edit" }]}
        description="Changes go live as soon as you save."
      />
      <TeamForm mode="edit" slug={member.slug} initial={toTeamValues(member)} />
    </>
  );
}
