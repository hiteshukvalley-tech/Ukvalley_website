import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { groupBySlug } from "../scan";
import { TextsView } from "../texts-view";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ group: string }> }) {
  const g = groupBySlug((await params).group);
  return { title: g ? `${g.name} pages` : "Pages" };
}

// One website section's pages (Services, Solutions, Work, Company, Hire,
// Insights), or one of them being edited when ?path= is given.
export default async function TextsGroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ group: string }>;
  searchParams: Promise<{ path?: string; q?: string }>;
}) {
  await requireAdmin();
  const { group } = await params;
  if (!groupBySlug(group)) notFound();
  const { path = "", q = "" } = await searchParams;
  return <TextsView group={group} path={path} q={q.slice(0, 100)} />;
}
