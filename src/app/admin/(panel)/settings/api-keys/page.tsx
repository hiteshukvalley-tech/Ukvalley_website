import { PageHeader } from "@/components/admin/page-header";
import { requireRole } from "@/lib/admin-session";
import { ApiKeysSection } from "./section";

export const metadata = { title: "API keys" };
export const dynamic = "force-dynamic";

/** The API keys on their own page (the same section is also in Site settings, #api-keys). */
export default async function ApiKeysPage() {
  await requireRole("admin");
  return (
    <>
      <PageHeader
        title="API keys"
        crumbs={[{ label: "Site settings", href: "/admin/settings" }, { label: "API keys" }]}
        description="Keys and settings for the services the site connects to: Claude, Deepgram speech-to-text, Google Calendar, WhatsApp and recording storage. Add, replace or remove them here, with no server restart. A key saved here is used instead of the same key in the server's .env file."
      />
      <ApiKeysSection heading={false} />
    </>
  );
}
