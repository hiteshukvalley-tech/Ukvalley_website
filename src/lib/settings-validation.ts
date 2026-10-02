import type { SiteSettings } from "./settings";
import { EMAIL_MAX } from "./users-validation";

export type FieldErrors = Record<string, string>;

/** Flat form-field names ("hr.phone") — same names the form inputs use. */
export const settingsFields = [
  "name", "shortName", "tagline", "foundedYear", "city",
  "email", "phonePrimary", "phoneSecondary",
  "sales.phone", "sales.email", "hr.phone", "hr.email",
  "cin", "gstin", "udyam",
  "social.linkedin", "social.twitter", "social.facebook",
  "social.instagram", "social.youtube", "social.github",
] as const;

export type SettingsFieldName = (typeof settingsFields)[number];
export type SettingsValues = Record<SettingsFieldName, string>;

export function toValues(s: SiteSettings): SettingsValues {
  return {
    name: s.name, shortName: s.shortName, tagline: s.tagline,
    foundedYear: String(s.foundedYear), city: s.city,
    email: s.email, phonePrimary: s.phonePrimary, phoneSecondary: s.phoneSecondary,
    "sales.phone": s.sales.phone, "sales.email": s.sales.email,
    "hr.phone": s.hr.phone, "hr.email": s.hr.email,
    cin: s.cin, gstin: s.gstin, udyam: s.udyam,
    "social.linkedin": s.social.linkedin, "social.twitter": s.social.twitter,
    "social.facebook": s.social.facebook, "social.instagram": s.social.instagram,
    "social.youtube": s.social.youtube, "social.github": s.social.github,
  };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[0-9][0-9 ()-]{6,19}$/;

function isHttpUrl(v: string) {
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function readValues(formData: FormData): SettingsValues {
  const out = {} as SettingsValues;
  for (const f of settingsFields) out[f] = String(formData.get(f) ?? "").trim();
  return out;
}

export function validateSettings(
  v: SettingsValues
): { ok: true; value: SiteSettings } | { ok: false; errors: FieldErrors } {
  const e: FieldErrors = {};
  const required = (k: SettingsFieldName, label: string, max = 120) => {
    if (!v[k]) e[k] = `${label} is required.`;
    else if (v[k].length > max) e[k] = `${label} must be ${max} characters or fewer.`;
  };
  const email = (k: SettingsFieldName, label: string, isRequired = true) => {
    if (!v[k]) {
      if (isRequired) e[k] = `${label} is required.`;
    } else if (v[k].length > EMAIL_MAX) e[k] = `${label} must be ${EMAIL_MAX} characters or fewer.`;
    else if (!EMAIL.test(v[k])) e[k] = "Enter a valid email address.";
  };
  const phone = (k: SettingsFieldName, label: string, isRequired = true) => {
    if (!v[k]) {
      if (isRequired) e[k] = `${label} is required.`;
    } else if (!PHONE.test(v[k])) e[k] = "Enter a valid phone number, e.g. +91 98765 43210.";
  };

  required("name", "Company name");
  required("shortName", "Short name", 40);
  required("tagline", "Tagline", 200);
  required("city", "Location");
  email("email", "Email");
  phone("phonePrimary", "Primary phone");
  phone("phoneSecondary", "Secondary phone", false);
  email("sales.email", "Sales email");
  phone("sales.phone", "Sales phone");
  email("hr.email", "HR email");
  phone("hr.phone", "HR phone");

  const year = Number(v.foundedYear);
  const thisYear = new Date().getFullYear();
  if (!/^\d{4}$/.test(v.foundedYear) || year < 1950 || year > thisYear) {
    e.foundedYear = `Enter a 4-digit year between 1950 and ${thisYear}.`;
  }

  for (const k of ["cin", "gstin", "udyam"] as const) {
    if (v[k].length > 60) e[k] = "Must be 60 characters or fewer.";
  }
  for (const k of settingsFields.filter((f) => f.startsWith("social."))) {
    if (v[k] && !isHttpUrl(v[k])) e[k] = "Enter a full link starting with https://";
  }

  if (Object.keys(e).length) return { ok: false, errors: e };

  return {
    ok: true,
    value: {
      name: v.name, shortName: v.shortName, tagline: v.tagline,
      foundedYear: year, city: v.city,
      email: v.email, phonePrimary: v.phonePrimary, phoneSecondary: v.phoneSecondary,
      sales: { phone: v["sales.phone"], email: v["sales.email"] },
      hr: { phone: v["hr.phone"], email: v["hr.email"] },
      cin: v.cin, gstin: v.gstin, udyam: v.udyam,
      social: {
        linkedin: v["social.linkedin"], twitter: v["social.twitter"],
        facebook: v["social.facebook"], instagram: v["social.instagram"],
        youtube: v["social.youtube"], github: v["social.github"],
      },
    },
  };
}
