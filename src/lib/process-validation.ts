import type { processSteps } from "./site-core";

/** One step as the public pages use it; `step` ("01", "02" …) follows the order. */
export type ProcessStep = (typeof processSteps)[number];
import { lines, type FieldErrors } from "./list-utils";

export type { FieldErrors };

/** Editable fields as the form submits them (all strings). */
export type ProcessStepValues = {
  title: string;
  duration: string;
  desc: string;
  /** one per line */
  points: string;
  /** "on" when the Published checkbox is ticked, otherwise "" */
  published: string;
};

export const emptyProcessStepValues = (): ProcessStepValues => ({ title: "", duration: "", desc: "", points: "", published: "on" });

/**
 * Stored shape. The public data has no id, so `slug` is an internal id made
 * from the text when the item is created; it never changes afterwards.
 */
export type ProcessStepRecord = Omit<ProcessStep, "step"> & { slug: string; published: boolean; order: number };

/** What the form produces: the id and order are assigned by the store. */
export type ProcessStepInput = Omit<ProcessStepRecord, "order" | "slug">;

const FIELDS = ["title", "duration", "desc", "points"] as const;

export function readProcessStepValues(formData: FormData): ProcessStepValues {
  const out = { published: formData.get("published") ? "on" : "" } as ProcessStepValues;
  for (const f of FIELDS) out[f] = String(formData.get(f) ?? "").trim();
  return out;
}

export function toProcessStepValues(r: ProcessStepRecord): ProcessStepValues {
  return {
    title: r.title,
    duration: r.duration,
    desc: r.desc,
    points: r.points.join("\n"),
    published: r.published ? "on" : "",
  };
}

export function validateProcessStep(
  v: ProcessStepValues
): { ok: true; value: ProcessStepInput } | { ok: false; errors: FieldErrors } {
  const e: FieldErrors = {};

  const text = (k: keyof ProcessStepValues, label: string, max: number) => {
    if (!v[k]) e[k] = `${label} is required.`;
    else if (v[k].length > max) e[k] = `${label} must be ${max} characters or fewer.`;
  };
  text("title", "Title", 80);
  text("duration", "Duration", 30);
  text("desc", "Description", 500);
  const points = lines(v.points);
  if (points.length === 0) e.points = "Add at least one point.";
  else if (points.length > 6) e.points = "Use 6 or fewer.";
  else if (points.some((s) => s.length > 150)) e.points = "Each line must be 150 characters or fewer.";

  if (Object.keys(e).length) return { ok: false, errors: e };
  return {
    ok: true,
    value: {
      title: v.title,
      duration: v.duration,
      desc: v.desc,
      points,
      published: v.published === "on",
    },
  };
}
