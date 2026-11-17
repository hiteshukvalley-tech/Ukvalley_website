"use server";

import { requireAdmin } from "@/lib/admin-session";
import { searchRecords, type RecordResult } from "@/lib/panel-search";

/**
 * The top bar's search over applicants, leads, job openings, content lists
 * and users. Open to every signed-in user; each section is searched only when
 * that user may open it (checked again inside searchRecords).
 */
export async function searchRecordsAction(query: string): Promise<RecordResult> {
  const user = await requireAdmin();
  try {
    return await searchRecords(user.role, user.access, String(query ?? ""));
  } catch {
    return { hits: [], more: 0, dbError: "Could not search the database." };
  }
}
