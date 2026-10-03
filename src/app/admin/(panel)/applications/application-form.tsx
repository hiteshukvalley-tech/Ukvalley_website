"use client";

import { useActionState, useState, useTransition } from "react";
import { CircleAlert, CircleCheck, Loader2, Save, Trash2 } from "lucide-react";
import { FormSection, FormSelect, FormTextarea } from "@/components/admin/form";
import { toast, useResultToast } from "@/components/admin/toast";
import { APPLICATION_STATUSES, applicationStatusLabel } from "@/lib/applications-validation";
import { deleteApplicationAction, updateApplicationAction, type ApplicationFormState } from "./actions";

const statusOptions = APPLICATION_STATUSES.map((s) => ({ value: s, label: applicationStatusLabel[s] }));

export function ApplicationForm({
  id,
  name,
  initial,
}: {
  id: string;
  name: string;
  initial: { status: string; note: string };
}) {
  const [state, action, saving] = useActionState<ApplicationFormState, FormData>(updateApplicationAction.bind(null, id), {});
  const values = state.values ?? initial;
  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  useResultToast(state);

  const [deleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string>();

  return (
    <div className="space-y-6">
      {/* key remounts the inputs so defaultValues refresh after each result */}
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
            {state.status === "error" ? <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> : <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />}
            {state.message}
          </div>
        )}

        <FormSection title="Hiring status" description="Only visible here — never shown to the applicant.">
          <FormSelect label="Status" name="status" required defaultValue={values.status} error={errors.status} options={statusOptions} />
          <FormTextarea label="Internal note" name="note" full rows={5} defaultValue={values.note} error={errors.note} hint="Interview feedback, next steps … up to 2000 characters." />
        </FormSection>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-sheen inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-5 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>

      <section className="rounded-2xl border border-uk-line bg-uk-card p-6">
        <h2 className="font-heading text-lg font-semibold text-uk-heading">Delete application</h2>
        <p className="mt-1 text-sm text-uk-muted">Permanently removes this application and its resume. This can&apos;t be undone.</p>
        <button
          type="button"
          disabled={deleting}
          onClick={() => {
            if (window.confirm(`Delete the application from “${name}”? This can't be undone.`)) {
              startDelete(async () => {
                const r = await deleteApplicationAction(id);
                // On success the action redirects; a result only comes back on failure.
                if (r && !r.ok) {
                  setDeleteError(r.message);
                  toast.error(r.message ?? "Could not delete.");
                }
              });
            }
          }}
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-destructive/40 px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
        >
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Delete application
        </button>
        {deleteError && <p role="alert" className="mt-2 text-xs text-destructive">{deleteError}</p>}
      </section>
    </div>
  );
}
