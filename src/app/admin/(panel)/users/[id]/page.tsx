import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { requireRole } from "@/lib/admin-session";
import { getUser } from "@/lib/users-store";
import { UserForm } from "../user-form";
import { ACCESS_KEYS } from "@/lib/admin-access";

export const metadata = { title: "Edit user" };
export const dynamic = "force-dynamic";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireRole("admin");
  const { id } = await params;
  const user = await getUser(id);
  if (!user) notFound();

  return (
    <>
      <PageHeader
        title={user.name}
        crumbs={[{ label: "Users", href: "/admin/users" }, { label: "Edit" }]}
        description={
          user.lastLoginAt
            ? `Last signed in ${user.lastLoginAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}.`
            : "Has not signed in yet."
        }
      />
      <UserForm
        mode="edit"
        id={user.id}
        isSelf={me.id === user.id}
        initial={{
          name: user.name, email: user.email, role: user.role, password: "", active: user.active ? "on" : "",
          title: user.title ?? "",
          // A team member made before per-section access can use every section: show them all ticked.
          access: user.role === "admin" ? [] : [...(user.access ?? ACCESS_KEYS)],
        }}
      />
    </>
  );
}
