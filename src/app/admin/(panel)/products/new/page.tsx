import { PageHeader } from "@/components/admin/page-header";
import { emptyProductValues } from "@/lib/products-validation";
import { ProductForm } from "../product-form";

export const metadata = { title: "Add product" };
export const dynamic = "force-dynamic";

export default function NewProductPage() {
  return (
    <>
      <PageHeader
        title="Add product"
        crumbs={[{ label: "Products", href: "/admin/products" }, { label: "Add product" }]}
        description="Create a new product. It is added to the end of the list."
      />
      <ProductForm mode="create" initial={emptyProductValues()} />
    </>
  );
}
