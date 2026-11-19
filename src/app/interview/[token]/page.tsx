import type { Metadata } from "next";
import { OFFICIAL_LOGO } from "@/lib/site-content-schema";
import { deviceOk, interviewForToken, portalState, type PortalState } from "@/lib/ai-interview/portal";
import { audit, updateInterview } from "@/lib/ai-interview/store";
import { DEFAULT_SETTINGS } from "@/lib/ai-interview/types";
import { InterviewPortal } from "./portal";

// The candidate's interview page: /interview/<token>. No site header or
// footer (a quiet, distraction-free page), never indexed, never tracked
// (the token in the address is the candidate's credential).

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your interview",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const INVALID: PortalState = {
  phase: "invalid", company: "Ukvalley Technologies", candidateName: "", position: "", startsAt: null, closesAt: null,
  durationMinutes: DEFAULT_SETTINGS.durationMinutes, sections: [], questionCount: 0, mode: "video", language: "en-IN", speechProvider: "browser",
  retentionDays: 0, consented: false, resuming: false, question: null, answered: 0, test: null, segment: 0, startedAt: null, hrEmail: "", reschedule: null,
};

export default async function InterviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let i: Awaited<ReturnType<typeof interviewForToken>>;
  try {
    i = await interviewForToken(token);
  } catch {
    // The database is unreachable: not an invalid link, just try again shortly.
    return (
      <main id="main" className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">Your interview is temporarily unavailable</h1>
          <p className="mt-2 text-muted-foreground">Please refresh this page in a minute. Your link is still valid.</p>
        </div>
      </main>
    );
  }

  // Opening the page while the interview is running means the earlier page is
  // gone (reload, crash, closed tab): treat it as an interruption, so the
  // candidate goes through the camera check again and continues where they stopped.
  if (i && i.status === "in_progress" && (await deviceOk(i))) {
    i = (await updateInterview(i.id, { $set: { status: "interrupted" } }, { status: "in_progress" })) ?? i;
    await audit({ interviewId: i.id, applicationId: i.applicationId, candidateName: i.candidate.name, action: "interrupted", by: "candidate", detail: "page reopened" });
  }

  const state = i ? await portalState(i) : INVALID;
  return (
    <main id="main" className="min-h-screen bg-background">
      <InterviewPortal token={token} initial={state} logo={OFFICIAL_LOGO} />
    </main>
  );
}
