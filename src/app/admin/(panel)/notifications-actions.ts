"use server";

import { requireAdmin } from "@/lib/admin-session";
import { canUseArea } from "@/lib/admin-access";
import { hasDatabaseUrl } from "@/lib/db/client";
import { getNotifications, type NotificationFeed } from "@/lib/notifications";
import { markNotificationsSeen } from "@/lib/profiles-store";

const EMPTY: NotificationFeed = { items: [], unread: 0, problems: [], mailbox: false };

/** The top bar's notification bell: the signed-in user's feed (job applications access only). */
export async function loadNotificationsAction(): Promise<NotificationFeed> {
  const me = await requireAdmin();
  if (!canUseArea(me.role, me.access, "applications")) return EMPTY;
  try {
    return await getNotifications(me);
  } catch (e) {
    return { ...EMPTY, problems: [e instanceof Error ? e.message : "Could not load notifications."] };
  }
}

/** "Mark all as read" in the notification panel. */
export async function markNotificationsReadAction(): Promise<{ ok: boolean }> {
  const me = await requireAdmin("applications");
  if (!hasDatabaseUrl()) return { ok: false };
  try {
    await markNotificationsSeen(me);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
