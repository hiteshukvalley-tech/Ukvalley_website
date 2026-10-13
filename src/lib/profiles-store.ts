import { cache } from "react";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { ENV_USER_ID, type SessionUser } from "@/lib/admin-auth";
import { EMPTY_PROFILE, PROFILE_FIELDS, type Profile } from "@/lib/profile-validation";

// Each signed-in user's own profile (Admin → My profile). Server-only.
// Stored in "adminProfiles" with the user's id as _id ("env" for the owner).
// A database user's name stays in adminUsers (Admin → Users shows and edits
// it), so saving the profile updates it there too; the owner has no user
// document, so their name lives only here.

type ProfileDoc = Partial<Profile> & {
  _id: string;
  /** when the user last opened "Mark all as read" on the dashboard notifications */
  notificationsSeenAt?: Date;
  updatedAt?: Date;
};

const col = () => getDb().collection<ProfileDoc>("adminProfiles");

const pick = (doc: Partial<Profile> | null | undefined): Profile => {
  const out = { ...EMPTY_PROFILE };
  for (const k of PROFILE_FIELDS) if (typeof doc?.[k] === "string") out[k] = doc[k] as string;
  return out;
};

/** The user's profile (empty fields when none is saved or the database is down). */
export const getProfile = cache(async function getProfile(user: Pick<SessionUser, "id">): Promise<Profile & { notificationsSeenAt: Date | null }> {
  if (!hasDatabaseUrl()) return { ...EMPTY_PROFILE, notificationsSeenAt: null };
  try {
    const [doc, account] = await Promise.all([
      col().findOne({ _id: user.id }),
      user.id === ENV_USER_ID
        ? null
        : getDb().collection<{ _id: string; name?: string }>("adminUsers").findOne({ _id: user.id }, { projection: { name: 1 } }),
    ]);
    const profile = pick(doc);
    // Admin → Users can rename a database user; that name wins.
    if (account?.name) profile.name = account.name;
    return { ...profile, notificationsSeenAt: doc?.notificationsSeenAt ?? null };
  } catch {
    return { ...EMPTY_PROFILE, notificationsSeenAt: null };
  }
});

/** Saves the profile; a database user's name is also saved on their account. */
export async function saveProfile(user: Pick<SessionUser, "id">, profile: Profile) {
  await col().updateOne({ _id: user.id }, { $set: { ...profile, updatedAt: new Date() } }, { upsert: true });
  if (user.id !== ENV_USER_ID) {
    await getDb().collection("adminUsers").updateOne({ _id: user.id as never }, { $set: { name: profile.name, updatedAt: new Date() } });
  }
}

/** Marks every notification up to now as read for this user. */
export async function markNotificationsSeen(user: Pick<SessionUser, "id">) {
  await col().updateOne({ _id: user.id }, { $set: { notificationsSeenAt: new Date() } }, { upsert: true });
}

/** Removes a deleted user's profile. */
export async function deleteProfile(userId: string) {
  await col().deleteOne({ _id: userId });
}
