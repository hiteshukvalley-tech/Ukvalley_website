import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { getFaqForAdmin } from "@/lib/faqs-store";
import { toFaqValues } from "@/lib/faqs-validation";
import { FaqForm } from "../faq-form";

export const metadata = { title: "Edit FAQ" };
export const dynamic = "force-dynamic";

export default async function EditFaqPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getFaqForAdmin(slug);
  if (!item) notFound();

  return (
    <>
      <PageHeader
        title={item.q}
        crumbs={[{ label: "FAQs", href: "/admin/faqs" }, { label: "Edit" }]}
        description="Changes go live as soon as you save."
      />
      <FaqForm mode="edit" slug={item.slug} initial={toFaqValues(item)} />
    </>
  );
}
