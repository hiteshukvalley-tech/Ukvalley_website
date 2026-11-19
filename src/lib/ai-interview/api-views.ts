import "server-only";
import { effectiveRecommendation, type InterviewListItem, type InterviewRecord } from "./store";
import { candidateIdFor, configIdFor, jobIdFor } from "./models";

// What the HR REST API returns for an interview: never the link token, its
// hash or the device key, and never the questions' scoring intent in lists.

export function listView(i: InterviewListItem) {
  const { device, ...rest } = i as InterviewListItem & { tokenEnc?: unknown; tokenHash?: unknown };
  delete (rest as Record<string, unknown>).tokenEnc;
  delete (rest as Record<string, unknown>).tokenHash;
  return {
    ...rest,
    candidateId: i.candidateId ?? candidateIdFor(i.candidate.email),
    jobId: i.jobId ?? jobIdFor(i),
    deviceBound: !!device,
    finalRecommendation: effectiveRecommendation(i),
    overallScore: i.evaluation.result?.overall ?? null,
  };
}

export function detailView(i: InterviewRecord) {
  const { tokenEnc: _t, tokenHash: _h, device, ...rest } = i;
  void _t;
  void _h;
  return {
    ...rest,
    candidateId: i.candidateId ?? candidateIdFor(i.candidate.email),
    jobId: i.jobId ?? jobIdFor(i),
    configId: i.configId ?? configIdFor(i.config),
    deviceBound: !!device,
    finalRecommendation: effectiveRecommendation(i),
    recordingUrls: i.recording.deletedAt
      ? []
      : Array.from({ length: i.recording.segments }, (_, n) => `/admin/ai-interviews/${i.id}/recording/${n}`),
  };
}
