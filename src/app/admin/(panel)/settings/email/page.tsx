import { redirect } from "next/navigation";

// The Email (SMTP) page moved: the HR mail server is now edited in Site
// settings (and each user's own in Settings). Old links and bookmarks land there.
export default function EmailSettingsPage() {
  redirect("/admin/settings#smtp");
}
