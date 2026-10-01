import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { getTestimonialForAdmin } from "@/lib/testimonials-store";
import { toTestimonialValues } from "@/lib/testimonials-validation";
import { TestimonialForm } from "../testimonial-form";

export const metadata = { title: "Edit testimonial" };
export const dynamic = "force-dynamic";

export default async function EditTestimonialPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getTestimonialForAdmin(slug);
  if (!item) notFound();

  return (
    <>
      <PageHeader
        title={item.name}
        crumbs={[{ label: "Testimonials", href: "/admin/testimonials" }, { label: "Edit" }]}
        description="Changes go live as soon as you save."
      />
      <TestimonialForm mode="edit" slug={item.slug} initial={toTestimonialValues(item)} />
    </>
  );
}
