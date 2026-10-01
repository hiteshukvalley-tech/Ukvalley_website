import { PageHeader } from "@/components/admin/page-header";
import { emptyTestimonialValues } from "@/lib/testimonials-validation";
import { TestimonialForm } from "../testimonial-form";

export const metadata = { title: "Add testimonial" };
export const dynamic = "force-dynamic";

export default function NewTestimonialPage() {
  return (
    <>
      <PageHeader
        title="Add testimonial"
        crumbs={[{ label: "Testimonials", href: "/admin/testimonials" }, { label: "Add testimonial" }]}
        description="Add a client quote. It is added to the end of the list. It is added to the end of the list."
      />
      <TestimonialForm mode="create" initial={emptyTestimonialValues()} />
    </>
  );
}
