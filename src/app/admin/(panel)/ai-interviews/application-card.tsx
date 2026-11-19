import Link from "@/components/site/intent-link";
import { Bot } from "lucide-react";
import { latestForApplication, effectiveRecommendation } from "@/lib/ai-interview/store";
import { CreateInterviewForm } from "./create-interview-form";
import { RecommendationBadge, Score, StatusBadge, fmt } from "./ui";

/** On an application's page: its AI interview, or a form to start one. */
export async function AiInterviewCard({ applicationId }: { applicationId: string }) {
  const i = await latestForApplication(applicationId);
  return (
    <section className="rounded-2xl border border-uk-line bg-uk-card p-6">
      <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-semibold text-uk-heading">
        <Bot className="h-5 w-5 text-uk-blue" /> AI interview
      </h2>
      {i ? (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
          <StatusBadge status={i.status} />
          <span className="text-uk-body">{i.schedule ? fmt(i.schedule.startsAt) : "Not scheduled"}</span>
          {i.evaluation.result && <Score value={i.evaluation.result.overall} passing={i.evaluation.result.passingScore} />}
          <RecommendationBadge rec={effectiveRecommendation(i)} overridden={!!i.hr.recommendationOverride} />
          <Link href={`/admin/ai-interviews/${i.id}`} className="font-medium text-uk-blue hover:underline">Open AI interview</Link>
          {["completed", "cancelled", "missed", "expired"].includes(i.status) && (
            <div className="w-full border-t border-uk-line pt-3">
              <p className="mb-2 text-xs text-uk-muted">Start another AI interview for this applicant:</p>
              <CreateInterviewForm applicationId={applicationId} />
            </div>
          )}
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-uk-muted">This applicant has no AI interview yet. Pick a time to send the invitation, or leave it empty to schedule later.</p>
          <CreateInterviewForm applicationId={applicationId} />
        </>
      )}
    </section>
  );
}
