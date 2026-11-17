import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import {
  MAX_FILES_PER_UPLOAD, MAX_FILE_BYTES, saveMedia, sniffImageType, type UploadResult,
} from "@/lib/media-store";
import { trustedRequestOrigin } from "@/lib/site-origin";

export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

/**
 * Whether the upload comes from a page of this site. Server actions check this
 * themselves; a route handler must, or another site could make a signed-in
 * admin's browser post files here (the cookie is SameSite=Lax, which still
 * lets same-site subdomains through). Browsers always send Origin on a POST.
 */
function fromThisSite(request: Request): boolean {
  const origin = request.headers.get("origin");
  const here = trustedRequestOrigin(request.headers);
  if (!origin || !here) return false;
  try {
    return new URL(origin).host.toLowerCase() === new URL(here).host.toLowerCase();
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  // The proxy already gates /admin, but an upload deserves its own check.
  if (!(await getSession())) return json({ error: "Unauthorized" }, 401);
  if (!fromThisSite(request)) return json({ error: "Uploads must come from the admin panel." }, 403);
  if (!hasDatabaseUrl()) return json({ error: "Database is not connected (MONGODB_URI missing)." }, 503);

  // Refuse oversized requests before reading the body. Without a declared
  // length (a chunked body) the size isn't known up front, so it is refused too;
  // the panel's uploads always send one.
  const length = request.headers.get("content-length");
  if (length === null) return json({ error: "The upload's size is missing." }, 411);
  const declared = Number(length);
  if (!Number.isFinite(declared) || declared > MAX_FILE_BYTES * MAX_FILES_PER_UPLOAD + 1024 * 1024) {
    return json({ error: "That upload is too large." }, 413);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Could not read the upload." }, 400);
  }

  const picked = form.getAll("files").filter((f): f is File => typeof f !== "string");
  if (picked.length === 0) return json({ error: "Choose at least one image." }, 400);
  if (picked.length > MAX_FILES_PER_UPLOAD) {
    return json({ error: `Upload ${MAX_FILES_PER_UPLOAD} files or fewer at a time.` }, 400);
  }

  const results: UploadResult[] = [];
  for (const file of picked) {
    if (file.size === 0) {
      results.push({ name: file.name, ok: false, error: "The file is empty." });
      continue;
    }
    if (file.size > MAX_FILE_BYTES) {
      results.push({ name: file.name, ok: false, error: `Larger than ${MAX_FILE_BYTES / 1024 / 1024} MB.` });
      continue;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = sniffImageType(bytes);
    if (!type) {
      results.push({ name: file.name, ok: false, error: "Not a PNG, JPG, GIF, WebP or AVIF image." });
      continue;
    }
    try {
      results.push({ name: file.name, ok: true, id: await saveMedia(bytes, file.name, type) });
    } catch (e) {
      results.push({ name: file.name, ok: false, error: e instanceof Error ? e.message : "Could not save." });
    }
  }

  if (results.some((r) => r.ok)) {
    revalidatePath("/admin/media");
    revalidatePath("/admin");
  }
  return json({ results });
}
