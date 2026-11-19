import Link from "@/components/site/intent-link";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin-session";
import { hasMailer } from "@/lib/mailer";
import { listCareersForAdmin } from "@/lib/careers-store";
import { API_URL } from "@/lib/site-origin";
import { aiConfigured, aiModel, isMockAi } from "@/lib/ai-interview/ai";
import { ensureIntegrationKeys, integrationKey } from "@/lib/integration-keys";
import { calendarStatus, googleConfigured } from "@/lib/ai-interview/google-calendar";
import { storageKind } from "@/lib/ai-interview/recordings";
import { getAiSettings, getJobOverride, listJobOverrides } from "@/lib/ai-interview/settings-store";
import { effectiveSettings } from "@/lib/ai-interview/types";
import { whatsappConfigured } from "@/lib/ai-interview/whatsapp";
import { Panel, fmt } from "../ui";
import { DisconnectGoogle } from "./disconnect-google";
import { RebuildModels } from "./rebuild-models";
import { modelCounts } from "@/lib/ai-interview/models-store";
import { MODEL_COLLECTIONS, type ModelKey } from "@/lib/ai-interview/models";
import { JobOverrideForm, SettingsForm } from "./settings-form";

export const metadata = { title: "AI interview settings" };
export const dynamic = "force-dynamic";

function Status({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />}
      <span className="text-uk-body">{children}</span>
    </li>
  );
}

const code = "rounded bg-uk-surface-2 px-1 font-mono text-xs";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ job?: string; google?: string }> }) {
  const me = await requireAdmin("ai-interviews");
  await ensureIntegrationKeys();
  const sp = await searchParams;
  // Keys are edited in Site settings → API keys (admins only).
  const keysLink = me.role === "admin" ? <a href="/admin/settings/api-keys" className="text-uk-blue hover:underline">API keys</a> : <>API keys (ask an admin)</>;
  const [{ settings, templates }, mail, cal, careers, overrides] = await Promise.all([getAiSettings(), hasMailer(), calendarStatus(), listCareersForAdmin(), listJobOverrides()]);
  const counts = await modelCounts();
  const job = careers.items.find((c) => c.slug === sp.job);
  const override = job ? await getJobOverride(job.slug) : null;
  const overridden = new Set(overrides.map((o) => o.careerSlug));

  return (
    <>
      <PageHeader
        title="AI interview settings"
        crumbs={[{ label: "AI interviews", href: "/admin/ai-interviews" }, { label: "Settings" }]}
        description="How AI interviews are scheduled, run and scored, the messages candidates get, and the connected services. Changes apply to interviews created from now on."
      />

      {sp.google === "connected" && <p role="status" className="mb-4 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300">Google Calendar connected.</p>}
      {sp.google === "error" && <p role="alert" className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">Google Calendar could not be connected. Check the OAuth client's redirect address and try again.</p>}

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem] [&>*]:min-w-0">
        <SettingsForm settings={settings} templates={templates} />

        <aside className="space-y-6">
          <Panel title="Connected services">
            <ul className="space-y-3">
              <Status ok={aiConfigured()}>
                <strong>AI (Claude API):</strong>{" "}
                {isMockAi() ? <>test mode: fixed questions and scores, not real. Switch AI mode to Live in {keysLink}.</> : aiConfigured() ? <>configured, model <span className={code}>{aiModel()}</span>.</> : <>add the Anthropic API key in {keysLink}.</>}
              </Status>
              <Status ok={mail}>
                <strong>Email:</strong> {mail ? "the HR mail server (Site settings) sends interview emails." : "not configured: set the HR email (SMTP) in Site settings."}
              </Status>
              <Status ok={whatsappConfigured()}>
                <strong>WhatsApp:</strong>{" "}
                {whatsappConfigured() ? <>configured. Delivery receipts: <span className={code}>{API_URL}/whatsapp/webhook</span></> : <>add the access token and phone number ID in {keysLink}; templates must be approved in WhatsApp Manager.</>}
              </Status>
              <Status ok={cal.connected && !cal.unreadable}>
                <strong>Google Calendar:</strong>{" "}
                {!googleConfigured() ? (
                  <>add the OAuth client ID and secret in {keysLink}. Until then, invitations carry a calendar file.</>
                ) : cal.connected ? (
                  <>
                    connected as {cal.email || "a Google account"} ({fmt(cal.connectedAt)}){cal.unreadable ? ": the saved token can't be read, connect again." : "."}
                    <span className="mt-2 flex gap-2">
                      {/* A route that redirects to Google, not a page: a plain link on purpose. */}
                      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                      <a href="/admin/ai-interviews/settings/google/connect" className="text-uk-blue hover:underline">Reconnect</a>
                      <DisconnectGoogle />
                    </span>
                  </>
                ) : (
                  <>
                    not connected.{" "}
                    {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                    <a href="/admin/ai-interviews/settings/google/connect" className="text-uk-blue hover:underline">Connect Google Calendar</a>
                    <span className="mt-1 block text-xs text-uk-muted">Redirect URI to register: <span className={code}>{API_URL}/admin/ai-interviews/settings/google/callback</span></span>
                  </>
                )}
              </Status>
              <Status ok>
                <strong>Recordings:</strong> encrypted, stored in {storageKind() === "s3" ? `S3 (${integrationKey("S3_RECORDINGS_BUCKET") || "bucket not set"})` : "MongoDB (GridFS)"}. Played only through the admin.
              </Status>
            </ul>
          </Panel>

          <Panel title="Data models">
            <p className="text-sm text-uk-muted">Each interview is also stored as separate records, kept up to date automatically (also readable through the HR API).</p>
            {counts ? (
              <ul className="mt-3 space-y-1 text-sm">
                {(Object.keys(MODEL_COLLECTIONS) as ModelKey[]).map((k) => (
                  <li key={k} className="flex justify-between gap-3">
                    <span className={code}>{MODEL_COLLECTIONS[k]}</span>
                    <span className="tabular-nums text-uk-heading">{counts[k].toLocaleString("en-IN")}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-uk-muted">Available once the database is connected.</p>
            )}
            {counts && <RebuildModels />}
          </Panel>

          <Panel title="Settings for one job">
            <form method="get" className="flex gap-2">
              <select name="job" defaultValue={job?.slug ?? ""} className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-transparent px-3 text-sm text-uk-body" aria-label="Job opening">
                <option value="">Choose a job opening…</option>
                {careers.items.map((c) => <option key={c.slug} value={c.slug}>{c.role}{overridden.has(c.slug) ? " (own settings)" : ""}{c.published ? "" : " (draft)"}</option>)}
              </select>
              <button type="submit" className="h-10 rounded-lg border border-uk-line px-3 text-sm">Open</button>
            </form>
            {careers.dbError && <p className="mt-2 text-xs text-uk-muted">Job openings come from Careers once they are in the database.</p>}
            {overrides.length > 0 && !job && (
              <ul className="mt-3 space-y-1 text-sm">
                {overrides.map((o) => (
                  <li key={o.careerSlug}><Link href={`?job=${o.careerSlug}`} className="text-uk-blue hover:underline">{careers.items.find((c) => c.slug === o.careerSlug)?.role ?? o.careerSlug}</Link> <span className="text-xs text-uk-muted">({o.override.enabled === false ? "off" : "own settings"})</span></li>
                ))}
              </ul>
            )}
          </Panel>
        </aside>
      </div>

      {job && (
        <section id="job" className="mt-6 rounded-2xl border border-uk-line bg-uk-card p-5">
          <h2 className="mb-4 font-heading text-lg font-semibold text-uk-heading">Interview settings for {job.role}</h2>
          <JobOverrideForm key={job.slug} careerSlug={job.slug} role={job.role} base={effectiveSettings(settings, override)} enabled={override?.enabled !== false} />
        </section>
      )}
    </>
  );
}
