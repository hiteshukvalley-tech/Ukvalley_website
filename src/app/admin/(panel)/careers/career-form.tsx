"use client";

import Link from "@/components/site/intent-link";
import { useActionState } from "react";
import { CircleAlert, CircleCheck, Loader2, Save } from "lucide-react";
import { FormCheckbox, FormField, FormSection, FormTextarea } from "@/components/admin/form";
import type { CareerValues } from "@/lib/careers-validation";
import { createCareerAction, updateCareerAction, type CareerFormState } from "./actions";
import { useResultToast } from "@/components/admin/toast";


export function CareerForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial: CareerValues;
}) {
  const [state, action, saving] = useActionState<CareerFormState, FormData>(
    mode === "create" ? createCareerAction : updateCareerAction.bind(null, initial.slug),
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

      <FormSection title="Role" description="Shown in the open-roles list on /careers and the Team page.">
        <FormField label="Role" name="role" required full defaultValue={values.role} error={errors.role} hint="e.g. Senior React / Next.js Engineer" />
        <FormField
          label="Slug"
          name="slug"
          required
          readOnly={mode === "edit"}
          defaultValue={values.slug}
          error={errors.slug}
          hint={mode === "edit" ? "The slug can't be changed after creation." : "Lowercase, e.g. senior-react-engineer. Used as the role's id."}
        />
        <FormField label="Location" name="location" required defaultValue={values.location} error={errors.location} hint="e.g. Remote (India), Hybrid (India)" />
        <FormField label="Type" name="type" required defaultValue={values.type} error={errors.type} hint="e.g. Full-time, Part-time, Contract, Internship" />
        <FormTextarea label="Summary" name="summary" required full rows={3} defaultValue={values.summary} error={errors.summary} hint="Up to 300 characters. Shown under the role title." />
      </FormSection>

      <FormSection title="Details">
        <FormTextarea label="Responsibilities" name="responsibilities" required full rows={6} defaultValue={values.responsibilities} error={errors.responsibilities} hint="One per line, up to 10." />
        <FormTextarea label="Requirements" name="requirements" required full rows={6} defaultValue={values.requirements} error={errors.requirements} hint="One per line, up to 10." />
        <FormTextarea label="Perks" name="perks" required full rows={5} defaultValue={values.perks} error={errors.perks} hint="One per line, up to 10." />
      </FormSection>

      <FormSection title="Visibility">
        <FormCheckbox label="Published" name="published" defaultChecked={values.published === "on"} hint="Untick to hide it from the live site (draft)." full />
      </FormSection>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-uk-line bg-uk-card/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <Link
          href="/admin/careers"
          className="inline-flex h-10 items-center rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
        >
          Back to careers
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="btn-sheen inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-5 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : mode === "create" ? "Create role" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
