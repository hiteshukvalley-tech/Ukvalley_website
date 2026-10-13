import { PageHeader } from "@/components/admin/page-header";
import { ENV_USER_ID } from "@/lib/admin-auth";
import { requireAdmin } from "@/lib/admin-session";
import { getProfile } from "@/lib/profiles-store";
import { roleLabel } from "@/lib/users-validation";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "My profile" };
export const dynamic = "force-dynamic";

/** Every user's own profile: name, photo, contact and background details. */
export default async function ProfilePage() {
  const me = await requireAdmin();
  const { notificationsSeenAt, ...profile } = await getProfile(me);
  void notificationsSeenAt;

  return (
    <>
      <PageHeader
        title="My profile"
        crumbs={[{ label: "My profile" }]}
        description="Your name, photo and details. Your name is shown in the top bar and in the welcome message on the dashboard."
      />
      <ProfileForm
        profile={profile}
        email={me.email}
        role={me.id === ENV_USER_ID ? "Owner (admin)" : me.title || roleLabel[me.role]}
      />
    </>
  );
}
