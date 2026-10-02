"use client";

import Link from "@/components/site/intent-link";
import { useActionState } from "react";
import { CircleAlert, CircleCheck, Loader2, Save } from "lucide-react";
import { FormCheckbox, FormField, FormSection, FormTextarea } from "@/components/admin/form";
import type { EngagementModelValues } from "@/lib/engagement-validation";
import { createEngagementModelAction, updateEngagementModelAction, type EngagementModelFormState } from "./actions";
import { useResultToast } from "@/components/admin/toast";


export function EngagementModelForm({
  mode,
  initial,
  slug,
}: {
  mode: "create" | "edit";
  initial: EngagementModelValues;
  /** id of the model being edited (edit mode only) */
  slug?: string;
}) {
  const [state, action, saving] = useActionState<EngagementModelFormState, FormData>(
    mode === "create" ? createEngagementModelAction : updateEngagementModelAction.bind(null, slug ?? ""),
    {}
  );
  const values = state.values ?? initial;
  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  useResultToast(state);

  return (
    // key remounts the inputs so defaultValues refresh after each result
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

      <FormSection title="Model" description="Shown as a card in the engagement models.">
        <FormField label="Name" name="name" required defaultValue={values.name} error={errors.name} hint={"e.g. Fixed-bid project"} />
        <FormField label="Best for" name="best" required defaultValue={values.best} error={errors.best} hint={"Short tag, e.g. Well-defined scope"} />
        <FormTextarea label="Description" name="desc" required full defaultValue={values.desc} error={errors.desc} rows={4} hint={"Up to 400 characters."} />
        <FormTextarea label="Bullets" name="bullets" required full defaultValue={values.bullets} error={errors.bullets} rows={5} hint={"One per line, up to 8."} />
      </FormSection>

      <FormSection title="Visibility">
        <FormCheckbox label="Published" name="published" defaultChecked={values.published === "on"} hint="Untick to hide it from the live site (draft)." full />
      </FormSection>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-uk-line bg-uk-card/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <Link
          href="/admin/engagement"
          className="inline-flex h-10 items-center rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
        >
          Back to engagement models
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="btn-sheen inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-5 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : mode === "create" ? "Add model" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
