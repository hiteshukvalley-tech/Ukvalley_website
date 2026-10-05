import type { Metadata } from "next";
import { OFFICIAL_LOGO } from "@/lib/site-content-schema";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = {
  title: "Forgot password | Ukvalley Admin",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-uk-surface px-4 py-12">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-uk-blue/15 blur-[100px]" aria-hidden />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={OFFICIAL_LOGO} alt="Ukvalley Technologies" className="h-16 w-auto max-w-[16rem] object-contain" />
          <h1 className="font-heading text-2xl font-bold text-uk-heading">Reset your password</h1>
          <p className="text-sm text-uk-muted">Ukvalley Technologies content management</p>
        </div>
        <div className="rounded-2xl border border-uk-line bg-uk-card p-6 shadow-sm sm:p-8">
          <ForgotForm />
        </div>
      </div>
    </main>
  );
}
