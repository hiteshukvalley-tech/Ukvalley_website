import { CircleAlert, KeyRound, ShieldCheck } from "lucide-react";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { keyDef } from "@/lib/integration-keys-shared";
import { keyHistory, keyStatuses } from "@/lib/integration-keys";
import { KeysForm } from "./keys-form";

const code = "rounded bg-uk-surface-2 px-1 font-mono text-xs";

/**
 * API keys and integration settings (Claude, Google Calendar, WhatsApp,
 * recordings): the status of every key, the form, and the change history.
 * Shown in Settings (/admin/account#api-keys), Site settings (#api-keys) and on
 * its own page, /admin/settings/api-keys. Callers must already have checked
 * canManageKeys (admins and HR staff).
 */
export async function ApiKeysSection({ heading = true }: { heading?: boolean }) {
  const db = hasDatabaseUrl();
  let dbError = "";
  let recordings = false;
  if (db) {
    try {
      recordings = (await getDb().collection("aiInterviewRecordings").estimatedDocumentCount()) > 0;
    } catch (e) {
      dbError = e instanceof Error ? e.message : "The database can't be reached.";
    }
  }
  const [statuses, history] = await Promise.all([
    keyStatuses({ recordingsExist: recordings }),
    db && !dbError ? keyHistory(20).catch(() => []) : Promise.resolve([]),
  ]);
  const missing = statuses.filter((s) => s.source === "none").length;

  return (
    <section id="api-keys" className="scroll-mt-24 space-y-6">
      {heading && (
        <div>
          <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-uk-heading">
            <KeyRound className="h-5 w-5 text-uk-blue" /> API keys
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-uk-muted">
            Keys for the services the site connects to: Claude (AI interviews), Deepgram speech-to-text, Google Calendar, WhatsApp and recording storage.
            Add, replace or remove them here; they are used at once, with no restart, and win over the same keys in the server&apos;s .env file.
            {missing > 0 ? ` ${missing} not set yet.` : ""}
          </p>
        </div>
      )}

      {(!db || dbError) && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{!db ? "The database is not configured (MONGODB_URI), so keys can't be saved here. The .env values are in use." : `The database can't be reached (${dbError}). Saving won't work until it is back.`}</span>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-2xl border border-uk-line bg-uk-card p-5 text-sm text-uk-body">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-uk-blue" />
        <div className="space-y-1.5">
          <p>
            Keys are encrypted (AES-256) before they are stored, are never shown again after saving (only their last four characters), and only admins and HR staff can see this.
            Every change is recorded with who made it.
          </p>
          <p className="text-uk-muted">
            These stay in the server&apos;s environment, because the site needs them before it can read the database, or they are fixed when the site is built:{" "}
            <span className={code}>MONGODB_URI</span> <span className={code}>AUTH_SECRET</span> <span className={code}>ADMIN_EMAIL</span>{" "}
            <span className={code}>ADMIN_PASSWORD</span> <span className={code}>SITE_URL</span> <span className={code}>API_URL</span> and every{" "}
            <span className={code}>NEXT_PUBLIC_…</span> value. Changing <span className={code}>AUTH_SECRET</span> makes the keys saved here unreadable (they would need to be entered again).
            The HR mail server (SMTP) has its own form in Site settings.
          </p>
        </div>
      </div>

      <KeysForm statuses={statuses} />

      {history.length > 0 && (
        <div className="rounded-2xl border border-uk-line bg-uk-card p-6">
          <h3 className="font-heading text-lg font-semibold text-uk-heading">Recent key changes</h3>
          <ul className="mt-3 divide-y divide-uk-line text-sm">
            {history.map((h, n) => (
              <li key={n} className="flex flex-wrap justify-between gap-2 py-2">
                <span className="text-uk-body">
                  {keyDef(h.name)?.label ?? h.name} <span className="text-uk-muted">({h.action === "set" ? "added or replaced" : "removed"})</span>
                </span>
                <span className="text-xs text-uk-muted">
                  {h.by} · {new Date(h.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
