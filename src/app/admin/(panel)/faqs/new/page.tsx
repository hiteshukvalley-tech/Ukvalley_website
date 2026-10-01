import { PageHeader } from "@/components/admin/page-header";
import { emptyFaqValues } from "@/lib/faqs-validation";
import { FaqForm } from "../faq-form";

export const metadata = { title: "Add FAQ" };
export const dynamic = "force-dynamic";

export default function NewFaqPage() {
  return (
    <>
      <PageHeader
        title="Add FAQ"
        crumbs={[{ label: "FAQs", href: "/admin/faqs" }, { label: "Add FAQ" }]}
        description="Add a question and answer. It is added to the end of the list. It is added to the end of the list."
      />
      <FaqForm mode="create" initial={emptyFaqValues()} />
    </>
  );
}
