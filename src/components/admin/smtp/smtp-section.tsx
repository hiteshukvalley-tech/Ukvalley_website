import { CircleAlert, CircleCheck, MailWarning, Server } from "lucide-react";
import { getSmtpConfig, getSmtpForAdmin, scopeKey, type SmtpScope } from "@/lib/smtp-settings";
import { SmtpForm } from "./smtp-form";

const securityLabel = { ssl: "SSL/TLS", starttls: "STARTTLS", none: "no encryption" } as const;

/**
 * An "Email (SMTP)" block: which mail server is in use right now, then the
 * settings form. `scope` is the HR settings (Site settings) or one user's own
 * (Settings, or Users → edit). `testTo` pre-fills the test email's address.
 */
export async function SmtpSection({
  scope, testTo, title, description, who = "This user",
}: {
  scope: SmtpScope;
  testTo: string;
  title: string;
  description: string;
  /** how the banner names the user ("You" on their own Settings page) */
  who?: string;
}) {
  const [{ saved, env, dbError }, hr] = await Promise.all([
    getSmtpForAdmin(scope),
    scope.kind === "user" ? getSmtpConfig() : Promise.resolve(null),
  ]);
  const own = saved && !saved.passwordUnreadable;
  const active = own ? "saved" : env ? "env" : scope.kind === "user" && hr ? "hr" : null;
  const shown = saved ?? env;

  const headline =
    scope.kind === "hr"
      ? active === "saved"
        ? "HR email is on — using the settings saved here."
        : active === "env"
          ? "HR email is on — using the server's SMTP settings (environment variables)."
          : "HR email is off — no SMTP settings yet."
      : active === "saved"
        ? `${who} send${who === "You" ? "" : "s"} emails through ${who === "You" ? "your" : "their"} own mail server.`
        : active === "hr"
          ? `${who} ${who === "You" ? "have" : "has"} no own mail server — emails go out through the HR email settings.`
          : "Email is off — no own mail server and no HR email settings yet.";

  return (
    <section id="smtp" className="scroll-mt-24 space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-uk-heading">{title}</h2>
        <p className="mt-1 text-sm text-uk-muted">{description}</p>
      </div>

      {dbError && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Could not read the saved email settings ({dbError}). Saving will not work until the database is connected.</span>
        </div>
      )}

      {/* Which settings email is sent with right now */}
      <div
        className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${
          active ? "border-emerald-500/30 bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/10"
        }`}
      >
        {active ? (
          <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <MailWarning className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        )}
        <div className="min-w-0 space-y-1">
          <p className="font-semibold text-uk-heading">{headline}</p>
          {(active === "saved" || active === "env") && shown && (
            <p className="flex flex-wrap items-center gap-x-2 text-uk-body">
              <Server className="h-3.5 w-3.5 text-uk-muted" />
              {shown.host}:{shown.port} · {securityLabel[shown.security]} · {shown.user}
            </p>
          )}
          {active === "hr" && hr && (
            <p className="flex flex-wrap items-center gap-x-2 text-uk-body">
              <Server className="h-3.5 w-3.5 text-uk-muted" />
              HR: {hr.config.host} · {hr.config.fromEmail || hr.config.user}
            </p>
          )}
          {saved && (
            <p className="text-xs text-uk-muted">
              Last saved {saved.updatedAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })} by {saved.updatedBy}.
            </p>
          )}
          {saved?.passwordUnreadable && (
            <p className="text-amber-800 dark:text-amber-300">
              The saved password can&apos;t be read any more (the server&apos;s AUTH_SECRET changed). Enter the password again and save.
            </p>
          )}
          {scope.kind === "hr" && !active && (
            <p className="text-uk-body">Until this is set up, applicants get no emails and the admin &ldquo;Forgot password&rdquo; codes can&apos;t be sent.</p>
          )}
          {scope.kind === "hr" && active === "env" && (
            <p className="text-uk-muted">Saving settings below replaces the server&apos;s settings. Removing them later switches back.</p>
          )}
        </div>
      </div>

      <SmtpForm
        scope={scopeKey(scope)}
        hasSaved={!!saved}
        hasPassword={saved ? saved.hasPassword && !saved.passwordUnreadable : !!env}
        initial={{
          host: shown?.host ?? "",
          port: String(shown?.port ?? 465),
          security: shown?.security ?? "ssl",
          user: shown?.user ?? "",
          fromName: shown?.fromName ?? "",
          fromEmail: shown?.fromEmail ?? "",
          testTo,
        }}
      />
    </section>
  );
}
