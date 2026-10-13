// A signed-in user's own profile (Admin → My profile): name, contact and
// background details. Client-safe (no database code): the profile form and
// the save action both read this file.

export type Profile = {
  name: string;
  phone: string;
  qualification: string;
  department: string;
  experience: string;
  location: string;
  address: string;
  /** YYYY-MM-DD, or "" */
  dateOfBirth: string;
  /** YYYY-MM-DD, or "" */
  dateOfJoining: string;
  linkedin: string;
  bio: string;
  /** "/media/<id>" from the upload route, or "" */
  photo: string;
};

export const EMPTY_PROFILE: Profile = {
  name: "", phone: "", qualification: "", department: "", experience: "", location: "",
  address: "", dateOfBirth: "", dateOfJoining: "", linkedin: "", bio: "", photo: "",
};

/** Longest value each field accepts (the inputs use the same caps). */
export const PROFILE_MAX: Record<keyof Profile, number> = {
  name: 80, phone: 20, qualification: 120, department: 80, experience: 60, location: 80,
  address: 300, dateOfBirth: 10, dateOfJoining: 10, linkedin: 200, bio: 600, photo: 40,
};

export const PROFILE_FIELDS = Object.keys(EMPTY_PROFILE) as (keyof Profile)[];

const PHONE = /^\+?[\d\s()-]{6,20}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const PHOTO = /^\/media\/[a-f0-9]{24}$/;
const LINKEDIN = /^https:\/\/([a-z]{2,3}\.)?linkedin\.com\/\S*$/i;

const realDate = (v: string) => ISO_DATE.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) && new Date(`${v}T00:00:00Z`).toISOString().startsWith(v);

/** Reads the form, trimming every field. */
export function readProfile(fd: FormData): Profile {
  const out = { ...EMPTY_PROFILE };
  for (const k of PROFILE_FIELDS) out[k] = String(fd.get(k) ?? "").trim();
  return out;
}

/** Field errors, empty when the profile is valid. `today` is YYYY-MM-DD. */
export function validateProfile(p: Profile, today: string): Partial<Record<keyof Profile, string>> {
  const e: Partial<Record<keyof Profile, string>> = {};
  for (const k of PROFILE_FIELDS) {
    if (p[k].length > PROFILE_MAX[k]) e[k] = `Use ${PROFILE_MAX[k]} characters or fewer.`;
  }
  if (p.name.length < 2) e.name = "Please enter your name.";
  if (p.phone && !e.phone && !PHONE.test(p.phone)) e.phone = "Enter a valid phone number (digits, spaces, + - ( ) only).";
  if (p.dateOfBirth && (!realDate(p.dateOfBirth) || p.dateOfBirth >= today)) e.dateOfBirth = "Enter a valid date in the past.";
  if (p.dateOfJoining && !realDate(p.dateOfJoining)) e.dateOfJoining = "Enter a valid date.";
  if (p.linkedin && !e.linkedin && !LINKEDIN.test(p.linkedin)) e.linkedin = "Enter a LinkedIn address starting with https://linkedin.com/ or https://www.linkedin.com/.";
  if (p.photo && !PHOTO.test(p.photo)) e.photo = "Upload the photo again.";
  return e;
}

/** First name for greetings ("Umesh" from "Umesh Khivasara"); falls back to the email's name part. */
export function firstName(name: string | undefined, email: string): string {
  const n = name?.trim().split(/\s+/)[0];
  if (n) return n;
  const local = email.split("@")[0].split(/[._-]/)[0] ?? "";
  return local ? local[0].toUpperCase() + local.slice(1) : "there";
}
