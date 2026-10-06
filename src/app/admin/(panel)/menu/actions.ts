"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import { isMenuIcon } from "@/lib/menu-icon-keys";
import { validateSection } from "@/lib/home-schema";
import {
  MAIN_PAGE_DEF, MAX_MENU_ITEMS, checkMainPagePairs, isMainPageSlug, validateMenu,
} from "@/lib/menu-schema";
import {
  MENU_TAG, createMainSection, deleteMainPage, getMenuForAdmin, resetMenu, writeMainPage, writeMenu,
  type NewSectionKind,
} from "@/lib/menu-store";
import type { HomeSectionState } from "../home/actions";

export type MenuState = {
  status?: "saved" | "error";
  message?: string;
  errors?: Record<string, string>;
  nonce?: number;
};

// The menu is in the header of every page.
function refresh() {
  revalidateTag(MENU_TAG, { expire: 0 });
  revalidatePath("/", "layout");
}

const NO_DB = "Database is not connected (MONGODB_URI missing).";
const dbMsg = (e: unknown) => (e instanceof Error ? e.message : "database error");

/** Saves the whole menu: order, names, visibility and links. */
export async function saveMenuAction(payload: string): Promise<MenuState> {
  await requireAdmin("menu");
  const nonce = Date.now();
  let raw: unknown;
  try {
    raw = JSON.parse(String(payload));
  } catch {
    return { status: "error", message: "Could not read the menu. Reload the page and try again.", nonce };
  }
  const result = validateMenu(raw);
  if (!result.ok) return { status: "error", message: result.message, errors: result.errors, nonce };
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, nonce };
  try {
    await writeMenu(result.items);
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMsg(e)}`, nonce };
  }
  refresh();
  revalidatePath("/admin/menu", "layout");
  return { status: "saved", message: "Menu saved. Every page is updating.", nonce };
}

export async function resetMenuAction(): Promise<MenuState> {
  await requireAdmin("menu");
  const nonce = Date.now();
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, nonce };
  try {
    await resetMenu();
  } catch (e) {
    return { status: "error", message: `Could not reset: ${dbMsg(e)}`, nonce };
  }
  refresh();
  revalidatePath("/admin/menu", "layout");
  return { status: "saved", message: "The original menu is back. Pages you added are kept — add them to the menu again if needed.", nonce };
}

/** Adds a main section after the existing ones (so beside Insights) and opens its editor. */
export async function createMainSectionAction(_prev: MenuState, formData: FormData): Promise<MenuState> {
  await requireAdmin("menu");
  const nonce = Date.now();
  const name = String(formData.get("name") ?? "").trim();
  const kind = String(formData.get("kind") ?? "page") as NewSectionKind;
  const iconRaw = String(formData.get("icon") ?? "");
  const icon = isMenuIcon(iconRaw) ? iconRaw : "";
  if (!name) return { status: "error", message: "Give the new section a name.", nonce };
  if (name.length > 24) return { status: "error", message: "Use 24 characters or fewer for the menu name.", nonce };
  if (!["page", "dropdown", "link"].includes(kind)) return { status: "error", message: "Choose what the section is.", nonce };
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, nonce };
  let slug: string | undefined;
  try {
    const { items } = await getMenuForAdmin();
    if (items.length >= MAX_MENU_ITEMS) {
      return { status: "error", message: `The menu is full (${MAX_MENU_ITEMS} items). Remove one first.`, nonce };
    }
    ({ slug } = await createMainSection(name, kind, icon));
  } catch (e) {
    return { status: "error", message: `Could not add the section: ${dbMsg(e)}`, nonce };
  }
  refresh();
  revalidatePath("/admin/menu", "layout");
  redirect(slug ? `/admin/menu/${slug}` : "/admin/menu");
}

export async function saveMainPageAction(slug: string, _prev: HomeSectionState, formData: FormData): Promise<HomeSectionState> {
  await requireAdmin("menu");
  const nonce = Date.now();
  if (!isMainPageSlug(slug)) return { status: "error", message: "Unknown page.", nonce };
  let parsed: { values?: unknown };
  try {
    parsed = JSON.parse(String(formData.get("payload") ?? "{}"));
  } catch {
    return { status: "error", message: "Could not read the form. Reload the page and try again.", nonce };
  }
  const result = validateSection(MAIN_PAGE_DEF, parsed.values);
  const errors = result.ok ? checkMainPagePairs(result.value) : result.errors;
  if (!result.ok || Object.keys(errors).length) {
    return { status: "error", message: "Please fix the highlighted fields.", errors, nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, nonce };
  try {
    if (!(await writeMainPage(slug, result.value))) {
      return { status: "error", message: "This page no longer exists. Go back to the menu.", nonce };
    }
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMsg(e)}`, nonce };
  }
  refresh();
  revalidatePath(`/s/${slug}`);
  return { status: "saved", message: "Saved. The page is updating.", values: result.value, visible: true, nonce };
}

export async function deleteMainPageAction(slug: string): Promise<MenuState> {
  await requireAdmin("menu");
  const nonce = Date.now();
  if (!isMainPageSlug(slug)) return { status: "error", message: "Unknown page.", nonce };
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, nonce };
  try {
    await deleteMainPage(slug);
  } catch (e) {
    return { status: "error", message: `Could not delete: ${dbMsg(e)}`, nonce };
  }
  refresh();
  revalidatePath(`/s/${slug}`);
  revalidatePath("/admin/menu", "layout");
  return { status: "saved", message: "Section deleted and removed from the menu.", nonce };
}
