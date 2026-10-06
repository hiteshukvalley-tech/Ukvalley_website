"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import {
  PRODUCTS_TAG, createProduct, deleteProduct, importBuiltInProducts, reorderProducts, setProductPublished, updateProduct,
} from "@/lib/products-store";
import {
  readProductValues, validateProduct, type ProductValues, type FieldErrors,
} from "@/lib/products-validation";

export type ProductFormState = {
  status?: "saved" | "error";
  message?: string;
  errors?: FieldErrors;
  /** Echoed back so the form keeps what the user typed after a failed save. */
  values?: ProductValues;
  /** Bumps on every result so the form can re-key and show fresh values. */
  nonce?: number;
};

export type ActionResult = { ok: boolean; message?: string };

const NO_DB = "Database is not connected (MONGODB_URI missing).";
const dbMessage = (e: unknown) => (e instanceof Error ? e.message : "database error");

function refreshPublicSite() {
  revalidateTag(PRODUCTS_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin/products");
}

export async function createProductAction(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  await requireAdmin("products");
  const values = readProductValues(formData);
  const nonce = Date.now();

  const result = validateProduct(values, { requireSlug: true });
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values, nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  try {
    const created = await createProduct(result.value);
    if (!created) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        errors: { slug: "A product with this slug already exists." },
        values,
        nonce,
      };
    }
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  refreshPublicSite();
  redirect("/admin/products?saved=created");
}

export async function updateProductAction(
  slug: string,
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  slug = String(slug);
  await requireAdmin("products");
  // The slug is the record id and cannot be changed, so never trust the form's copy.
  const values = { ...readProductValues(formData), slug };
  const nonce = Date.now();

  const result = validateProduct(values, { requireSlug: false });
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values, nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  try {
    const found = await updateProduct(result.value);
    if (!found) return { status: "error", message: "This product no longer exists.", values, nonce };
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  refreshPublicSite();
  return { status: "saved", message: "Product saved. The live site is updating.", values, nonce };
}

export async function importProductsAction(): Promise<ActionResult> {
  await requireAdmin("products");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    const n = await importBuiltInProducts();
    if (n === 0) return { ok: false, message: "Products already exist in the database." };
    refreshPublicSite();
    return { ok: true, message: `Imported ${n} products.` };
  } catch (e) {
    return { ok: false, message: `Could not import: ${dbMessage(e)}` };
  }
}

export async function setProductPublishedAction(slug: string, published: boolean): Promise<ActionResult> {
  slug = String(slug);
  published = published === true;
  await requireAdmin("products");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    await setProductPublished(String(slug), Boolean(published));
  } catch (e) {
    return { ok: false, message: `Could not update: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}

export async function reorderProductsAction(slugs: string[]): Promise<ActionResult> {
  await requireAdmin("products");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  if (!Array.isArray(slugs) || slugs.some((s) => typeof s !== "string")) {
    return { ok: false, message: "Invalid order." };
  }
  try {
    const ok = await reorderProducts(slugs);
    if (!ok) return { ok: false, message: "The list changed in another tab. Reload and try again." };
  } catch (e) {
    return { ok: false, message: `Could not reorder: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}

export async function deleteProductAction(slug: string): Promise<ActionResult> {
  slug = String(slug);
  await requireAdmin("products");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    await deleteProduct(String(slug));
  } catch (e) {
    return { ok: false, message: `Could not delete: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}
