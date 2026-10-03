"use client";

import Link from "@/components/site/intent-link";
import { useActionState } from "react";
import { Loader2, Save } from "lucide-react";
import { FormCheckbox, FormField, FormSection, FormTextarea } from "@/components/admin/form";
import type { BlogValues } from "@/lib/blog-validation";
import { createPostAction, updatePostAction, type BlogFormState } from "./actions";
import { useResultToast } from "@/components/admin/toast";

export function BlogForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial: BlogValues;
}) {
  const [state, action, saving] = useActionState<BlogFormState, FormData>(
    mode === "create" ? createPostAction : updatePostAction.bind(null, initial.slug),
    {}
  );
  const values = state.values ?? initial;
  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  useResultToast(state);

  return (
    // key remounts the inputs so defaultValues refresh after each result
    <form action={action} key={state.nonce ?? "initial"} className="space-y-6" noValidate>

      <FormSection title="Post details" description="Shown on the blog listing, the home page and at the top of the article.">
        <FormField label="Title" name="title" required full defaultValue={values.title} error={errors.title} />
        <FormField
          label="Slug"
          name="slug"
          required
          readOnly={mode === "edit"}
          defaultValue={values.slug}
          error={errors.slug}
          hint={mode === "edit" ? "The slug can't be changed after creation." : "Lowercase, e.g. crm-vs-erp. Becomes /blog/<slug>."}
        />
        <FormField label="Category" name="category" required defaultValue={values.category} error={errors.category} hint="e.g. Engineering, Buyer's guide." />
        <FormField label="Publish date" name="date" type="date" required defaultValue={values.date} error={errors.date} />
        <FormField label="Read time (minutes)" name="readMinutes" required inputMode="numeric" defaultValue={values.readMinutes} error={errors.readMinutes} />
        <FormTextarea label="Summary" name="excerpt" required full rows={3} defaultValue={values.excerpt} error={errors.excerpt} hint="Up to 300 characters. Also used as the search-result description." />
      </FormSection>

      <FormSection title="Article">
        <FormTextarea
          label="Body"
          name="body"
          required
          full
          rows={16}
          defaultValue={values.body}
          error={errors.body}
          hint="Separate paragraphs with a blank line."
        />
      </FormSection>

      <FormSection title="Visibility">
        <FormCheckbox label="Published" name="published" defaultChecked={values.published === "on"} hint="Untick to hide it from the live site (draft)." full />
      </FormSection>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-uk-line bg-uk-card/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <Link
          href="/admin/blog"
          className="inline-flex h-10 items-center rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
        >
          Back to blog
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="btn-sheen inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-5 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : mode === "create" ? "Create post" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
