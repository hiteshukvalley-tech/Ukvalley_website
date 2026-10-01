"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import {
  BLOG_TAG, createPost, deletePost, importBuiltInPosts, reorderPosts, setPostPublished, updatePost,
} from "@/lib/blog-store";
import {
  readBlogValues, validateBlog, type BlogValues, type FieldErrors,
} from "@/lib/blog-validation";

export type BlogFormState = {
  status?: "saved" | "error";
  message?: string;
  errors?: FieldErrors;
  /** Echoed back so the form keeps what the user typed after a failed save. */
  values?: BlogValues;
  /** Bumps on every result so the form can re-key and show fresh values. */
  nonce?: number;
};

export type ActionResult = { ok: boolean; message?: string };

const NO_DB = "Database is not connected (MONGODB_URI missing).";
const dbMessage = (e: unknown) => (e instanceof Error ? e.message : "database error");

function refreshPublicSite() {
  revalidateTag(BLOG_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin/blog");
}

export async function createPostAction(_prev: BlogFormState, formData: FormData): Promise<BlogFormState> {
  await requireAdmin();
  const values = readBlogValues(formData);
  const nonce = Date.now();

  const result = validateBlog(values, { requireSlug: true });
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values, nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  try {
    const created = await createPost(result.value);
    if (!created) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        errors: { slug: "A post with this slug already exists." },
        values,
        nonce,
      };
    }
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  refreshPublicSite();
  redirect("/admin/blog?saved=created");
}

export async function updatePostAction(
  slug: string,
  _prev: BlogFormState,
  formData: FormData
): Promise<BlogFormState> {
  slug = String(slug);
  await requireAdmin();
  // The slug is the record id and cannot be changed, so never trust the form's copy.
  const values = { ...readBlogValues(formData), slug };
  const nonce = Date.now();

  const result = validateBlog(values, { requireSlug: false });
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values, nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  try {
    const found = await updatePost(result.value);
    if (!found) return { status: "error", message: "This post no longer exists.", values, nonce };
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  refreshPublicSite();
  return { status: "saved", message: "Post saved. The live site is updating.", values, nonce };
}

export async function importPostsAction(): Promise<ActionResult> {
  await requireAdmin();
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    const n = await importBuiltInPosts();
    if (n === 0) return { ok: false, message: "Posts already exist in the database." };
    refreshPublicSite();
    return { ok: true, message: `Imported ${n} posts.` };
  } catch (e) {
    return { ok: false, message: `Could not import: ${dbMessage(e)}` };
  }
}

export async function setPostPublishedAction(slug: string, published: boolean): Promise<ActionResult> {
  slug = String(slug);
  published = published === true;
  await requireAdmin();
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    await setPostPublished(String(slug), Boolean(published));
  } catch (e) {
    return { ok: false, message: `Could not update: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}

export async function reorderPostsAction(slugs: string[]): Promise<ActionResult> {
  await requireAdmin();
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  if (!Array.isArray(slugs) || slugs.some((s) => typeof s !== "string")) {
    return { ok: false, message: "Invalid order." };
  }
  try {
    const ok = await reorderPosts(slugs);
    if (!ok) return { ok: false, message: "The list changed in another tab. Reload and try again." };
  } catch (e) {
    return { ok: false, message: `Could not reorder: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}

export async function deletePostAction(slug: string): Promise<ActionResult> {
  slug = String(slug);
  await requireAdmin();
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    await deletePost(String(slug));
  } catch (e) {
    return { ok: false, message: `Could not delete: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}
