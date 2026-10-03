import type { TeamMember } from "./site-data";

export type FieldErrors = Record<string, string>;

/** Editable fields as the form submits them (all strings). */
export type TeamValues = {
  name: string;
  role: string;
  focus: string;
  bio: string;
  image: string;
  /** "on" when the Published checkbox is ticked, otherwise "" */
  published: string;
};

export const emptyTeamValues = (): TeamValues => ({
  name: "", role: "", focus: "", bio: "", image: "", published: "on",
});

/**
 * Stored shape. The public data has no id, so `slug` is an internal id made
 * from the name when the member is created; it never changes afterwards.
 */
export type TeamRecord = TeamMember & { slug: string; published: boolean; order: number };

/** What the form produces: the id and order are assigned by the action/store. */
export type TeamInput = Omit<TeamRecord, "order" | "slug">;

const FIELDS = ["name", "role", "focus", "bio", "image"] as const;

export function readTeamValues(formData: FormData): TeamValues {
  const out = { published: formData.get("published") ? "on" : "" } as TeamValues;
  for (const f of FIELDS) out[f] = String(formData.get(f) ?? "").trim();
  return out;
}

export function toTeamValues(m: TeamRecord): TeamValues {
  return { name: m.name, role: m.role, focus: m.focus, bio: m.bio, image: m.image ?? "", published: m.published ? "on" : "" };
}

/** URL-safe id from a name, e.g. "Dr. Mahendra J" -> "dr-mahendra-j". */
export function slugifyName(name: string): string {
  const s = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
  return s || "member";
}

export function validateTeam(
  v: TeamValues
): { ok: true; value: TeamInput } | { ok: false; errors: FieldErrors } {
  const e: FieldErrors = {};

  const text = (k: keyof TeamValues, label: string, max: number) => {
    if (!v[k]) e[k] = `${label} is required.`;
    else if (v[k].length > max) e[k] = `${label} must be ${max} characters or fewer.`;
  };
  text("name", "Name", 60);
  text("role", "Role", 80);
  text("focus", "Focus", 80);
  text("bio", "Bio", 400);

  if (v.image && (v.image.length > 300 || !/^(\/|https:\/\/)/.test(v.image))) {
    e.image = "Use an uploaded image (/media/…) or a full https:// address, up to 300 characters.";
  }

  if (Object.keys(e).length) return { ok: false, errors: e };
  return {
    ok: true,
    value: { name: v.name, role: v.role, focus: v.focus, bio: v.bio, image: v.image, published: v.published === "on" },
  };
}
