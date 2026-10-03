"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { loginAction, type LoginState } from "../actions";
import { AutoDismiss } from "@/components/admin/auto-dismiss";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/admin/password-input";
import { CharCounter } from "@/components/admin/char-counter";
import { EMAIL_MAX, PASSWORD_MAX, passwordRuleError } from "@/lib/users-validation";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  // Set by the check below before submitting; cleared as soon as the user types.
  const [passwordIssue, setPasswordIssue] = useState<string | undefined>();
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    setPasswordIssue(undefined);
  }
  const passwordError = passwordIssue ?? state.errors?.password;

  function checkBeforeSubmit(e: React.FormEvent<HTMLFormElement>) {
    const field = e.currentTarget.elements.namedItem("password") as HTMLInputElement | null;
    const issue = passwordRuleError(field?.value ?? "");
    if (issue) {
      // Stops the sign-in request; the message explains what to fix.
      e.preventDefault();
      setPasswordIssue(issue);
      field?.focus();
    }
  }

  return (
    <form action={action} onSubmit={checkBeforeSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-uk-heading">
          Email ID
          <span className="-ml-1 text-destructive" aria-hidden>*</span>
        </Label>
        {/* Keyed so a failed sign-in re-creates the field with the typed email
            (Base UI warns when an uncontrolled field's defaultValue changes). */}
        <Input key={state.email ?? ""} id="email" name="email" type="email" defaultValue={state.email} autoComplete="username" placeholder="Enter your email ID" required autoFocus maxLength={EMAIL_MAX} aria-describedby="email-count" className="h-10" />
        <div className="flex">
          <CharCounter htmlFor="email" max={EMAIL_MAX} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-uk-heading">
          Password
          <span className="-ml-1 text-destructive" aria-hidden>*</span>
        </Label>
        <PasswordInput
          id="password" name="password" autoComplete="current-password" placeholder="Enter your password" required maxLength={PASSWORD_MAX}
          onInput={() => setPasswordIssue(undefined)}
          aria-invalid={!!passwordError}
          aria-describedby={passwordError ? "password-error password-count" : "password-count"}
        />
        <div className="flex items-start gap-3">
          {passwordError && (
            <p id="password-error" role="alert" className="text-xs text-destructive">
              {passwordError}
            </p>
          )}
          <CharCounter htmlFor="password" max={PASSWORD_MAX} />
        </div>
      </div>
      {state.error && (
        <AutoDismiss watch={state}>
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
        </AutoDismiss>
      )}
      <button
        type="submit"
        disabled={pending}
        className="btn-sheen inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-uk-blue text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright disabled:opacity-60"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <div className="text-center">
        <Link href="/admin/forgot-password" className="text-sm font-medium text-uk-blue hover:underline">
          Forgot password?
        </Link>
      </div>
    </form>
  );
}
