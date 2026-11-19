import { CircleAlert, KeyRound, Mail, Settings2 } from "lucide-react";
import { requireRole } from "@/lib/admin-session";
import { PageHeader } from "@/components/admin/page-header";
import { getSettingsForAdmin } from "@/lib/settings";
import { toValues } from "@/lib/settings-validation";
import { SmtpSection } from "@/components/admin/smtp/smtp-section";
import { SettingsForm } from "./settings-form";
import { ApiKeysSection } from "./api-keys/section";

export const metadata = { title: "Site settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const me = await requireRole("admin");
  const { settings, updatedAt, dbError } = await getSettingsForAdmin();

  return (
    <>
      <PageHeader
        title="Site settings"
        crumbs={[{ label: "Site settings" }]}
        description={
          updatedAt
            ? `Company, contact and social details for the whole website. Last saved ${new Date(updatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}.`
            : "Company, contact and social details for the whole website. Nothing saved yet — the site is using its built-in defaults."
        }
      />
      {/* Jump links: this page holds three separate forms. */}
      <nav aria-label="On this page" className="mb-6 flex flex-wrap gap-2">
        {[
          { href: "#site-details", label: "Site details", icon: Settings2 },
          { href: "#smtp", label: "HR email (SMTP)", icon: Mail },
          { href: "#api-keys", label: "API keys (Claude, Google, WhatsApp, S3)", icon: KeyRound },
        ].map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="inline-flex items-center gap-1.5 rounded-full border border-uk-line bg-uk-card px-3 py-1.5 text-sm font-medium text-uk-body transition-colors hover:border-uk-blue hover:text-uk-blue"
          >
            <l.icon className="h-4 w-4" /> {l.label}
          </a>
        ))}
      </nav>

      {dbError && (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Showing defaults — could not read saved settings ({dbError}). Saving will not work until the database is connected.</span>
        </div>
      )}
      <div id="site-details" className="scroll-mt-24">
        <SettingsForm initial={toValues(settings)} />
      </div>

      {/* HR mail server: its own form (and save button), below the site details */}
      <div className="mt-12 border-t border-uk-line pt-10">
        <SmtpSection
          scope={{ kind: "hr" }}
          testTo={me.email}
          title="HR email (SMTP)"
          description="The mail server for every automatic email: application notices to HR, thank-yous to applicants and admin password-reset codes. Users who haven't set their own mail server in Settings send through it too."
        />
      </div>

      {/* API keys: Claude, Google Calendar, WhatsApp, recordings (also at /admin/settings/api-keys) */}
      <div className="mt-12 border-t border-uk-line pt-10">
        <ApiKeysSection />
      </div>
    </>
  );
}
