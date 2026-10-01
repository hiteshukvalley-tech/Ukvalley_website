import { unstable_cache } from "next/cache";
import { company } from "@/lib/site-core";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";

export const SETTINGS_TAG = "site-settings";
const COLLECTION = "settings";
const DOC_ID = "site";

export type SiteSettings = {
  name: string;
  shortName: string;
  tagline: string;
  foundedYear: number;
  city: string;
  email: string;
  phonePrimary: string;
  phoneSecondary: string;
  hr: { phone: string; email: string };
  sales: { phone: string; email: string };
  cin: string;
  gstin: string;
  udyam: string;
  social: {
    linkedin: string;
    twitter: string;
    facebook: string;
    instagram: string;
    youtube: string;
    github: string;
  };
};

/** What the site shows when nothing has been saved yet (the old hard-coded values). */
export const defaultSettings: SiteSettings = {
  ...company,
  social: {
    linkedin: "https://www.linkedin.com/company/ukvalley-technologies",
    twitter: "",
    facebook: "",
    instagram: "",
    youtube: "",
    github: "",
  },
};

type SettingsDoc = { _id: string; updatedAt?: Date } & Partial<SiteSettings>;

function merge(saved: Partial<SiteSettings> | null): SiteSettings {
  if (!saved) return defaultSettings;
  return {
    ...defaultSettings,
    ...saved,
    hr: { ...defaultSettings.hr, ...saved.hr },
    sales: { ...defaultSettings.sales, ...saved.sales },
    social: { ...defaultSettings.social, ...saved.social },
  };
}

async function readFromDb() {
  const doc = await getDb()
    .collection<SettingsDoc>(COLLECTION)
    .findOne({ _id: DOC_ID });
  const { _id, updatedAt, ...saved } = doc ?? {};
  void _id;
  return { settings: merge(doc ? saved : null), updatedAt: updatedAt?.toISOString() ?? null };
}

// Cached across requests and invalidated by tag when the admin saves. It throws
// on DB errors (so failures are never cached); callers catch and fall back.
const cachedRead = unstable_cache(readFromDb, ["site-settings-v1"], {
  tags: [SETTINGS_TAG],
  revalidate: 3600,
});

/** Settings for the public site. Never throws: falls back to the defaults. */
export async function getSiteSettings(): Promise<SiteSettings> {
  if (!hasDatabaseUrl()) return defaultSettings;
  try {
    return (await cachedRead()).settings;
  } catch {
    return defaultSettings;
  }
}

/** Uncached read for the admin form, so it always shows what is really stored. */
export async function getSettingsForAdmin(): Promise<{
  settings: SiteSettings;
  updatedAt: string | null;
  dbError?: string;
}> {
  if (!hasDatabaseUrl()) {
    return { settings: defaultSettings, updatedAt: null, dbError: "MONGODB_URI is not set." };
  }
  try {
    return await readFromDb();
  } catch (e) {
    return {
      settings: defaultSettings,
      updatedAt: null,
      dbError: e instanceof Error ? e.message : "Could not read settings.",
    };
  }
}

/** Whether settings have been saved to the database. Throws on DB errors. */
export async function hasSavedSettings(): Promise<boolean> {
  return (await getDb().collection<SettingsDoc>(COLLECTION).countDocuments({ _id: DOC_ID })) > 0;
}

/**
 * Stores the given settings only if none are saved yet — never overwrites,
 * so a migration re-run (or a misread status) can't wipe the admin's edits.
 * Returns whether it wrote anything.
 */
export async function insertSettingsIfMissing(value: SiteSettings): Promise<boolean> {
  const res = await getDb()
    .collection<SettingsDoc>(COLLECTION)
    .updateOne({ _id: DOC_ID }, { $setOnInsert: { ...value, updatedAt: new Date() } }, { upsert: true });
  return res.upsertedCount > 0;
}

export async function writeSettings(value: SiteSettings) {
  await getDb()
    .collection<SettingsDoc>(COLLECTION)
    .updateOne({ _id: DOC_ID }, { $set: { ...value, updatedAt: new Date() } }, { upsert: true });
}

export async function resetSettings() {
  await getDb().collection<SettingsDoc>(COLLECTION).deleteOne({ _id: DOC_ID });
}
