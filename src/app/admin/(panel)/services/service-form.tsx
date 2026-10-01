"use client";

import Link from "@/components/site/intent-link";
import { useActionState } from "react";
import { CircleAlert, CircleCheck, Loader2, Save } from "lucide-react";
import { FormCheckbox, FormField, FormSection, FormSelect, FormTextarea } from "@/components/admin/form";
import { serviceIcons, type ServiceValues } from "@/lib/services-validation";
import { createServiceAction, updateServiceAction, type ServiceFormState } from "./actions";

const iconOptions = serviceIcons.map((i) => ({ value: i, label: i }));

export function ServiceForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial: ServiceValues;
}) {
  const [state, action, saving] = useActionState<ServiceFormState, FormData>(
    mode === "create" ? createServiceAction : updateServiceAction.bind(null, initial.slug),
    {}
  );
  const values = state.values ?? initial;
  const errors = state.status === "error" ? (state.errors ?? {}) : {};

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

      <FormSection title="Card content" description="What visitors see on the Services section and the /services page.">
        <FormField label="Title" name="title" required full defaultValue={values.title} error={errors.title} />
        <FormField
          label="Slug"
          name="slug"
          required
          readOnly={mode === "edit"}
          defaultValue={values.slug}
          error={errors.slug}
          hint={mode === "edit" ? "The slug can't be changed after creation." : "Lowercase, e.g. data-analytics. Used in the URL."}
        />
        <FormSelect label="Icon" name="icon" required defaultValue={values.icon} error={errors.icon} options={iconOptions} />
        <FormTextarea label="Description" name="blurb" required full rows={3} defaultValue={values.blurb} error={errors.blurb} hint="Up to 300 characters." />
        <FormTextarea
          label="Bullets"
          name="bullets"
          required
          full
          rows={6}
          defaultValue={values.bullets}
          error={errors.bullets}
          hint="One per line, up to 12. The first tile shows all; other tiles show the first three."
        />
      </FormSection>

      <FormSection title="Link & visibility">
        <FormField
          label="Link"
          name="href"
          full
          defaultValue={values.href}
          error={errors.href}
          hint="Leave empty to use /services/<slug>. A new service gets a page built from this description and bullets; the original services keep their full hand-written pages."
        />
        <FormCheckbox label="Published" name="published" defaultChecked={values.published === "on"} hint="Untick to hide it from the live site (draft)." full />
      </FormSection>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-uk-line bg-uk-card/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <Link
          href="/admin/services"
          className="inline-flex h-10 items-center rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
        >
          Back to services
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="btn-sheen inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-5 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : mode === "create" ? "Create service" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
