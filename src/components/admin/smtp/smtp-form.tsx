"use client";

import { useActionState, useMemo, useRef, useState, useTransition } from "react";
import { Loader2, Save, Send, Trash2, Zap } from "lucide-react";
import { FormField, FormSection } from "@/components/admin/form";
import { AdminSelect } from "@/components/admin/admin-select";
import { Label } from "@/components/ui/label";
import { useResultToast } from "@/components/admin/toast";
import { confirmDialog } from "@/components/admin/confirm-dialog";
import type { SmtpSecurity } from "@/lib/smtp-settings";
import { removeSmtpAction, saveSmtpAction, testSmtpAction, type SmtpState, type SmtpValues } from "./actions";

/** Wording of the form for the HR settings or one user's own. */
const COPY = {
  hr: {
    server: "The mail server for every automatic email: application notices, thank-yous and admin password-reset codes. It also sends for users who haven't set their own.",
    sender: "Who the emails come from. Status emails to applicants still show “Ukvalley HR Team” as the name.",
    remove: "Remove the HR email settings? Emails will use the server's SMTP settings, or stop if there are none.",
    removeLabel: "Remove saved settings",
  },
  user: {
    server: "This user's own mail server. Status emails and manual emails they send go out through it, from their address; replies come back to them.",
    sender: "The name and address applicants see on emails this user sends.",
    remove: "Remove these email settings? This user's emails will go out through the HR email settings again.",
    removeLabel: "Remove and use HR email",
  },
} as const;

const SECURITY_OPTIONS: { value: SmtpSecurity; label: string }[] = [
  { value: "ssl", label: "SSL/TLS (port 465)" },
  { value: "starttls", label: "STARTTLS (port 587)" },
  { value: "none", label: "None (not recommended)" },
];
const DEFAULT_PORT: Record<SmtpSecurity, string> = { ssl: "465", starttls: "587", none: "25" };

const PRESETS: { label: string; host: string; security: SmtpSecurity }[] = [
  { label: "Gmail / Google Workspace", host: "smtp.gmail.com", security: "ssl" },
  { label: "Outlook / Microsoft 365", host: "smtp.office365.com", security: "starttls" },
  { label: "Zoho Mail", host: "smtp.zoho.in", security: "ssl" },
];

const btn =
  "inline-flex h-10 items-center gap-2 rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading disabled:opacity-60";

/**
 * SMTP settings form: server, login, sender, a test email, save and remove.
 * `scope` is "hr" (Site settings) or "user:<id>" (a user's own settings); the
 * server actions check who may change which.
 */
export function SmtpForm({
  scope, initial, hasSaved, hasPassword,
}: {
  scope: string;
  initial: SmtpValues;
  hasSaved: boolean;
  hasPassword: boolean;
}) {
  const copy = scope === "hr" ? COPY.hr : COPY.user;
  const save = useMemo(() => saveSmtpAction.bind(null, scope), [scope]);
  const test = useMemo(() => testSmtpAction.bind(null, scope), [scope]);
  const [saveState, saveAction, saving] = useActionState<SmtpState, FormData>(save, {});
  const [testState, testAction, testing] = useActionState<SmtpState, FormData>(test, {});
  const [removeState, setRemoveState] = useState<SmtpState>({});
  const [removing, startRemove] = useTransition();

  // The newest result decides what the form shows.
  const latest = [saveState, testState, removeState].reduce((a, b) => ((b.nonce ?? 0) > (a.nonce ?? 0) ? b : a));
  useResultToast(saveState);
  useResultToast(testState);
  useResultToast(removeState);
  const errors = latest.status === "error" ? (latest.errors ?? {}) : {};

  // Values for (re)mounting the inputs: after a result, or after picking a preset.
  const formRef = useRef<HTMLFormElement>(null);
  const [preset, setPreset] = useState<{ values: SmtpValues; n: number } | null>(null);
  const resultValues = latest.status === "removed" ? { ...initial, host: "", user: "", fromName: "", fromEmail: "" } : latest.values;
  const values = preset && preset.n > (latest.nonce ?? 0) ? preset.values : (resultValues ?? initial);
  const [security, setSecurity] = useState<SmtpSecurity>(values.security);
  const [port, setPort] = useState(values.port);
  // The form remounts after every result, which would empty the password box:
  // keep what was typed so "Send test email" then "Save settings" works.
  // Cleared once the settings are saved or removed.
  const [passDraft, setPassDraft] = useState("");
  const passValue = latest.status === "saved" || latest.status === "removed" ? "" : passDraft;

  const current = (): SmtpValues => {
    const fd = new FormData(formRef.current ?? undefined);
    const get = (k: string) => String(fd.get(k) ?? "");
    return { host: get("host"), port, security, user: get("user"), fromName: get("fromName"), fromEmail: get("fromEmail"), testTo: get("testTo") };
  };

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    const port = DEFAULT_PORT[p.security];
    setSecurity(p.security);
    setPort(port);
    // Newer than the latest result (whose nonce is a timestamp); any later result wins again.
    setPreset({ values: { ...current(), host: p.host, security: p.security, port }, n: (latest.nonce ?? 0) + 1 });
  };

  const busy = saving || testing || removing;
  const key = `${latest.nonce ?? 0}-${preset?.n ?? 0}`;

  return (
    <form
      ref={formRef}
      action={saveAction}
      key={key}
      className="space-y-6"
      noValidate
      onInput={(e) => {
        const el = e.target as HTMLInputElement;
        if (el.name === "pass") setPassDraft(el.value);
      }}
    >
      <FormSection title="SMTP server" description={copy.server}>
        <div className="space-y-2 sm:col-span-2">
          <span className="text-sm font-medium text-uk-heading">Quick setup</span>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p.label} type="button" onClick={() => applyPreset(p)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-uk-line px-3 text-sm font-medium text-uk-body transition-colors hover:border-uk-blue/50 hover:text-uk-heading">
                <Zap className="h-3.5 w-3.5 text-uk-blue" /> {p.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-uk-muted">Fills in the server, security and port. Then enter your username and password.</p>
        </div>

        <FormField label="SMTP server (host)" name="host" required defaultValue={values.host} error={errors.host} placeholder="smtp.gmail.com" />
        <div className="grid grid-cols-[1fr_7rem] gap-3">
          <div className="space-y-2">
            <Label htmlFor="f-security" className="text-uk-heading">Security</Label>
            <AdminSelect
              id="f-security"
              name="security"
              value={security}
              options={SECURITY_OPTIONS}
              onChange={(v) => {
                const s = v as SmtpSecurity;
                // Move the port along with the security, unless a custom port was typed.
                if (Object.values(DEFAULT_PORT).includes(port)) setPort(DEFAULT_PORT[s]);
                setSecurity(s);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="f-port" className="text-uk-heading">Port<span className="-ml-1 text-destructive" aria-hidden>*</span></Label>
            <input
              id="f-port"
              name="port"
              inputMode="numeric"
              value={port}
              onChange={(e) => setPort(e.target.value.replace(/\D/g, "").slice(0, 5))}
              aria-invalid={errors.port ? true : undefined}
              aria-describedby={errors.port ? "f-port-err" : undefined}
              className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
            />
          </div>
          {errors.port && <p id="f-port-err" role="alert" className="col-span-2 text-xs font-medium text-destructive">{errors.port}</p>}
        </div>

        <FormField label="Username" name="user" required defaultValue={values.user} error={errors.user} placeholder="you@ukvalley.com" autoComplete="off" hint="Usually the full email address of the sending account." />
        <FormField
          label="Password"
          name="pass"
          type="password"
          defaultValue={passValue}
          required={!hasPassword}
          error={errors.pass}
          autoComplete="new-password"
          placeholder={hasPassword ? "•••••••• (saved — leave blank to keep)" : "App Password"}
          hint="For Gmail: Google Account → Security → 2-Step Verification → App passwords. Stored encrypted; never shown again."
        />
      </FormSection>

      <FormSection title="Sender" description={copy.sender}>
        <FormField label="Sender name" name="fromName" defaultValue={values.fromName} error={errors.fromName} placeholder="Ukvalley Technologies" hint="Optional." />
        <FormField label="Sender email" name="fromEmail" type="email" inputMode="email" defaultValue={values.fromEmail} error={errors.fromEmail} placeholder="Same as the username" hint="Optional. Gmail always sends from the signed-in address." />
      </FormSection>

      <FormSection title="Send a test email" description="Checks the settings above (saved or not) by connecting to the server and sending a short email.">
        <FormField label="Send the test to" name="testTo" type="email" inputMode="email" defaultValue={values.testTo} error={errors.testTo} placeholder="you@example.com" />
        <div className="flex items-end">
          <button type="submit" formAction={testAction} disabled={busy} className={btn}>
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {testing ? "Sending test…" : "Send test email"}
          </button>
        </div>
      </FormSection>

      {/* Not sticky: this form sits on pages with another form (Site settings, Users) that has its own save bar. */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-uk-line bg-uk-card px-6 py-4">
        {hasSaved ? (
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              if (await confirmDialog(copy.remove)) {
                startRemove(async () => setRemoveState(await removeSmtpAction(scope)));
              }
            }}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-destructive/40 px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
          >
            {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {copy.removeLabel}
          </button>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={busy}
          className="btn-sheen inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-5 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : "Save email settings"}
        </button>
      </div>
    </form>
  );
}
