"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { AutoDismiss } from "@/components/admin/auto-dismiss";
import { forgotPasswordAction, type ForgotState } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/admin/password-input";
import { EMAIL_MAX, PASSWORD_HINT, PASSWORD_MAX, PASSWORD_MIN } from "@/lib/users-validation";

const STEPS = { email: 1, code: 2, password: 3 } as const;

const submitClass =
  "btn-sheen inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-uk-blue text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright disabled:opacity-60";

function Required() {
  return <span className="-ml-1 text-destructive" aria-hidden>*</span>;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return <p id={id} className="text-xs text-destructive">{message}</p>;
}

export function ForgotForm() {
  const [state, action, pending] = useActionState<ForgotState, FormData>(forgotPasswordAction, { step: "email" });
  const { step, email = "", errors = {} } = state;

  return (
    <form action={action} key={state.nonce} className="space-y-5">
      <p className="text-xs font-medium uppercase tracking-wide text-uk-muted">Step {STEPS[step]} of 3</p>
      <input type="hidden" name="step" value={step} />
      {step !== "email" && <input type="hidden" name="email" value={email} />}
      {step === "password" && <input type="hidden" name="token" value={state.token ?? ""} />}

      {state.notice && (
        <AutoDismiss watch={state}>
        <p role="status" className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {state.notice}
        </p>
        </AutoDismiss>
      )}
      {state.error && (
        <AutoDismiss watch={state}>
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
        </AutoDismiss>
      )}

      {step === "email" && (
        <>
          <p className="text-sm text-uk-body">Enter the email ID you sign in with. We&apos;ll email you a 6-digit verification code.</p>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-uk-heading">Email ID<Required /></Label>
            <Input
              id="email" name="email" type="email" defaultValue={email} autoComplete="username"
              placeholder="Enter your email ID" required autoFocus maxLength={EMAIL_MAX}
              aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} className="h-10"
            />
            <FieldError id="email-error" message={errors.email} />
          </div>
          <button type="submit" disabled={pending} className={submitClass}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {pending ? "Sending code…" : "Send code"}
          </button>
        </>
      )}

      {step === "code" && (
        <>
          <p className="text-sm text-uk-body">
            Enter the code sent to <span className="font-medium text-uk-heading">{email}</span>. Check your spam folder if it isn&apos;t in your inbox.
          </p>
          <div className="space-y-2">
            <Label htmlFor="code" className="text-uk-heading">Verification code<Required /></Label>
            <Input
              id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6}
              placeholder="Enter the 6-digit code" required autoFocus
              aria-invalid={!!errors.code} aria-describedby={errors.code ? "code-error" : undefined}
              className="h-10 tracking-[0.3em] placeholder:tracking-normal"
            />
            <FieldError id="code-error" message={errors.code} />
          </div>
          <button type="submit" disabled={pending} className={submitClass}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {pending ? "Checking…" : "Verify code"}
          </button>
          <div className="flex items-center justify-between text-sm">
            <button
              type="submit" name="intent" value="resend" formNoValidate disabled={pending}
              className="font-medium text-uk-blue hover:underline disabled:opacity-60"
            >
              Resend code
            </button>
            <button
              type="submit" name="intent" value="restart" formNoValidate disabled={pending}
              className="text-uk-muted hover:text-uk-heading disabled:opacity-60"
            >
              Use a different email
            </button>
          </div>
        </>
      )}

      {step === "password" && (
        <>
          <p className="text-sm text-uk-body">Code verified. Choose a new password for <span className="font-medium text-uk-heading">{email}</span>.</p>
          <div className="space-y-2">
            <Label htmlFor="next" className="text-uk-heading">New password<Required /></Label>
            <PasswordInput
              id="next" name="next" autoComplete="new-password" placeholder="Enter a new password" required autoFocus
              minLength={PASSWORD_MIN} maxLength={PASSWORD_MAX}
              aria-invalid={!!errors.next} aria-describedby={errors.next ? "next-error" : "next-hint"}
            />
            {errors.next ? <FieldError id="next-error" message={errors.next} /> : (
              <p id="next-hint" className="text-xs text-uk-muted">{PASSWORD_HINT}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-uk-heading">Confirm new password<Required /></Label>
            <PasswordInput
              id="confirm" name="confirm" autoComplete="new-password" placeholder="Enter the new password again" required
              maxLength={PASSWORD_MAX} aria-invalid={!!errors.confirm} aria-describedby={errors.confirm ? "confirm-error" : undefined}
            />
            <FieldError id="confirm-error" message={errors.confirm} />
          </div>
          <button type="submit" disabled={pending} className={submitClass}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {pending ? "Saving…" : "Save new password"}
          </button>
        </>
      )}

      <Link href="/admin/login" className="flex items-center justify-center gap-1.5 text-sm text-uk-muted hover:text-uk-heading">
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>
    </form>
  );
}
