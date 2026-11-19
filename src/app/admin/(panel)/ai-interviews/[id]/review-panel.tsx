"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "@/components/admin/toast";
import { APPLICATION_STATUSES, applicationStatusLabel } from "@/lib/applications-validation";
import { HR_COMMENT_MAX, HR_DECISIONS, RECOMMENDATIONS, hrDecisionLabel, recommendationLabel, type Recommendation } from "@/lib/ai-interview/types";
import { decisionAction, overrideAction } from "../actions";

// HR's decision and the recommendation override on the interview page.

const field = "mt-1 block w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-uk-body outline-none focus-visible:border-ring";

export function ReviewPanel({ id, aiRecommendation, override, overrideReason }: { id: string; aiRecommendation: Recommendation | null; override: Recommendation | null; overrideReason: string }) {
  const [dState, decide, dPending] = useActionState(decisionAction, null);
  const [oState, setOverride, oPending] = useActionState(overrideAction, null);
  const [decision, setDecision] = useState("shortlist");
  useEffect(() => void (dState && toast.result(dState, "Saved.")), [dState]);
  useEffect(() => void (oState && toast.result(oState, "Saved.")), [oState]);

  return (
    <div className="space-y-6">
      <form action={decide} className="space-y-3">
        <input type="hidden" name="id" value={id} />
        <label className="block text-sm font-medium text-uk-heading">
          Decision
          <select name="decision" value={decision} onChange={(e) => setDecision(e.target.value)} className={field}>
            {HR_DECISIONS.map((d) => <option key={d} value={d}>{hrDecisionLabel[d]}</option>)}
          </select>
        </label>
        {decision === "move_stage" && (
          <label className="block text-sm font-medium text-uk-heading">
            Stage
            <select name="stage" className={field} defaultValue="">
              <option value="" disabled>Choose…</option>
              {APPLICATION_STATUSES.map((s) => <option key={s} value={s}>{applicationStatusLabel[s]}</option>)}
            </select>
          </label>
        )}
        <label className="block text-sm font-medium text-uk-heading">
          {decision === "comment" ? "Comment (internal)" : "Note (internal, optional)"}
          <textarea name="note" rows={3} maxLength={HR_COMMENT_MAX} className={field} />
        </label>
        <p className="text-xs text-uk-muted">
          {decision === "reassess"
            ? "Creates a new AI interview for this applicant (schedule it from the list). This one stays on record."
            : decision === "comment"
              ? "Only HR sees comments."
              : "Moves the application to the matching stage. No email is sent: use Job applications to email the applicant."}
        </p>
        <button type="submit" disabled={dPending} className="h-10 rounded-lg bg-uk-blue px-4 text-sm font-semibold text-uk-white disabled:opacity-60">
          {dPending ? "Saving…" : "Save"}
        </button>
      </form>

      {aiRecommendation && (
        <form action={setOverride} className="space-y-3 border-t border-uk-line pt-5">
          <input type="hidden" name="id" value={id} />
          <p className="text-sm font-medium text-uk-heading">Override the AI recommendation</p>
          <p className="text-xs text-uk-muted">The AI said: {recommendationLabel[aiRecommendation]}. Your override is shown everywhere instead, marked “HR”, and kept in the audit trail.</p>
          <select name="recommendation" defaultValue={override ?? ""} className={field} aria-label="Recommendation">
            <option value="">No override (use the AI's)</option>
            {RECOMMENDATIONS.map((r) => <option key={r} value={r}>{recommendationLabel[r]}</option>)}
          </select>
          <label className="block text-sm font-medium text-uk-heading">
            Reason (required for an override)
            <textarea name="reason" rows={2} maxLength={1000} defaultValue={overrideReason} className={field} />
          </label>
          <button type="submit" disabled={oPending} className="h-10 rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body hover:bg-uk-surface-2 disabled:opacity-60">
            {oPending ? "Saving…" : "Save override"}
          </button>
        </form>
      )}
    </div>
  );
}
