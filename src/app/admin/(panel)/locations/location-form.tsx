"use client";

import Link from "@/components/site/intent-link";
import { useActionState } from "react";
import { Loader2, Save } from "lucide-react";
import { FormCheckbox, FormField, FormSection, FormSelect, FormTextarea } from "@/components/admin/form";
import { locationIcons, locationTypes, type LocationValues } from "@/lib/locations-validation";
import { createLocationAction, updateLocationAction, type LocationFormState } from "./actions";
import { useResultToast } from "@/components/admin/toast";

const iconOptions = locationIcons.map((i) => ({ value: i, label: i }));
const typeOptions = locationTypes.map((t) => ({ value: t, label: t }));

export function LocationForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial: LocationValues;
}) {
  const [state, action, saving] = useActionState<LocationFormState, FormData>(
    mode === "create" ? createLocationAction : updateLocationAction.bind(null, initial.slug),
    {}
  );
  const values = state.values ?? initial;
  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  useResultToast(state);
  const pipe = (ex: string) => `One per line, two parts separated by |. Example: ${ex}`;

  return (
    // key remounts the inputs so defaultValues refresh after each result
    <form action={action} key={state.nonce ?? "initial"} className="space-y-6" noValidate>

      <FormSection title="Location" description="Shown on /locations and at the top of the location page.">
        <FormField label="City" name="city" required defaultValue={values.city} error={errors.city} hint="e.g. Pune" />
        <FormField
          label="Slug"
          name="slug"
          required
          readOnly={mode === "edit"}
          defaultValue={values.slug}
          error={errors.slug}
          hint={mode === "edit" ? "The slug can't be changed after creation." : "Lowercase, e.g. pune. Becomes /locations/<slug>."}
        />
        <FormField label="Region" name="region" required defaultValue={values.region} error={errors.region} hint="State or province, e.g. Maharashtra" />
        <FormField label="Country" name="country" required defaultValue={values.country} error={errors.country} />
        <FormSelect label="Type" name="type" required defaultValue={values.type} error={errors.type} options={typeOptions} hint="Decides which group it appears in on /locations." />
        <FormSelect label="Icon" name="icon" required defaultValue={values.icon} error={errors.icon} options={iconOptions} />
        <FormTextarea label="Blurb" name="blurb" required full rows={3} defaultValue={values.blurb} error={errors.blurb} hint="Up to 400 characters. Used in the page header and as the search-result description." />
      </FormSection>

      <FormSection title="Details">
        <FormTextarea label="Paragraphs" name="paragraphs" required full rows={10} defaultValue={values.paragraphs} error={errors.paragraphs} hint="Up to 6 paragraphs. Separate paragraphs with a blank line." />
        <FormTextarea label="Services" name="services" required full rows={5} defaultValue={values.services} error={errors.services} hint="One per line, up to 10." />
        <FormTextarea label="Proof points" name="proof" required full rows={3} defaultValue={values.proof} error={errors.proof} hint={pipe("24h | Response SLA")} />
        <FormField label="Timezone" name="timezone" required defaultValue={values.timezone} error={errors.timezone} hint="e.g. IST (UTC+5:30)" />
        <FormField label="Languages" name="languages" required defaultValue={values.languages} error={errors.languages} hint="Comma-separated, e.g. English, Hindi." />
        <FormField label="Address (optional)" name="address" full defaultValue={values.address} error={errors.address} />
        <FormTextarea label="FAQs" name="faqs" required full rows={6} defaultValue={values.faqs} error={errors.faqs} hint={pipe("Can we visit? | Yes, by appointment.")} />
      </FormSection>

      <FormSection title="Visibility">
        <FormCheckbox label="Published" name="published" defaultChecked={values.published === "on"} hint="Untick to hide it from the live site (draft)." full />
      </FormSection>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-uk-line bg-uk-card/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <Link
          href="/admin/locations"
          className="inline-flex h-10 items-center rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
        >
          Back to locations
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="btn-sheen inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-5 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : mode === "create" ? "Create location" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
