"use client";

import Link from "@/components/site/intent-link";
import { useActionState, useState, useTransition } from "react";
import { Loader2, Save, Trash2 } from "lucide-react";
import { FormCheckbox, FormField, FormSection, FormSelect } from "@/components/admin/form";
import { ADMIN_ROLES } from "@/lib/admin-auth";
import { ACCESS_AREAS } from "@/lib/admin-access";
import { EMAIL_MAX, PASSWORD_HINT, PASSWORD_MAX, TITLE_MAX, roleHelp, roleLabel, type UserValues } from "@/lib/users-validation";
import { cn } from "@/lib/utils";
import { createUserAction, deleteUserAction, updateUserAction, type UserFormState } from "./actions";
import { useResultToast } from "@/components/admin/toast";
import { toast } from "@/components/admin/toast";
import { confirmDialog } from "@/components/admin/confirm-dialog";

const roleOptions = ADMIN_ROLES.map((r) => ({ value: r, label: `${roleLabel[r]} — ${roleHelp[r]}` }));

export function UserForm({
  mode,
  initial,
  id,
  isSelf = false,
}: {
  mode: "create" | "edit";
  initial: UserValues;
  /** id of the user being edited (edit mode only) */
  id?: string;
  /** true when the signed-in admin is editing their own account */
  isSelf?: boolean;
}) {
  const [state, action, saving] = useActionState<UserFormState, FormData>(
    mode === "create" ? createUserAction : updateUserAction.bind(null, id ?? ""),
    {}
  );
  const values = state.values ?? initial;
  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  useResultToast(state);

  const [deleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string>();

  return (
    <div className="space-y-6">
      {/* key remounts the inputs so defaultValues refresh after each result */}
      <form action={action} key={state.nonce ?? "initial"} className="space-y-6" noValidate>

        <FormSection title="Account" description="Who this person is and what they can do.">
          <FormField label="Name" name="name" required defaultValue={values.name} error={errors.name} autoComplete="off" />
          <FormField
            label="Email"
            name="email"
            type="email"
            required
            readOnly={mode === "edit"}
            defaultValue={values.email}
            maxLength={EMAIL_MAX}
            error={errors.email}
            autoComplete="off"
            hint={mode === "edit" ? "The email can't be changed after creation." : "They sign in with this address."}
          />
          <FormField
            label="Job title"
            name="title"
            defaultValue={values.title}
            maxLength={TITLE_MAX}
            error={errors.title}
            autoComplete="off"
            hint="Optional — e.g. HR, Junior HR, Content writer. Shown in the panel."
          />
          <RoleAndAccess
            initialRole={values.role}
            initialAccess={values.access}
            roleError={errors.role}
            accessError={errors.access}
            isSelf={isSelf}
          />
          {mode === "edit" && (
            <FormCheckbox
              label="Active"
              name="active"
              defaultChecked={values.active === "on"}
              full
              hint={isSelf ? "You can't disable your own account." : "Untick to block this person from signing in. Their data is kept."}
            />
          )}
        </FormSection>

        <FormSection
          title={mode === "create" ? "Password" : "Reset password"}
          description={
            mode === "create"
              ? "Set a first password and share it with them privately. They can change it on their Account page."
              : "Leave empty to keep the current password. Setting a new one signs this person out everywhere."
          }
        >
          <FormField
            label={mode === "create" ? "Password" : "New password (optional)"}
            name="password"
            type="password"
            required={mode === "create"}
            full
            defaultValue=""
            maxLength={PASSWORD_MAX}
            error={errors.password}
            autoComplete="new-password"
            hint={PASSWORD_HINT}
          />
        </FormSection>

        {/* hidden so a disabled/untouched Active box on create still submits as active */}
        {mode === "create" && <input type="hidden" name="active" value="on" />}

        <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-uk-line bg-uk-card/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
          <Link
            href="/admin/users"
            className="inline-flex h-10 items-center rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
          >
            Back to users
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="btn-sheen inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-5 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : mode === "create" ? "Create user" : "Save changes"}
          </button>
        </div>
      </form>

      {mode === "edit" && id && !isSelf && (
        <section className="rounded-2xl border border-uk-line bg-uk-card p-6">
          <h2 className="font-heading text-lg font-semibold text-uk-heading">Delete user</h2>
          <p className="mt-1 text-sm text-uk-muted">
            Permanently removes this account. To keep it but block sign-in, untick Active instead.
          </p>
          <button
            type="button"
            disabled={deleting}
            onClick={async () => {
              if (await confirmDialog(`Delete “${initial.name}”? This can't be undone.`)) {
                startDelete(async () => {
                  const r = await deleteUserAction(id);
                  // On success the action redirects; a result only comes back on failure.
                  if (r && !r.ok) {
                  setDeleteError(r.message);
                  toast.error(r.message ?? "Could not delete.");
                }
                });
              }
            }}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-destructive/40 px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete user
          </button>
          {deleteError && <p role="alert" className="mt-2 text-xs text-destructive">{deleteError}</p>}
        </section>
      )}
    </div>
  );
}

const GROUPS = ["Overview", "Website", "Careers & leads"] as const;

/**
 * The role select and, for a team member, the sections they may use. Lives
 * inside the form so it resets with it after each save.
 */
function RoleAndAccess({
  initialRole, initialAccess, roleError, accessError, isSelf,
}: {
  initialRole: string;
  initialAccess: string[];
  roleError?: string;
  accessError?: string;
  isSelf: boolean;
}) {
  const [role, setRole] = useState(initialRole);
  const [picked, setPicked] = useState(() => new Set(initialAccess));
  const toggle = (key: string, on: boolean) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  const setGroup = (group: string, on: boolean) =>
    setPicked((prev) => {
      const next = new Set(prev);
      for (const a of ACCESS_AREAS) {
        if (a.group !== group) continue;
        if (on) next.add(a.key);
        else next.delete(a.key);
      }
      return next;
    });

  return (
    <>
      <FormSelect
        label="Role"
        name="role"
        required
        full
        defaultValue={initialRole}
        error={roleError}
        options={roleOptions}
        onChange={setRole}
        hint={isSelf ? "You can't change your own role." : undefined}
      />
      {role === "editor" ? (
        <fieldset className="space-y-4 sm:col-span-2" aria-describedby={accessError ? "access-err" : "access-hint"}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <legend className="text-sm font-medium text-uk-heading">
              Sections this person can use<span className="text-destructive" aria-hidden> *</span>
            </legend>
            <span className="text-xs tabular-nums text-uk-muted">{picked.size} of {ACCESS_AREAS.length} selected</span>
          </div>
          <p id="access-hint" className="-mt-2 text-xs text-uk-muted">
            Their sidebar shows only these, and every other section is closed to them. The dashboard and their own
            account page are always available.
          </p>
          {GROUPS.map((group) => {
            const areas = ACCESS_AREAS.filter((a) => a.group === group);
            const all = areas.every((a) => picked.has(a.key));
            return (
              <div key={group} className="rounded-xl border border-uk-line bg-uk-surface p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-uk-muted">{group}</span>
                  <button
                    type="button"
                    onClick={() => setGroup(group, !all)}
                    className="text-xs font-medium text-uk-blue hover:underline"
                  >
                    {all ? "Clear" : "Select all"}
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {areas.map((a) => {
                    const on = picked.has(a.key);
                    return (
                      <label
                        key={a.key}
                        className={cn(
                          "flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors",
                          on ? "border-uk-blue/40 bg-uk-blue/[0.06]" : "border-uk-line hover:bg-uk-surface-2"
                        )}
                      >
                        <input
                          type="checkbox"
                          name="access"
                          value={a.key}
                          checked={on}
                          onChange={(e) => toggle(a.key, e.target.checked)}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-uk-blue"
                        />
                        <span className="min-w-0">
                          <span className="block font-medium text-uk-heading">{a.label}</span>
                          {a.hint && <span className="block text-xs text-uk-muted">{a.hint}</span>}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {accessError && <p id="access-err" role="alert" className="text-xs font-medium text-destructive">{accessError}</p>}
        </fieldset>
      ) : (
        <p className="rounded-lg border border-uk-line bg-uk-surface px-3 py-2 text-xs text-uk-muted sm:col-span-2">
          Admins can use every section, including users and site settings.
        </p>
      )}
    </>
  );
}
