"use client";

import Link from "@/components/site/intent-link";
import { useActionState } from "react";
import { CircleAlert, CircleCheck, Loader2, Save } from "lucide-react";
import { FormCheckbox, FormField, FormSection, FormSelect, FormTextarea } from "@/components/admin/form";
import { industryIcons, type IndustryValues } from "@/lib/industries-validation";
import { createIndustryAction, updateIndustryAction, type IndustryFormState } from "./actions";

const iconOptions = industryIcons.map((i) => ({ value: i, label: i }));

export function IndustryForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial: IndustryValues;
}) {
  const [state, action, saving] = useActionState<IndustryFormState, FormData>(
    mode === "create" ? createIndustryAction : updateIndustryAction.bind(null, initial.slug),
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

      <FormSection title="Overview" description="Shown in the home-page switchboard, on /industries and at the top of the sector page.">
        <FormField label="Name" name="name" required defaultValue={values.name} error={errors.name} hint="e.g. FinTech & Lending" />
        <FormField
          label="Slug"
          name="slug"
          required
          readOnly={mode === "edit"}
          defaultValue={values.slug}
          error={errors.slug}
          hint={mode === "edit" ? "The slug can't be changed after creation." : "Lowercase, e.g. fintech-lending. Becomes /industries/<slug>."}
        />
        <FormSelect label="Icon" name="icon" required defaultValue={values.icon} error={errors.icon} options={iconOptions} />
        <FormTextarea label="Summary" name="blurb" required full rows={3} defaultValue={values.blurb} error={errors.blurb} hint="Up to 400 characters. Also the search-result description." />
        <FormTextarea label="Overview" name="overview" required full rows={10} defaultValue={values.overview} error={errors.overview} hint="Up to 5 paragraphs — the failure mode, its cost, then how we build differently. Separate paragraphs with a blank line." />
        <FormTextarea label="Outcomes" name="outcomes" required full rows={4} defaultValue={values.outcomes} error={errors.outcomes} hint="Short tags, e.g. “Audit-ready ledgers”. One per line, up to 8." />
      </FormSection>

      <FormSection title="What we build for this sector">
        <FormTextarea label="Challenges" name="challenges" required full rows={5} defaultValue={values.challenges} error={errors.challenges} hint="The pain points we design against. One per line." />
        <FormTextarea label="Compliance" name="compliance" required full rows={5} defaultValue={values.compliance} error={errors.compliance} hint="Regulations and standards we build for. One per line." />
        <FormTextarea label="Deliverables" name="deliverables" required full rows={6} defaultValue={values.deliverables} error={errors.deliverables} hint={"One per line as “title | description”, up to 10. Example: Loan origination | Intake, KYC and approvals"} />
        <FormTextarea label="FAQs" name="faqs" required full rows={6} defaultValue={values.faqs} error={errors.faqs} hint={"One per line as “question | answer”, up to 10. Also used for search-result FAQ markup."} />
      </FormSection>

      <FormSection title="Proof (optional)">
        <FormTextarea label="Proof points" name="proof" full rows={4} defaultValue={values.proof} error={errors.proof} hint={"One per line as “value | label”, up to 4. Example: 65% | Faster loan processing"} />
        <FormField label="Featured case study — title" name="featuredCaseTitle" defaultValue={values.featuredCaseTitle} error={errors.featuredCaseTitle} hint="Optional. Needs a link too." />
        <FormField label="Featured case study — link" name="featuredCaseHref" defaultValue={values.featuredCaseHref} error={errors.featuredCaseHref} hint="e.g. /case-studies/loan-origination-nbfc" />
      </FormSection>

      <FormSection title="Visibility">
        <FormCheckbox label="Published" name="published" defaultChecked={values.published === "on"} hint="Untick to hide it from the live site (draft)." full />
      </FormSection>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-uk-line bg-uk-card/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <Link
          href="/admin/industries"
          className="inline-flex h-10 items-center rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
        >
          Back to industries
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="btn-sheen inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-5 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : mode === "create" ? "Create industry" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
