import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { requireRole } from "@/lib/admin-session";
import { getUser } from "@/lib/users-store";
import { UserForm } from "../user-form";
import { ACCESS_KEYS } from "@/lib/admin-access";
import { SmtpSection } from "@/components/admin/smtp/smtp-section";

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

      {/* This user's own mail server: its own form, below the account form */}
      <div className="mt-12 border-t border-uk-line pt-10">
        <SmtpSection
          scope={{ kind: "user", userId: user.id }}
          testTo={me.email}
          who={user.name}
          title="Email (SMTP) for this user"
          description={`${user.name}'s own mail server. Status emails and manual emails they send go out through it, from their address. Leave it empty to send through the HR email settings (Site settings). They can also change it themselves in Settings.`}
        />
      </div>
    </>
  );
}
