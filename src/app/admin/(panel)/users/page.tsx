import Link from "@/components/site/intent-link";
import { CircleAlert, Plus, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { paginate } from "@/lib/pagination";
import { envUser } from "@/lib/admin-auth";
import { requireRole } from "@/lib/admin-session";
import { listUsers } from "@/lib/users-store";
import { roleLabel } from "@/lib/users-validation";
import { FlashToast } from "@/components/admin/toast";

export const metadata = { title: "Users" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ saved?: string; page?: string; per?: string }> };

const when = (d?: Date) =>
  d ? d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }) : "Never";

export default async function UsersAdminPage({ searchParams }: Props) {
  const me = await requireRole("admin");
  const { saved, page: pageParam, per } = await searchParams;
  const { items, dbError } = await listUsers();
  const owner = envUser();
  const view = paginate(items, pageParam, per);

  return (
    <>
      <PageHeader
        title="Users"
        crumbs={[{ label: "Users" }]}
        description="People who can sign in to this admin panel. Admins can do everything; editors can manage content, leads and media but not users or site settings."
        action={
          <Link
            href="/admin/users/new"
            className="btn-sheen inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-4 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright"
          >
            <Plus className="h-4 w-4" /> Add user
          </Link>
        }
      />

      {saved === "created" && <FlashToast message="User created. Share the password with them privately." />}
      {saved === "deleted" && <FlashToast message="User deleted." />}
      {dbError && (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Could not read users ({dbError}). Only the owner account can sign in until the database is connected.</span>
        </div>
      )}

      <section className="rounded-2xl border border-uk-line bg-uk-card">
        <ul className="divide-y divide-uk-line">
          {owner && (
            <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-uk-heading">
                    <ShieldCheck className="h-4 w-4 text-uk-blue" /> Owner
                  </span>
                  <span className="rounded-full bg-uk-blue/15 px-2 py-0.5 text-[0.7rem] font-semibold text-uk-blue">Admin</span>
                  {me.id === owner.id && <span className="text-xs text-uk-muted">(you)</span>}
                </div>
                <p className="mt-0.5 truncate text-xs text-uk-muted">
                  {owner.email} · set by ADMIN_EMAIL / ADMIN_PASSWORD in the environment — change it there
                </p>
              </div>
            </li>
          )}

          {view.slice.map((u) => (
            <li key={u.id}>
              <Link
                href={`/admin/users/${u.id}`}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-uk-surface-2"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold text-uk-heading">{u.name}</span>
                    <span
                      className={
                        u.role === "admin"
                          ? "rounded-full bg-uk-blue/15 px-2 py-0.5 text-[0.7rem] font-semibold text-uk-blue"
                          : "rounded-full bg-uk-surface-3 px-2 py-0.5 text-[0.7rem] font-semibold text-uk-body"
                      }
                    >
                      {roleLabel[u.role]}
                    </span>
                    {!u.active && (
                      <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[0.7rem] font-semibold text-destructive">Disabled</span>
                    )}
                    {me.id === u.id && <span className="text-xs text-uk-muted">(you)</span>}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-uk-muted">{u.email}</p>
                </div>
                <p className="shrink-0 text-xs text-uk-muted">Last sign-in: {when(u.lastLoginAt)}</p>
              </Link>
            </li>
          ))}

          {!dbError && items.length === 0 && (
            <li className="p-8 text-center text-sm text-uk-muted">
              No other users yet. Add an editor or a second admin with the button above.
            </li>
          )}
        </ul>
        <Pagination total={view.total} page={view.page} pageSize={view.pageSize} noun="users" />
      </section>
    </>
  );
}
