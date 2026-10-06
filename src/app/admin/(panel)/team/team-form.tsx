"use client";

import Link from "@/components/site/intent-link";
import { useActionState, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { FormCheckbox, FormField, FormSection, FormTextarea } from "@/components/admin/form";
import type { TeamValues } from "@/lib/team-validation";
import { createTeamAction, updateTeamAction, type TeamFormState } from "./actions";
import { useResultToast } from "@/components/admin/toast";
import { ImageInput } from "../home/section-editor";


export function TeamForm({
  mode,
  initial,
  slug,
}: {
  mode: "create" | "edit";
  initial: TeamValues;
  /** id of the member being edited (edit mode only) */
  slug?: string;
}) {
  const [state, action, saving] = useActionState<TeamFormState, FormData>(
    mode === "create" ? createTeamAction : updateTeamAction.bind(null, slug ?? ""),
    {}
  );
  const values = state.values ?? initial;
  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  useResultToast(state);
  const [image, setImage] = useState(values.image ?? "");

  return (
    // key remounts the inputs so defaultValues refresh after each result
    <form action={action} key={state.nonce ?? "initial"} className="space-y-6" noValidate>

      <FormSection title="Member" description="Shown on /about and /team.">
        <FormField label="Name" name="name" required defaultValue={values.name} error={errors.name} hint={mode === "edit" ? undefined : "e.g. Shital Jain"} />
        <FormField label="Role" name="role" required defaultValue={values.role} error={errors.role} hint="e.g. COO / Managing Director" />
        <FormField label="Focus" name="focus" required full defaultValue={values.focus} error={errors.focus} hint="Short tag, e.g. Delivery & Process" />
        <div className="sm:col-span-2">
          <ImageInput id="team-image" label="Photo" value={image} onChange={setImage} error={errors.image} aspect="1/1" hint="Upload a photo or paste a link. The website shows it as a square, so crop it to a head-and-shoulders square when the editor opens. Leave empty to show initials." />
          <input type="hidden" name="image" value={image} />
        </div>
        <FormTextarea label="Bio" name="bio" required full rows={4} defaultValue={values.bio} error={errors.bio} hint="Up to 400 characters." />
      </FormSection>

      <FormSection title="Visibility">
        <FormCheckbox label="Published" name="published" defaultChecked={values.published === "on"} hint="Untick to hide it from the live site (draft)." full />
      </FormSection>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-uk-line bg-uk-card/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <Link
          href="/admin/team"
          className="inline-flex h-10 items-center rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
        >
          Back to team
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="btn-sheen inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-5 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : mode === "create" ? "Add member" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
