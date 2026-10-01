import { PageHeader } from "@/components/admin/page-header";
import { requireRole } from "@/lib/admin-session";
import { emptyUserValues } from "@/lib/users-validation";
import { UserForm } from "../user-form";

export const metadata = { title: "Add user" };
export const dynamic = "force-dynamic";

export default async function NewUserPage() {
  await requireRole("admin");
  return (
    <>
      <PageHeader
        title="Add user"
        crumbs={[{ label: "Users", href: "/admin/users" }, { label: "Add user" }]}
        description="Create a login for a teammate."
      />
      <UserForm mode="create" initial={emptyUserValues()} />
    </>
  );
}
