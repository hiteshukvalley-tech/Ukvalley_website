"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { loginAction, type LoginState } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/admin/password-input";
import { CharCounter } from "@/components/admin/char-counter";
import { EMAIL_MAX, PASSWORD_MAX } from "@/lib/users-validation";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-uk-heading">
          Email ID
          <span className="text-destructive" aria-hidden> *</span>
        </Label>
        <Input id="email" name="email" type="email" defaultValue={state.email} autoComplete="username" required autoFocus maxLength={EMAIL_MAX} aria-describedby="email-count" className="h-10" />
        <div className="flex">
          <CharCounter htmlFor="email" max={EMAIL_MAX} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-uk-heading">
          Password
          <span className="text-destructive" aria-hidden> *</span>
        </Label>
        <PasswordInput id="password" name="password" autoComplete="current-password" required maxLength={PASSWORD_MAX} aria-describedby="password-count" />
        <div className="flex">
          <CharCounter htmlFor="password" max={PASSWORD_MAX} />
        </div>
      </div>
      {state.error && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="btn-sheen inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-uk-blue text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright disabled:opacity-60"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
