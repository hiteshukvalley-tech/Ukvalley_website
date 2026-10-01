import { PageHeader } from "@/components/admin/page-header";
import { emptyBlogValues } from "@/lib/blog-validation";
import { BlogForm } from "../blog-form";

export const metadata = { title: "Add post" };
export const dynamic = "force-dynamic";

export default function NewPostPage() {
  return (
    <>
      <PageHeader
        title="Add post"
        crumbs={[{ label: "Blog", href: "/admin/blog" }, { label: "Add post" }]}
        description="Write a new article. Untick Published to save it as a draft."
      />
      <BlogForm mode="create" initial={emptyBlogValues()} />
    </>
  );
}
