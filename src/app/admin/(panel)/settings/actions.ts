"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireRole } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import { SETTINGS_TAG, defaultSettings, resetSettings, writeSettings } from "@/lib/settings";
import {
  readValues, toValues, validateSettings,
  type FieldErrors, type SettingsValues,
} from "@/lib/settings-validation";

export type SettingsState = {
  status?: "saved" | "error" | "reset";
  message?: string;
  errors?: FieldErrors;
  /** Echoed back so the form keeps what the user typed after a failed save. */
  values?: SettingsValues;
  /** Bumps on every result so the form can re-key and show fresh values. */
  nonce?: number;
};

function refreshPublicSite() {
  revalidateTag(SETTINGS_TAG, { expire: 0 });
  revalidatePath("/", "layout");
}

export async function saveSettingsAction(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  await requireRole("admin");
  const values = readValues(formData);
  const nonce = Date.now();

  const result = validateSettings(values);
  if (!result.ok) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      errors: result.errors,
      values,
      nonce,
    };
  }
  if (!hasDatabaseUrl()) {
    return { status: "error", message: "Database is not connected (MONGODB_URI missing).", values, nonce };
  }
  try {
    await writeSettings(result.value);
  } catch (e) {
    return {
      status: "error",
      message: `Could not save: ${e instanceof Error ? e.message : "database error"}`,
      values,
      nonce,
    };
  }
  refreshPublicSite();
  return { status: "saved", message: "Settings saved. The live site is updating.", values, nonce };
}

export async function resetSettingsAction(): Promise<SettingsState> {
  await requireRole("admin");
  const nonce = Date.now();
  if (!hasDatabaseUrl()) {
    return { status: "error", message: "Database is not connected (MONGODB_URI missing).", nonce };
  }
  try {
    await resetSettings();
  } catch (e) {
    return {
      status: "error",
      message: `Could not reset: ${e instanceof Error ? e.message : "database error"}`,
      nonce,
    };
  }
  refreshPublicSite();
  return {
    status: "reset",
    message: "Restored the original defaults.",
    values: toValues(defaultSettings),
    nonce,
  };
}
