"use client";

import Link from "@/components/site/intent-link";
import { useActionState } from "react";
import { Loader2, Save } from "lucide-react";
import { FormCheckbox, FormField, FormSection, FormTextarea } from "@/components/admin/form";
import type { ProductValues } from "@/lib/products-validation";
import { createProductAction, updateProductAction, type ProductFormState } from "./actions";
import { useResultToast } from "@/components/admin/toast";

export function ProductForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial: ProductValues;
}) {
  const [state, action, saving] = useActionState<ProductFormState, FormData>(
    mode === "create" ? createProductAction : updateProductAction.bind(null, initial.slug),
    {}
  );
  const values = state.values ?? initial;
  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  useResultToast(state);

  return (
    // key remounts the inputs so defaultValues refresh after each result
    <form action={action} key={state.nonce ?? "initial"} className="space-y-6" noValidate>

      <FormSection title="Product card" description="Shown on the home page, /products and at the top of the product page.">
        <FormField label="Name" name="name" required defaultValue={values.name} error={errors.name} />
        <FormField
          label="Slug"
          name="slug"
          required
          readOnly={mode === "edit"}
          defaultValue={values.slug}
          error={errors.slug}
          hint={
            mode === "edit"
              ? "The slug can't be changed after creation."
              : "Lowercase, e.g. script-magix. Becomes /products/<slug>."
          }
        />
        <FormField label="Tagline" name="tagline" required full defaultValue={values.tagline} error={errors.tagline} hint="One short line, e.g. “SIM-based sales engagement”." />
        <FormTextarea label="Description" name="description" required full rows={3} defaultValue={values.description} error={errors.description} hint="Up to 400 characters. Also the search-result description." />
        <FormField label="Platform" name="platform" required defaultValue={values.platform} error={errors.platform} hint="e.g. Flutter · Android" />
        <FormField label="Audience" name="audience" required defaultValue={values.audience} error={errors.audience} hint="Who it's for, e.g. B2B sales teams" />
        <FormTextarea label="Highlights" name="highlights" required full rows={4} defaultValue={values.highlights} error={errors.highlights} hint="Short chips on the card. One per line, up to 8." />
        <FormField label="Headline metric — value" name="metricValue" defaultValue={values.metricValue} error={errors.metricValue} hint="Optional, e.g. 60%" />
        <FormField label="Headline metric — label" name="metricLabel" defaultValue={values.metricLabel} error={errors.metricLabel} hint="Optional, e.g. Lower telephony cost" />
      </FormSection>

      <FormSection title="Product page" description="The detail page at /products/<slug>.">
        <FormTextarea label="The problem it solves" name="problem" required full rows={9} defaultValue={values.problem} error={errors.problem} hint="Up to 5 paragraphs — the failure mode, its cost, then how the product solves it. Separate paragraphs with a blank line." />
        <FormTextarea
          label="Features"
          name="features"
          required
          full
          rows={7}
          defaultValue={values.features}
          error={errors.features}
          hint={"One per line as “title | description”, up to 12. Example: CRM sync | Two-way sync with your CRM"}
        />
        <FormTextarea label="Outcomes" name="outcomes" required full rows={5} defaultValue={values.outcomes} error={errors.outcomes} hint="What customers see after deployment. One per line, up to 8." />
        <FormTextarea label="Use cases" name="useCases" required full rows={4} defaultValue={values.useCases} error={errors.useCases} hint="Typical teams or businesses it fits. One per line, up to 8." />
        <FormTextarea label="Stack" name="stack" required full rows={2} defaultValue={values.stack} error={errors.stack} hint="Comma-separated, e.g. Flutter, Node.js, MongoDB." />
        <FormTextarea
          label="FAQs"
          name="faqs"
          required
          full
          rows={7}
          defaultValue={values.faqs}
          error={errors.faqs}
          hint={"One per line as “question | answer”, up to 10. Also used for search-result FAQ markup."}
        />
      </FormSection>

      <FormSection title="Visibility">
        <FormCheckbox label="Published" name="published" defaultChecked={values.published === "on"} hint="Untick to hide it from the live site (draft)." full />
      </FormSection>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-uk-line bg-uk-card/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <Link
          href="/admin/products"
          className="inline-flex h-10 items-center rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
        >
          Back to products
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="btn-sheen inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-5 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
