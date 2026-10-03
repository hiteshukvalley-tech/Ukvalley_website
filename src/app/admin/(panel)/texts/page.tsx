import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { describePath, groupByName, isScanPath } from "./scan";
import { TextsView } from "./texts-view";

export const metadata = { title: "All pages" };
export const dynamic = "force-dynamic";

// Overview of every page. A page opened through its old address
// (/admin/texts?path=…) goes to its own section: /admin/texts/<section>?path=…
export default async function TextsPage({ searchParams }: { searchParams: Promise<{ path?: string; q?: string }> }) {
  await requireAdmin();
  const { path = "", q = "" } = await searchParams;
  if (path && isScanPath(path)) {
    const info = await describePath(path);
    const slug = info ? groupByName(info.group)?.slug : undefined;
    if (slug) redirect(`/admin/texts/${slug}?path=${encodeURIComponent(path)}${q ? `&q=${encodeURIComponent(q)}` : ""}`);
  }
  return <TextsView path={path} />;
}
