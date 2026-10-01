import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/admin-session";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Ukvalley Admin" },
  robots: { index: false, follow: false },
};

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // Re-checks the user in the database, so a disabled account is signed out here.
  const user = await requireAdmin();
  return <AdminShell user={{ email: user.email, role: user.role }}>{children}</AdminShell>;
}
