"use client";

import Link from "@/components/site/intent-link";
import { useActionState } from "react";
import { CircleAlert, CircleCheck, Loader2, Save } from "lucide-react";
import { FormCheckbox, FormField, FormSection, FormSelect, FormTextarea } from "@/components/admin/form";
import { hireIcons, type HireValues } from "@/lib/hire-validation";
import { createHireAction, updateHireAction, type HireFormState } from "./actions";

const iconOptions = hireIcons.map((i) => ({ value: i, label: i }));

export function HireForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial: HireValues;
}) {
  const [state, action, saving] = useActionState<HireFormState, FormData>(
    mode === "create" ? createHireAction : updateHireAction.bind(null, initial.slug),
    {}
  );
  const values = state.values ?? initial;
  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  const pipe = (ex: string) => `One per line, two parts separated by |. Example: ${ex}`;

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

      <FormSection title="Role" description="Shown on /hire and at the top of the role page.">
        <FormField label="Title" name="title" required defaultValue={values.title} error={errors.title} hint="e.g. React Developers" />
        <FormField label="Short label" name="shortLabel" required defaultValue={values.shortLabel} error={errors.shortLabel} hint="e.g. React" />
        <FormField
          label="Slug"
          name="slug"
          required
          readOnly={mode === "edit"}
          defaultValue={values.slug}
          error={errors.slug}
          hint={mode === "edit" ? "The slug can't be changed after creation." : "Lowercase, e.g. react-developers. Becomes /hire/<slug>."}
        />
        <FormSelect label="Icon" name="icon" required defaultValue={values.icon} error={errors.icon} options={iconOptions} />
        <FormField label="Tagline" name="tagline" required full defaultValue={values.tagline} error={errors.tagline} />
        <FormTextarea label="Description" name="description" required full rows={3} defaultValue={values.description} error={errors.description} hint="Up to 400 characters. Used in the page header and as the search-result description." />
        <FormField label="What to call them (optional)" name="noun" defaultValue={values.noun} error={errors.noun} hint="Leave empty for “engineers”. e.g. designers, professionals." />
      </FormSection>

      <FormSection title="The pitch">
        <FormTextarea label="Long description" name="longDescription" required full rows={10} defaultValue={values.longDescription} error={errors.longDescription} hint="Up to 6 paragraphs. Separate paragraphs with a blank line." />
        <FormTextarea label="Metrics" name="metrics" required full rows={3} defaultValue={values.metrics} error={errors.metrics} hint={"One per line as “value | label”, up to 6. Example: 48h | Typical time to start"} />
        <FormTextarea label="Skills" name="skills" required full rows={7} defaultValue={values.skills} error={errors.skills} hint={pipe("TypeScript | Strict typing everywhere")} />
        <FormTextarea label="Technologies" name="techs" required full rows={2} defaultValue={values.techs} error={errors.techs} hint="Comma-separated, e.g. React 19, TypeScript, Next.js." />
      </FormSection>

      <FormSection title="How hiring works">
        <FormTextarea label="Engagement models" name="engagement" required full rows={4} defaultValue={values.engagement} error={errors.engagement} hint={pipe("Full-time dedicated | One engineer, 160 hrs/month")} />
        <FormTextarea label="Process" name="process" required full rows={5} defaultValue={values.process} error={errors.process} hint={pipe("Meet the engineer | You interview them directly")} />
        <FormTextarea label="FAQs" name="faqs" required full rows={6} defaultValue={values.faqs} error={errors.faqs} hint={pipe("How fast can they start? | Within 48 hours.")} />
      </FormSection>

      <FormSection title="Visibility">
        <FormCheckbox label="Published" name="published" defaultChecked={values.published === "on"} hint="Untick to hide it from the live site (draft)." full />
      </FormSection>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-uk-line bg-uk-card/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <Link
          href="/admin/hire"
          className="inline-flex h-10 items-center rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
        >
          Back to hire roles
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
