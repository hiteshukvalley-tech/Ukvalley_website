"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import { todayInIndia } from "@/lib/careers-shared";
import { readProfile, validateProfile, type Profile } from "@/lib/profile-validation";
import { saveProfile } from "@/lib/profiles-store";

export type ProfileFormState = {
  status?: "saved" | "error";
  message?: string;
  errors?: Record<string, string>;
  /** what was submitted, so the form keeps it after a result */
  values?: Profile;
  nonce?: number;
};

/** Saves the signed-in user's own profile (every user may edit theirs). */
export async function saveProfileAction(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const me = await requireAdmin();
  const nonce = Date.now();
  if (!hasDatabaseUrl()) return { status: "error", message: "Database is not connected (MONGODB_URI missing).", nonce };

  const profile = readProfile(formData);
  const errors = validateProfile(profile, todayInIndia());
  if (Object.keys(errors).length) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: errors as Record<string, string>, values: profile, nonce };
  }
  try {
    await saveProfile(me, profile);
  } catch (e) {
    return { status: "error", message: `Could not save: ${e instanceof Error ? e.message : "database error"}`, values: profile, nonce };
  }
  // The name shows in the top bar of every admin page and on the dashboard.
  revalidatePath("/admin", "layout");
  return { status: "saved", message: "Profile saved.", values: profile, nonce };
}
