"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import { CHROME_TAG, resetChrome, writeChrome } from "@/lib/home-store";
import { validateSection } from "@/lib/home-schema";
import { CHROME_DEFS, isChromeKey } from "@/lib/site-content-schema";
import type { HomeSectionState } from "../home/actions";

// The header and footer show on every page, so a save refreshes the whole site.
function refreshWholeSite() {
  revalidateTag(CHROME_TAG, { expire: 0 });
  revalidatePath("/", "layout");
}

const noDb = (nonce: number): HomeSectionState => ({
  status: "error", message: "Database is not connected (MONGODB_URI missing).", nonce,
});

export async function saveChromeAction(part: string, _prev: HomeSectionState, formData: FormData): Promise<HomeSectionState> {
  await requireAdmin();
  const nonce = Date.now();
  if (!isChromeKey(part)) return { status: "error", message: "Unknown part of the site.", nonce };
  let parsed: { values?: unknown };
  try {
    parsed = JSON.parse(String(formData.get("payload") ?? "{}"));
  } catch {
    return { status: "error", message: "Could not read the form. Reload the page and try again.", nonce };
  }
  const result = validateSection(CHROME_DEFS[part], parsed.values);
  if (!result.ok) return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, nonce };
  if (!hasDatabaseUrl()) return noDb(nonce);
  try {
    await writeChrome(part, result.value);
  } catch (e) {
    return { status: "error", message: `Could not save: ${e instanceof Error ? e.message : "database error"}`, nonce };
  }
  refreshWholeSite();
  return { status: "saved", message: "Saved. Every page is updating.", values: result.value, visible: true, nonce };
}

export async function resetChromeAction(part: string): Promise<HomeSectionState> {
  await requireAdmin();
  const nonce = Date.now();
  if (!isChromeKey(part)) return { status: "error", message: "Unknown part of the site.", nonce };
  if (!hasDatabaseUrl()) return noDb(nonce);
  try {
    await resetChrome(part);
  } catch (e) {
    return { status: "error", message: `Could not reset: ${e instanceof Error ? e.message : "database error"}`, nonce };
  }
  refreshWholeSite();
  return { status: "reset", message: "Restored the original text.", nonce };
}
