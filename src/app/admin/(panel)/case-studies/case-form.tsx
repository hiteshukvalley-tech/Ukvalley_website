"use client";

import Link from "@/components/site/intent-link";
import { useActionState } from "react";
import { Loader2, Save } from "lucide-react";
import { FormCheckbox, FormField, FormSection, FormTextarea } from "@/components/admin/form";
import type { CaseValues } from "@/lib/cases-validation";
import { createCaseAction, updateCaseAction, type CaseFormState } from "./actions";
import { useResultToast } from "@/components/admin/toast";

export function CaseForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial: CaseValues;
}) {
  const [state, action, saving] = useActionState<CaseFormState, FormData>(
    mode === "create" ? createCaseAction : updateCaseAction.bind(null, initial.slug),
    {}
  );
  const values = state.values ?? initial;
  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  useResultToast(state);

  return (
    // key remounts the inputs so defaultValues refresh after each result
    <form action={action} key={state.nonce ?? "initial"} className="space-y-6" noValidate>

      <FormSection title="Overview" description="Shown on the case-study cards and at the top of the page.">
        <FormField label="Title" name="title" required full defaultValue={values.title} error={errors.title} />
        <FormField
          label="Slug"
          name="slug"
          slugFrom="title"
          required
          readOnly={mode === "edit"}
          defaultValue={values.slug}
          error={errors.slug}
          hint={
            mode === "edit"
              ? "The slug can't be changed after creation."
              : "Made from the name as you type; edit it if you like, e.g. loan-origination-nbfc. Becomes /case-studies/<slug>."
          }
        />
        <FormField label="Client" name="client" required defaultValue={values.client} error={errors.client} hint="Anonymised is fine, e.g. “A Tier-1 Indian NBFC”." />
        <FormField label="Sector" name="sector" required defaultValue={values.sector} error={errors.sector} hint="e.g. FinTech. Related case studies match on this." />
        <FormField label="Timeline" name="timeline" required defaultValue={values.timeline} error={errors.timeline} hint="e.g. 14 weeks" />
        <FormField label="Team" name="team" required defaultValue={values.team} error={errors.team} hint="e.g. 6 people" />
        <FormTextarea label="Problem" name="problem" required full rows={3} defaultValue={values.problem} error={errors.problem} hint="The situation before we started." />
        <FormTextarea label="Result" name="result" required full rows={3} defaultValue={values.result} error={errors.result} hint="One or two sentences on what was delivered. Also the search-result description." />
      </FormSection>

      <FormSection title="Results at a glance">
        <FormTextarea
          label="Metrics"
          name="metrics"
          required
          full
          rows={4}
          defaultValue={values.metrics}
          error={errors.metrics}
          hint={"One per line as “value | label”, up to 6. Example: 65% | Faster processing"}
        />
        <FormTextarea
          label="Measured results"
          name="results"
          required
          full
          rows={5}
          defaultValue={values.results}
          error={errors.results}
          hint="One full sentence per line, up to 10."
        />
      </FormSection>

      <FormSection title="The story">
        <FormTextarea label="Industry context" name="industryContext" required full rows={4} defaultValue={values.industryContext} error={errors.industryContext} hint="The sector reality this engagement sat inside." />
        <FormTextarea label="Challenges" name="challenges" required full rows={5} defaultValue={values.challenges} error={errors.challenges} hint="Pain points found on day one. One per line." />
        <FormTextarea label="Approach" name="approach" required full rows={5} defaultValue={values.approach} error={errors.approach} hint="How we worked, step by step. One per line." />
        <FormTextarea label="Solution" name="solution" required full rows={5} defaultValue={values.solution} error={errors.solution} hint="What was actually built." />
        <FormTextarea
          label="Modules"
          name="modules"
          required
          full
          rows={6}
          defaultValue={values.modules}
          error={errors.modules}
          hint={"One per line as “title | description”, up to 20. Example: KYC | Aadhaar and PAN checks"}
        />
      </FormSection>

      <FormSection title="Technology">
        <FormTextarea label="Stack" name="stack" required full rows={2} defaultValue={values.stack} error={errors.stack} hint="Comma-separated, e.g. Next.js, Node.js, PostgreSQL." />
        <FormTextarea label="Integrations" name="integrations" full rows={3} defaultValue={values.integrations} error={errors.integrations} hint="External systems it connects to. One per line. Optional." />
      </FormSection>

      <FormSection title="Client testimonial" description="Names can be anonymised.">
        <FormTextarea label="Quote" name="quote" required full rows={3} defaultValue={values.quote} error={errors.quote} />
        <FormField label="Name" name="quoteName" required defaultValue={values.quoteName} error={errors.quoteName} />
        <FormField label="Role" name="quoteRole" required defaultValue={values.quoteRole} error={errors.quoteRole} hint="e.g. CTO, SaaS platform" />
      </FormSection>

      <FormSection title="Visibility">
        <FormCheckbox label="Published" name="published" defaultChecked={values.published === "on"} hint="Untick to hide it from the live site (draft)." full />
      </FormSection>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-uk-line bg-uk-card/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <Link
          href="/admin/case-studies"
          className="inline-flex h-10 items-center rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
        >
          Back to case studies
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="btn-sheen inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-5 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : mode === "create" ? "Create case study" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
