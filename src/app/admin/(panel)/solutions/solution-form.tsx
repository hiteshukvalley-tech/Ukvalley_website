"use client";

import Link from "@/components/site/intent-link";
import { useActionState } from "react";
import { CircleAlert, CircleCheck, Loader2, Save } from "lucide-react";
import { FormCheckbox, FormField, FormSection, FormSelect, FormTextarea } from "@/components/admin/form";
import { solutionIcons, type SolutionValues } from "@/lib/solutions-validation";
import { createSolutionAction, updateSolutionAction, type SolutionFormState } from "./actions";

type Option = { value: string; label: string };

const iconOptions = solutionIcons.map((i) => ({ value: i, label: i }));

/** A group of tick-boxes that submit one `name` entry per ticked box. */
function CheckGroup({
  legend, name, options, checked, error, hint,
}: {
  legend: string;
  name: string;
  options: Option[];
  checked: string[];
  error?: string;
  hint?: string;
}) {
  return (
    <fieldset className="space-y-2 sm:col-span-2">
      <legend className="text-sm font-medium text-uk-heading">{legend}</legend>
      <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-2 text-sm text-uk-body">
            <input
              type="checkbox"
              name={name}
              value={o.value}
              defaultChecked={checked.includes(o.value)}
              className="h-4 w-4 accent-[var(--uk-blue)]"
            />
            {o.label}
          </label>
        ))}
      </div>
      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-uk-muted">{hint}</p>
      ) : null}
    </fieldset>
  );
}

const split = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

export function SolutionForm({
  mode,
  initial,
  serviceOptions,
  industryOptions,
}: {
  mode: "create" | "edit";
  initial: SolutionValues;
  serviceOptions: Option[];
  industryOptions: Option[];
}) {
  const [state, action, saving] = useActionState<SolutionFormState, FormData>(
    mode === "create" ? createSolutionAction : updateSolutionAction.bind(null, initial.slug),
    {}
  );
  const values = state.values ?? initial;
  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  const pipe = (n: number, ex: string) => `One per line, ${n} parts separated by |. Example: ${ex}`;

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

      <FormSection title="Overview" description="Shown on the Solutions cards and at the top of the solution page.">
        <FormField label="Name" name="name" required defaultValue={values.name} error={errors.name} hint="e.g. CRM Systems" />
        <FormField
          label="Slug"
          name="slug"
          required
          readOnly={mode === "edit"}
          defaultValue={values.slug}
          error={errors.slug}
          hint={mode === "edit" ? "The slug can't be changed after creation." : "Lowercase, e.g. crm. Becomes /solutions/<slug>."}
        />
        <FormField label="Category" name="category" required defaultValue={values.category} error={errors.category} hint="e.g. Sales & customer management" />
        <FormSelect label="Icon" name="icon" required defaultValue={values.icon} error={errors.icon} options={iconOptions} />
        <FormField label="Tagline" name="tagline" required full defaultValue={values.tagline} error={errors.tagline} />
        <FormTextarea label="Description" name="description" required full rows={3} defaultValue={values.description} error={errors.description} hint="Up to 400 characters. Used in the page header and as the search-result description." />
      </FormSection>

      <FormSection title="The story">
        <FormTextarea label="Long description" name="longDescription" required full rows={12} defaultValue={values.longDescription} error={errors.longDescription} hint="Up to 8 paragraphs. Separate paragraphs with a blank line." />
        <FormTextarea label="Pain points" name="painPoints" required full rows={5} defaultValue={values.painPoints} error={errors.painPoints} hint={pipe(2, "Leads get lost | They live in WhatsApp")} />
        <FormTextarea label="Metrics" name="metrics" required full rows={4} defaultValue={values.metrics} error={errors.metrics} hint={"One per line as “value | label”, up to 6. Example: 2.1× | More follow-ups completed"} />
        <FormTextarea label="Outcomes" name="outcomes" required full rows={5} defaultValue={values.outcomes} error={errors.outcomes} hint="Measurable results after go-live. One per line." />
      </FormSection>

      <FormSection title="What's in it">
        <FormTextarea label="Features" name="features" required full rows={8} defaultValue={values.features} error={errors.features} hint={pipe(2, "Audit trail | Every change is logged")} />
        <FormTextarea label="Modules" name="modules" required full rows={6} defaultValue={values.modules} error={errors.modules} hint="One per line, up to 16." />
        <FormTextarea label="Integrations" name="integrations" full rows={3} defaultValue={values.integrations} error={errors.integrations} hint="One per line. Optional." />
        <FormTextarea label="Best for" name="bestFor" required full rows={4} defaultValue={values.bestFor} error={errors.bestFor} hint="Who it suits. One per line." />
      </FormSection>

      <FormSection title="How we deliver it">
        <FormTextarea label="Workflow" name="workflow" required full rows={5} defaultValue={values.workflow} error={errors.workflow} hint={pipe(2, "Prototype in week three | A working pipeline")} />
        <FormTextarea label="Time savings" name="timeSavings" required full rows={5} defaultValue={values.timeSavings} error={errors.timeSavings} hint={pipe(3, "Quotation | 45 min | 5 min")} />
        <FormTextarea label="Quick facts" name="quickFacts" required full rows={5} defaultValue={values.quickFacts} error={errors.quickFacts} hint={"One per line as “label | value | note” (note optional). Example: Timeline | 8–12 weeks | For a first release"} />
        <FormTextarea label="What you provide" name="youProvide" required full rows={4} defaultValue={values.youProvide} error={errors.youProvide} hint="What we need from the client to start well. One per line." />
        <FormTextarea label="FAQs" name="faqs" required full rows={6} defaultValue={values.faqs} error={errors.faqs} hint={pipe(2, "Can it replace Excel? | Yes, fully.")} />
      </FormSection>

      <FormSection title="Related pages" description="Cross-links shown on the solution page.">
        <CheckGroup legend="Related services" name="relatedServices" options={serviceOptions} checked={split(values.relatedServices)} error={errors.relatedServices} />
        <CheckGroup legend="Related industries" name="relatedIndustries" options={industryOptions} checked={split(values.relatedIndustries)} error={errors.relatedIndustries} />
      </FormSection>

      <FormSection title="Visibility">
        <FormCheckbox label="Published" name="published" defaultChecked={values.published === "on"} hint="Untick to hide it from the live site (draft)." full />
      </FormSection>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-uk-line bg-uk-card/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <Link
          href="/admin/solutions"
          className="inline-flex h-10 items-center rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
        >
          Back to solutions
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="btn-sheen inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-5 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : mode === "create" ? "Create solution" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
