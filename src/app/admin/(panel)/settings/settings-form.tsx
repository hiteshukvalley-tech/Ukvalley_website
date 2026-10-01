"use client";

import { useActionState, useState, useTransition } from "react";
import { CircleAlert, CircleCheck, Loader2, RotateCcw, Save } from "lucide-react";
import { FormField, FormSection } from "@/components/admin/form";
import type { SettingsValues } from "@/lib/settings-validation";
import {
  resetSettingsAction,
  saveSettingsAction,
  type SettingsState,
} from "./actions";

export function SettingsForm({ initial }: { initial: SettingsValues }) {
  const [state, action, saving] = useActionState<SettingsState, FormData>(
    saveSettingsAction,
    {}
  );
  const [resetting, startReset] = useTransition();
  const [resetState, setResetState] = useState<SettingsState>({});

  // Latest result wins: reset (newer nonce) or save.
  const latest =
    (resetState.nonce ?? 0) > (state.nonce ?? 0) ? resetState : state;
  const values = latest.values ?? initial;
  const errors = latest.status === "error" ? (latest.errors ?? {}) : {};
  const v = (k: keyof SettingsValues) => values[k];
  const e = (k: string) => errors[k];
  const busy = saving || resetting;

  return (
    // key remounts the inputs so defaultValues refresh after save / reset
    <form action={action} key={latest.nonce ?? "initial"} className="space-y-6" noValidate>
      {latest.message && (
        <div
          role={latest.status === "error" ? "alert" : "status"}
          className={
            latest.status === "error"
              ? "flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              : "flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300"
          }
        >
          {latest.status === "error" ? (
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          {latest.message}
        </div>
      )}

      <FormSection title="Company" description="Shown in the footer, structured data and page titles.">
        <FormField label="Company name" name="name" required defaultValue={v("name")} error={e("name")} />
        <FormField label="Short name" name="shortName" required defaultValue={v("shortName")} error={e("shortName")} />
        <FormField label="Tagline" name="tagline" required full defaultValue={v("tagline")} error={e("tagline")} />
        <FormField label="Founded year" name="foundedYear" required inputMode="numeric" defaultValue={v("foundedYear")} error={e("foundedYear")} />
        <FormField label="Location" name="city" required defaultValue={v("city")} error={e("city")} hint="e.g. Maharashtra, India" />
      </FormSection>

      <FormSection title="Contact" description="Main enquiry details used on the Contact page.">
        <FormField label="Email" name="email" type="email" required inputMode="email" defaultValue={v("email")} error={e("email")} />
        <FormField label="Primary phone" name="phonePrimary" type="tel" required inputMode="tel" defaultValue={v("phonePrimary")} error={e("phonePrimary")} />
        <FormField label="Secondary phone" name="phoneSecondary" type="tel" inputMode="tel" defaultValue={v("phoneSecondary")} error={e("phoneSecondary")} hint="Optional" />
      </FormSection>

      <FormSection title="Sales team">
        <FormField label="Sales email" name="sales.email" type="email" required inputMode="email" defaultValue={v("sales.email")} error={e("sales.email")} />
        <FormField label="Sales phone" name="sales.phone" type="tel" required inputMode="tel" defaultValue={v("sales.phone")} error={e("sales.phone")} />
      </FormSection>

      <FormSection title="HR team">
        <FormField label="HR email" name="hr.email" type="email" required inputMode="email" defaultValue={v("hr.email")} error={e("hr.email")} />
        <FormField label="HR phone" name="hr.phone" type="tel" required inputMode="tel" defaultValue={v("hr.phone")} error={e("hr.phone")} />
      </FormSection>

      <FormSection title="Registered identifiers" description="Shown in the footer as a trust signal.">
        <FormField label="CIN" name="cin" defaultValue={v("cin")} error={e("cin")} />
        <FormField label="GSTIN" name="gstin" defaultValue={v("gstin")} error={e("gstin")} />
        <FormField label="Udyam (MSME)" name="udyam" defaultValue={v("udyam")} error={e("udyam")} />
      </FormSection>

      <FormSection title="Social links" description="Leave a field empty to hide that icon in the footer.">
        <FormField label="LinkedIn" name="social.linkedin" type="url" inputMode="url" placeholder="https://www.linkedin.com/company/…" defaultValue={v("social.linkedin")} error={e("social.linkedin")} />
        <FormField label="X / Twitter" name="social.twitter" type="url" inputMode="url" placeholder="https://x.com/…" defaultValue={v("social.twitter")} error={e("social.twitter")} />
        <FormField label="Facebook" name="social.facebook" type="url" inputMode="url" placeholder="https://facebook.com/…" defaultValue={v("social.facebook")} error={e("social.facebook")} />
        <FormField label="Instagram" name="social.instagram" type="url" inputMode="url" placeholder="https://instagram.com/…" defaultValue={v("social.instagram")} error={e("social.instagram")} />
        <FormField label="YouTube" name="social.youtube" type="url" inputMode="url" placeholder="https://youtube.com/@…" defaultValue={v("social.youtube")} error={e("social.youtube")} />
        <FormField label="GitHub" name="social.github" type="url" inputMode="url" placeholder="https://github.com/…" defaultValue={v("social.github")} error={e("social.github")} />
      </FormSection>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-uk-line bg-uk-card/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (window.confirm("Restore all site settings to the original defaults? Your saved changes will be removed.")) {
              startReset(async () => setResetState(await resetSettingsAction()));
            }
          }}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading disabled:opacity-60"
        >
          {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
          Reset to defaults
        </button>
        <button
          type="submit"
          disabled={busy}
          className="btn-sheen inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-5 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
