import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { getPostForAdmin } from "@/lib/blog-store";
import { toBlogValues } from "@/lib/blog-validation";
import { BlogForm } from "../blog-form";

export const metadata = { title: "Edit post" };
export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostForAdmin(slug);
  if (!post) notFound();

  return (
    <>
      <PageHeader
        title={post.title}
        crumbs={[{ label: "Blog", href: "/admin/blog" }, { label: "Edit" }]}
        description="Changes go live as soon as you save."
      />
      <BlogForm mode="edit" initial={toBlogValues(post)} />
    </>
  );
}
