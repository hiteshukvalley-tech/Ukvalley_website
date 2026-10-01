import { Info } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { ENV_USER_ID } from "@/lib/admin-auth";
import { requireAdmin } from "@/lib/admin-session";
import { roleHelp, roleLabel } from "@/lib/users-validation";
import { PasswordForm } from "./password-form";

export const metadata = { title: "Your account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const me = await requireAdmin();
  const isOwner = me.id === ENV_USER_ID;

  return (
    <>
      <PageHeader title="Your account" crumbs={[{ label: "Your account" }]} description="Your sign-in details." />

      <section className="mb-6 rounded-2xl border border-uk-line bg-uk-card p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-uk-muted">Email</dt>
            <dd className="mt-1 break-all text-sm text-uk-heading">{me.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-uk-muted">Role</dt>
            <dd className="mt-1 text-sm text-uk-heading">
              {isOwner ? "Owner (admin)" : roleLabel[me.role]}
              <span className="block text-xs text-uk-muted">{roleHelp[me.role]}</span>
            </dd>
          </div>
        </dl>
      </section>

      {isOwner ? (
        <div className="flex items-start gap-2 rounded-xl border border-uk-line bg-uk-card px-4 py-3 text-sm text-uk-body">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-uk-blue" />
          <span>
            This is the owner account. Its password is set by <code>ADMIN_PASSWORD</code> in the server environment, so it is changed there rather than here.
          </span>
        </div>
      ) : (
        <PasswordForm />
      )}
    </>
  );
}
