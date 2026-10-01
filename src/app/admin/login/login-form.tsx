"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { loginAction, type LoginState } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-uk-heading">
          Email
          <span className="text-destructive" aria-hidden> *</span>
        </Label>
        <Input id="email" name="email" type="email" defaultValue={state.email} autoComplete="username" required autoFocus className="h-10" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-uk-heading">
          Password
          <span className="text-destructive" aria-hidden> *</span>
        </Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="h-10 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            aria-controls="password"
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-uk-muted transition-colors hover:text-uk-heading focus-visible:text-uk-heading focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <p className="text-xs text-uk-muted">
        <span className="text-destructive" aria-hidden>*</span> Required fields
      </p>
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
