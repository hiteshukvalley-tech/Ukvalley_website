import { fail, hrApi, int, ok, text } from "@/lib/ai-interview/http";
import { listNotifications, type Channel, type NotificationStatus } from "@/lib/ai-interview/store";

export const dynamic = "force-dynamic";

const CHANNELS: Channel[] = ["email", "whatsapp", "calendar"];
const STATUSES: NotificationStatus[] = ["queued", "sent", "delivered", "read", "failed", "skipped"];

/**
 * GET /admin/api/ai-interviews/notifications: the notification log (type,
 * recipient, sent time, delivery status, failure reason, attempts).
 * Query: interviewId, channel, status, page, pageSize.
 */
export function GET(request: Request) {
  return hrApi(request, async () => {
    const p = new URL(request.url).searchParams;
    const channel = p.get("channel") as Channel;
    const status = p.get("status") as NotificationStatus;
    const res = await listNotifications({
      interviewId: text(p.get("interviewId"), 64) || undefined,
      channel: CHANNELS.includes(channel) ? channel : "",
      status: STATUSES.includes(status) ? status : "",
      page: int(p.get("page"), 1),
      pageSize: int(p.get("pageSize"), 50, 100),
    });
    if (res.dbError) return fail(res.dbError, 503);
    return ok(res);
  });
}
