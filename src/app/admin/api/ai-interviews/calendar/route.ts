import { hrApi, ok } from "@/lib/ai-interview/http";
import { calendarStatus, googleConfigured } from "@/lib/ai-interview/google-calendar";

export const dynamic = "force-dynamic";

/**
 * GET /admin/api/ai-interviews/calendar: Google Calendar connection status.
 * Connecting needs the Google consent screen in a browser, so it starts from
 * GET /admin/ai-interviews/settings/google/connect (Settings → "Connect Google Calendar").
 * Events are created, moved and cancelled by the interview itself (schedule,
 * reschedule, cancel), never directly.
 */
export function GET(request: Request) {
  return hrApi(request, async () => {
    const s = await calendarStatus();
    return ok({
      ...s,
      credentialsSet: googleConfigured(),
      connectUrl: "/admin/ai-interviews/settings/google/connect",
    });
  });
}
