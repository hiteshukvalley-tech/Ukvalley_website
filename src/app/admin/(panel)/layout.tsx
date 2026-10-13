import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/admin-session";
import { getProfile } from "@/lib/profiles-store";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Ukvalley Admin" },
  robots: { index: false, follow: false },
};

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // Re-checks the user in the database, so a disabled account is signed out here.
  const user = await requireAdmin();
  const profile = await getProfile(user);
  return (
    <AdminShell user={{ email: user.email, role: user.role, access: user.access, title: user.title, name: profile.name, photo: profile.photo }}>
      {children}
    </AdminShell>
  );
}
