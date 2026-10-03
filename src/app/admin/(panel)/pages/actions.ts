"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import { validateSection } from "@/lib/home-schema";
import { PAGES_TAG, resetPageContent, writePageContent } from "@/lib/pages-store";
import { PAGE_DEF, checkPagePairs, isPageKey, pageInfo } from "@/lib/pages-schema";
import type { HomeSectionState } from "../home/actions";

function refresh(key: string) {
  revalidateTag(PAGES_TAG, { expire: 0 });
  const page = pageInfo(key);
  if (page) revalidatePath(page.href);
  revalidatePath("/admin/pages", "layout");
}

const noDb = (nonce: number): HomeSectionState => ({
  status: "error", message: "Database is not connected (MONGODB_URI missing).", nonce,
});

export async function savePageAction(key: string, _prev: HomeSectionState, formData: FormData): Promise<HomeSectionState> {
  await requireAdmin();
  const nonce = Date.now();
  if (!isPageKey(key)) return { status: "error", message: "Unknown page.", nonce };
  let parsed: { values?: unknown };
  try {
    parsed = JSON.parse(String(formData.get("payload") ?? "{}"));
  } catch {
    return { status: "error", message: "Could not read the form. Reload the page and try again.", nonce };
  }
  const result = validateSection(PAGE_DEF, parsed.values);
  const errors = result.ok ? checkPagePairs(result.value) : result.errors;
  if (!result.ok || Object.keys(errors).length) {
    return { status: "error", message: "Please fix the highlighted fields.", errors, nonce };
  }
  if (!hasDatabaseUrl()) return noDb(nonce);
  try {
    await writePageContent(key, result.value);
  } catch (e) {
    return { status: "error", message: `Could not save: ${e instanceof Error ? e.message : "database error"}`, nonce };
  }
  refresh(key);
  return { status: "saved", message: "Saved. The page is updating.", values: result.value, visible: true, nonce };
}

export async function resetPageAction(key: string): Promise<HomeSectionState> {
  await requireAdmin();
  const nonce = Date.now();
  if (!isPageKey(key)) return { status: "error", message: "Unknown page.", nonce };
  if (!hasDatabaseUrl()) return noDb(nonce);
  try {
    await resetPageContent(key);
  } catch (e) {
    return { status: "error", message: `Could not reset: ${e instanceof Error ? e.message : "database error"}`, nonce };
  }
  refresh(key);
  return { status: "reset", message: "Restored the page's original text and removed its extra blocks.", nonce };
}
