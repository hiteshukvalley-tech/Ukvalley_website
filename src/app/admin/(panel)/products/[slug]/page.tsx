import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { getProductForAdmin } from "@/lib/products-store";
import { toProductValues } from "@/lib/products-validation";
import { ProductForm } from "../product-form";

export const metadata = { title: "Edit product" };
export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductForAdmin(slug);
  if (!product) notFound();

  return (
    <>
      <PageHeader
        title={product.name}
        crumbs={[{ label: "Products", href: "/admin/products" }, { label: "Edit" }]}
        description="Changes go live as soon as you save."
      />
      <ProductForm mode="edit" initial={toProductValues(product)} />
    </>
  );
}
