"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireRole } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import { importSections, migrationSections, type ImportOutcome } from "@/lib/migration";

export type MigrationResult = {
  ok: boolean;
  message?: string;
  outcomes?: Pick<ImportOutcome, "key" | "label" | "status" | "imported" | "error">[];
};

/** Imports every section that is still on built-in content, or just `keys`. */
export async function runMigrationAction(keys?: string[]): Promise<MigrationResult> {
  await requireRole("admin");
  if (!hasDatabaseUrl()) return { ok: false, message: "Database is not connected (MONGODB_URI missing)." };

  // Only known section keys are accepted.
  const known = new Set(migrationSections.map((s) => s.key));
  if (keys && (!Array.isArray(keys) || keys.some((k) => typeof k !== "string" || !known.has(k)))) {
    return { ok: false, message: "Unknown section." };
  }

  let outcomes: ImportOutcome[];
  try {
    outcomes = await importSections(keys);
  } catch (e) {
    return { ok: false, message: `Could not import: ${e instanceof Error ? e.message : "database error"}` };
  }

  // Refresh the public site and admin lists for everything that changed.
  for (const o of outcomes) if (o.status === "imported") revalidateTag(o.tag, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin/migration");
  revalidatePath("/admin");

  const failed = outcomes.filter((o) => o.status === "failed");
  return {
    ok: failed.length === 0,
    message: failed.length ? `${failed.length} section(s) failed — see below.` : undefined,
    outcomes: outcomes.map(({ key, label, status, imported, error }) => ({ key, label, status, imported, error })),
  };
}
