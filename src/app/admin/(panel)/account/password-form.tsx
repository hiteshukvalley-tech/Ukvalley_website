"use client";

import { useActionState } from "react";
import { CircleAlert, CircleCheck, Loader2, Save } from "lucide-react";
import { FormField, FormSection } from "@/components/admin/form";
import { PASSWORD_HINT, PASSWORD_MAX } from "@/lib/users-validation";
import { changePasswordAction, type PasswordFormState } from "./actions";
import { useResultToast } from "@/components/admin/toast";

export function PasswordForm() {
  const [state, action, saving] = useActionState<PasswordFormState, FormData>(changePasswordAction, {});
  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  useResultToast(state);

  return (
    // key remounts the inputs so the password fields clear after each result
    <form action={action} key={state.nonce ?? "initial"} className="space-y-6" noValidate>
      {state.message && (
        <div
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "error"
              ? "flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              : "flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300"
          }
        >
          {state.status === "error" ? (
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          {state.message}
        </div>
      )}

      <FormSection title="Change password" description="Changing it signs you out of other browsers and devices.">
        <FormField label="Current password" name="current" type="password" required full autoComplete="current-password" maxLength={PASSWORD_MAX} error={errors.current} />
        <FormField label="New password" name="next" type="password" required autoComplete="new-password" maxLength={PASSWORD_MAX} error={errors.next} hint={PASSWORD_HINT} />
        <FormField label="Confirm new password" name="confirm" type="password" required autoComplete="new-password" maxLength={PASSWORD_MAX} error={errors.confirm} />
      </FormSection>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="btn-sheen inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-5 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : "Change password"}
        </button>
      </div>
    </form>
  );
}
