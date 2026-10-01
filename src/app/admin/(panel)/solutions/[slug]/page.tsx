import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { getSolutionForAdmin } from "@/lib/solutions-store";
import { toSolutionValues } from "@/lib/solutions-validation";
import { SolutionForm } from "../solution-form";
import { relationOptions } from "../relation-options";

export const metadata = { title: "Edit solution" };
export const dynamic = "force-dynamic";

export default async function EditSolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const solution = await getSolutionForAdmin(slug);
  if (!solution) notFound();

  return (
    <>
      <PageHeader
        title={solution.name}
        crumbs={[{ label: "Solutions", href: "/admin/solutions" }, { label: "Edit" }]}
        description="Changes go live as soon as you save."
      />
      <SolutionForm mode="edit" initial={toSolutionValues(solution)} {...(await relationOptions())} />
    </>
  );
}
