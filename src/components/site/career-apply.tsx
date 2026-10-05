"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowRight, Check, FileText, Loader2, Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  COVER_LETTER_MAX, EMAIL_MAX, EXPERIENCE_OPTIONS, LOCATION_MAX, NAME_MAX, PORTFOLIO_MAX, POSITION_MAX,
  RESUME_MAX_BYTES, readApplication, resumeError, validateApplication, type ApplyResult,
} from "@/lib/applications-validation";
import { validatePhone } from "@/lib/contact-validation";
import { DEFAULT_HIRING_PROCESS, type HiringStep } from "@/lib/careers-shared";
import { T, Tx, useT } from "@/components/site/texts-context";

/**
 * Careers "Apply" popup. Wrap the open roles in <CareerApplyProvider>; any
 * <ApplyButton position="…"> inside opens the application form with that
 * position filled in. Submissions go to POST /careers/apply.
 */

type ApplyContextValue = { open: (position?: string) => void };
const ApplyContext = createContext<ApplyContextValue>({ open: () => {} });

export function ApplyButton({
  position,
  className,
  children,
}: {
  position?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { open } = useContext(ApplyContext);
  return (
    <button type="button" onClick={() => open(position)} className={`cursor-pointer ${className ?? ""}`}>
      {children}
    </button>
  );
}

export function CareerApplyProvider({
  positions,
  processes = {},
  children,
}: {
  positions: string[];
  /** Hiring stages per role title, shown as "What happens next" after applying. */
  processes?: Record<string, HiringStep[]>;
  children: React.ReactNode;
}) {
  const [position, setPosition] = useState<string | null>(null);
  const isOpen = position !== null;
  const opener = useRef<HTMLElement | null>(null);

  const open = useCallback((p?: string) => {
    opener.current = document.activeElement as HTMLElement | null;
    setPosition(p ?? "");
  }, []);
  const close = useCallback(() => {
    setPosition(null);
    // Back to the button that opened the popup, for keyboard users.
    setTimeout(() => opener.current?.focus(), 0);
  }, []);

  // Escape closes; the page behind can't scroll while the popup is open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const html = document.documentElement;
    const prev = [document.body.style.overflow, html.style.overflow];
    document.body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      [document.body.style.overflow, html.style.overflow] = prev;
    };
  }, [isOpen, close]);

  return (
    <ApplyContext.Provider value={{ open }}>
      {children}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="apply-title"
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6"
        >
          <div className="scoping-fade fixed inset-0 bg-uk-heading/50 backdrop-blur-md dark:bg-[#070511]/70" onClick={close} aria-hidden />

          <div className="scoping-pop relative w-full max-w-2xl" data-lenis-prevent>
            <div
              className="pointer-events-none absolute -inset-2 rounded-[2rem] bg-gradient-to-br from-uk-yellow/40 via-uk-blue/30 to-uk-blue-bright/40 opacity-90 blur-lg dark:opacity-100"
              aria-hidden
            />
            <div className="scoping-ring pointer-events-none absolute -inset-[2px] rounded-[1.75rem]" aria-hidden />

            <div className="relative">
              <button
                type="button"
                onClick={close}
                className="absolute right-4 top-4 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-uk-line bg-white/90 text-uk-muted shadow-float backdrop-blur transition-all duration-300 hover:rotate-90 hover:border-uk-blue/50 hover:text-uk-blue dark:bg-uk-card/90"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-3xl border border-uk-line bg-uk-surface shadow-premium-lg sm:max-h-[calc(100dvh-3rem)]">
                <div className="relative h-1.5 w-full overflow-hidden" aria-hidden>
                  <div className="absolute inset-0 bg-gradient-to-r from-uk-yellow via-uk-blue to-uk-blue-bright" />
                  <div className="scoping-sheen absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                </div>

                <div className="relative overflow-hidden bg-uk-surface-blue px-5 pb-6 pt-6 sm:px-8 sm:pt-8">
                  <div className="absolute inset-0 bg-blueprint bg-grid-fade opacity-60" aria-hidden />
                  <div className="relative flex flex-col gap-2 pr-12">
                    <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/25 bg-white/70 px-3.5 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-uk-blue dark:bg-uk-card/70">
                      <T>Careers at Ukvalley</T>
                    </span>
                    <h2 id="apply-title" className="font-heading text-2xl font-bold leading-tight text-uk-heading">
                      <T>Apply to join Ukvalley</T>
                    </h2>
                    <p className="text-sm text-uk-muted">
                      <T>Fields marked</T> <span className="text-red-600 dark:text-red-400">*</span> <T>are required. Our HR team reads every application and replies by email.</T>
                    </p>
                  </div>
                </div>

                <div className="p-5 sm:p-8">
                  <ApplicationForm initialPosition={position ?? ""} positions={positions} processes={processes} onDone={close} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ApplyContext.Provider>
  );
}

function ApplicationForm({
  initialPosition,
  positions,
  processes,
  onDone,
}: {
  initialPosition: string;
  positions: string[];
  processes: Record<string, HiringStep[]>;
  onDone: () => void;
}) {
  const t = useT();
  const [status, setStatus] = useState<"idle" | "submitting" | "sent">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [fileName, setFileName] = useState<string>();
  const [coverLength, setCoverLength] = useState(0);
  const [sentTo, setSentTo] = useState<{ name: string; email: string; position: string }>();
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstField.current?.focus();
  }, []);

  function clearError(name: string) {
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const input = readApplication(data);
    const errs = validateApplication(input);
    const file = data.get("resume");
    const fileErr = resumeError(typeof file === "string" ? null : file);
    if (fileErr) errs.resume = fileErr;
    setErrors(errs);
    setFormError(undefined);
    if (Object.keys(errs).length) {
      // Take the user to the first problem.
      const first = Object.keys(errs)[0];
      (form.elements.namedItem(first === "resume" ? "resume-button" : first) as HTMLElement | null)?.focus();
      return;
    }

    setStatus("submitting");
    let result: ApplyResult | undefined;
    try {
      const res = await fetch("/careers/apply", { method: "POST", body: data });
      result = (await res.json()) as ApplyResult;
    } catch {
      result = undefined;
    }

    if (result?.ok) {
      setSentTo({ name: input.name.split(" ")[0], email: input.email, position: input.position });
      setStatus("sent");
      return;
    }
    setStatus("idle");
    if (result && result.kind === "invalid") {
      setErrors(result.errors);
      if (result.errors.form) setFormError(result.errors.form);
      return;
    }
    setFormError(
      result && "message" in result
        ? result.message
        : "Something went wrong while sending your application. Please check your connection and try again."
    );
  }

  if (status === "sent" && sentTo) {
    // Match the typed position to a listed role, ignoring case; open applications get the default flow.
    const key = Object.keys(processes).find((p) => p.toLowerCase() === sentTo.position.trim().toLowerCase());
    const steps = (key && processes[key]) || DEFAULT_HIRING_PROCESS;
    return (
      <div className="flex flex-col items-center py-6 text-center" role="status">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-uk-blue/15 text-uk-blue">
          <Check className="h-7 w-7" />
        </span>
        <h3 className="mt-4 font-heading text-xl font-bold text-uk-heading"><T>Thank you,</T> {sentTo.name}<T>! Your application is in.</T></h3>
        <p className="mt-2 max-w-md text-sm text-uk-body">
          <T>We&apos;ve received your application for</T> <span className="font-semibold text-uk-heading"><Tx>{sentTo.position}</Tx></span> <T>and
          sent a confirmation to</T> <span className="font-semibold text-uk-heading"><Tx>{sentTo.email}</Tx></span><T>. Our HR team will be in
          touch if your profile is a match.</T>
        </p>
        <div className="mt-6 w-full max-w-md rounded-2xl border border-uk-line bg-uk-card p-5 text-left">
          <h4 className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-uk-muted"><T>What happens next</T></h4>
          <ol className="mt-3 flex flex-col gap-3">
            {steps.map((s, i) => (
              <li key={`${i}-${s.title}`} className="flex items-start gap-3">
                <span
                  className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-bold ${
                    i === 0 ? "bg-uk-blue text-uk-white" : "bg-uk-blue/12 text-uk-blue"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="text-sm text-uk-body">
                  <span className="font-semibold text-uk-heading"><Tx>{s.title}</Tx></span>
                  {i === 0 && <span className="ml-2 rounded-full bg-uk-blue/10 px-2 py-0.5 text-[0.65rem] font-semibold text-uk-blue"><T>You are here</T></span>}
                </span>
              </li>
            ))}
          </ol>
        </div>
        <button
          type="button"
          onClick={onDone}
          className="mt-6 inline-flex h-11 items-center rounded-full bg-uk-blue px-6 text-sm font-semibold text-uk-white transition-colors hover:bg-uk-blue-bright"
        >
          <T>Close</T>
        </button>
      </div>
    );
  }

  const submitting = status === "submitting";
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {/* Honeypot — hidden from people; bots fill it and are ignored. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          <T>Website</T>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Full Name" htmlFor="apply-name" error={errors.name} required>
          <Input
            ref={firstField} id="apply-name" name="name" autoComplete="name" placeholder={t("Your full name")} maxLength={NAME_MAX}
            aria-invalid={!!errors.name || undefined} onInput={() => clearError("name")} className="h-11 px-3.5"
          />
        </Field>
        <Field label="Email Address" htmlFor="apply-email" error={errors.email} required>
          <Input
            id="apply-email" name="email" type="email" autoComplete="email" placeholder={t("you@example.com")} maxLength={EMAIL_MAX}
            aria-invalid={!!errors.email || undefined} onInput={() => clearError("email")} className="h-11 px-3.5"
          />
        </Field>
        <Field label="Phone Number" htmlFor="apply-phone" error={errors.phone} required>
          <Input
            id="apply-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder={t("+91 98765 43210")} maxLength={18}
            aria-invalid={!!errors.phone || undefined}
            onInput={() => clearError("phone")}
            onBlur={(e) => {
              const err = e.target.value.trim() ? validatePhone(e.target.value) : undefined;
              if (err) setErrors((prev) => ({ ...prev, phone: err }));
            }}
            className="h-11 px-3.5"
          />
        </Field>
        <Field label="Current Location" htmlFor="apply-location" error={errors.location} required>
          <Input
            id="apply-location" name="location" autoComplete="address-level2" placeholder={t("City, State")} maxLength={LOCATION_MAX}
            aria-invalid={!!errors.location || undefined} onInput={() => clearError("location")} className="h-11 px-3.5"
          />
        </Field>
        <Field label="Position Applied For" htmlFor="apply-position" error={errors.position} required>
          <Input
            id="apply-position" name="position" list="apply-positions" defaultValue={initialPosition}
            placeholder={t("Select or type a position")} maxLength={POSITION_MAX} autoComplete="off"
            aria-invalid={!!errors.position || undefined} onInput={() => clearError("position")} className="h-11 px-3.5"
          />
          <datalist id="apply-positions">
            {positions.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </Field>
        <Field label="Years Of Experience" htmlFor="apply-experience" error={errors.experience} required>
          <select
            id="apply-experience" name="experience" defaultValue=""
            aria-invalid={!!errors.experience || undefined} onChange={() => clearError("experience")}
            // text-base on phones: iOS zooms into fields under 16px.
            className="h-11 w-full rounded-lg border border-uk-line bg-uk-card px-3 text-base text-uk-body outline-none transition-colors focus:border-uk-blue aria-invalid:border-destructive sm:text-sm"
          >
            <option value="" disabled><T>Select experience…</T></option>
            {EXPERIENCE_OPTIONS.map((x) => (
              <option key={x} value={x}><Tx>{x}</Tx></option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Portfolio / LinkedIn (Optional)" htmlFor="apply-portfolio" error={errors.portfolio}>
        <Input
          id="apply-portfolio" name="portfolio" type="url" inputMode="url" placeholder={t("https://")} maxLength={PORTFOLIO_MAX}
          aria-invalid={!!errors.portfolio || undefined} onInput={() => clearError("portfolio")} className="h-11 px-3.5"
        />
      </Field>

      <Field label="Upload Resume (PDF Only)" htmlFor="apply-resume" error={errors.resume} required>
        <div
          className={`flex flex-wrap items-center gap-3 rounded-lg border border-dashed px-3.5 py-3 ${
            errors.resume ? "border-destructive" : "border-uk-line-2 bg-uk-surface-2"
          }`}
        >
          <input
            id="apply-resume" name="resume" type="file" accept="application/pdf,.pdf" className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setFileName(f?.name);
              const err = f ? resumeError(f) : undefined;
              setErrors((prev) => {
                const next = { ...prev };
                if (err) next.resume = err;
                else delete next.resume;
                return next;
              });
            }}
          />
          <button
            type="button" name="resume-button"
            onClick={() => document.getElementById("apply-resume")?.click()}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-uk-line bg-uk-card px-3.5 text-sm font-medium text-uk-heading transition-colors hover:border-uk-blue/50 hover:text-uk-blue"
          >
            <Upload className="h-4 w-4" />
            <T>Choose file</T>
          </button>
          <span className="flex min-w-0 flex-1 items-center gap-1.5 text-sm text-uk-muted">
            {fileName ? (
              <>
                <FileText className="h-4 w-4 shrink-0 text-uk-blue" />
                <span className="truncate text-uk-body"><Tx>{fileName}</Tx></span>
              </>
            ) : (
              "No file chosen"
            )}
          </span>
          <span className="w-full text-xs text-uk-muted"><T>PDF only, up to</T> {RESUME_MAX_BYTES / 1024 / 1024} <T>MB.</T></span>
        </div>
      </Field>

      <Field label="Cover Letter (Optional)" htmlFor="apply-cover" error={errors.coverLetter}>
        <Textarea
          id="apply-cover" name="coverLetter" rows={5} maxLength={COVER_LETTER_MAX} placeholder={t("Write your cover letter...")}
          onChange={(e) => {
            setCoverLength(e.target.value.length);
            clearError("coverLetter");
          }}
          aria-describedby="apply-cover-count"
          data-lenis-prevent
          className="h-32 min-h-32 resize-none overflow-y-auto overscroll-contain px-3.5 py-3 field-sizing-fixed"
        />
        <span id="apply-cover-count" className="self-end text-xs tabular-nums text-uk-muted">
          {coverLength}/{COVER_LETTER_MAX}
        </span>
      </Field>

      {formError && (
        <p role="alert" className="flex items-start gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <Tx>{formError}</Tx>
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn-sheen inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-uk-blue px-6 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright disabled:opacity-60"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {submitting ? <T>Submitting…</T> : <T>Submit Application</T>}
        {!submitting && <ArrowRight className="h-4 w-4" />}
      </button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor} className="gap-0.5 text-sm font-medium text-uk-body">
        <Tx>{label}</Tx>
        {required && (
          <span className="text-red-600 dark:text-red-400" aria-hidden>
            {" "}*
          </span>
        )}
      </Label>
      {children}
      {error && (
        <span role="alert" className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <Tx>{error}</Tx>
        </span>
      )}
    </div>
  );
}
