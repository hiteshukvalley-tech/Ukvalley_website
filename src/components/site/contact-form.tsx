"use client";

import { useState } from "react";
import { ArrowRight, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { company as defaultCompany } from "@/lib/site-core";
import { BUDGETS, MESSAGE_MAX, SERVICES, validatePhone } from "@/lib/contact-validation";
import { submitEnquiryAction } from "@/app/contact/actions";
import { T, Tx, useT } from "@/components/site/texts-context";

export function ContactForm({
  email = defaultCompany.email,
  phone = defaultCompany.phonePrimary,
  source = "contact-page",
}: {
  email?: string;
  phone?: string;
  /** where the form is shown, saved with the lead */
  source?: "contact-page" | "scoping-popup";
} = {}) {
  const t = useT();
  const company = { email, phonePrimary: phone };
  // "sent" = saved to the inbox; "mailto" = fallback, handed to the email app
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "mailto">("idle");
  const [formError, setFormError] = useState<string>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [messageLength, setMessageLength] = useState(0);

  function validate(form: HTMLFormElement) {
    const data = new FormData(form);
    const errs: Record<string, string> = {};
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const consent = data.get("consent");
    const phoneError = validatePhone(String(data.get("phone") ?? ""));

    if (name.length < 2) errs.name = "Please enter your name.";
    if (phoneError) errs.phone = phoneError;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Enter a valid email address.";
    }
    if (message.length < 10) {
      errs.message = "Tell us a little more (at least 10 characters).";
    } else if (message.length > MESSAGE_MAX) {
      errs.message = `Please keep it under ${MESSAGE_MAX} characters.`;
    }
    if (!consent) errs.consent = "Please agree to be contacted.";
    return errs;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const errs = validate(form);
    setErrors(errs);
    setFormError(undefined);
    if (Object.keys(errs).length > 0) return;

    setStatus("submitting");
    const data = new FormData(form);
    data.set("source", source);

    let result: Awaited<ReturnType<typeof submitEnquiryAction>> | undefined;
    try {
      result = await submitEnquiryAction(data);
    } catch {
      result = undefined;
    }

    if (result?.ok) {
      setStatus("sent");
      return;
    }
    if (result && !result.ok && result.kind === "invalid") {
      setErrors(result.errors);
      // Errors for fields without an inline message must still be visible.
      const shown = new Set(["name", "email", "company", "phone", "message", "consent"]);
      const other = Object.entries(result.errors).find(([k]) => !shown.has(k));
      if (other) setFormError(other[1]);
      setStatus("idle");
      return;
    }
    if (result && !result.ok && result.kind === "limited") {
      setFormError("You've sent several enquiries recently. Please email us directly and we'll reply there.");
      setStatus("idle");
      return;
    }

    // Not saved (no database, or the request failed): fall back to the
    // visitor's mail client so the enquiry is never lost.
    const subject = encodeURIComponent(`New project enquiry from ${data.get("name")}`);
    const body = encodeURIComponent(
      [
        `Name: ${data.get("name")}`,
        `Email: ${data.get("email")}`,
        `Company: ${data.get("company") || "—"}`,
        `Service: ${data.get("service") || "—"}`,
        `Budget: ${data.get("budget") || "—"}`,
        `Phone: ${data.get("phone") || "—"}`,
        "",
        "Message:",
        String(data.get("message")),
      ].join("\n")
    );
    window.location.href = `mailto:${company.email}?subject=${subject}&body=${body}`;
    setTimeout(() => setStatus("mailto"), 400);
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-uk-blue/30 bg-uk-card p-8 text-center" role="status">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-uk-blue/15 text-uk-blue">
          <Check className="h-6 w-6" />
        </span>
        <h3 className="mt-4 font-heading text-xl font-bold text-uk-heading">
          <T>Thanks — we&apos;ve received your enquiry.</T>
        </h3>
        <p className="mt-2 text-sm text-uk-body">
          A software architect will reply within one business hour. Prefer to talk now? Call{" "}
          <a
            href={`tel:${company.phonePrimary.replace(/\s+/g, "")}`}
            className="font-semibold text-uk-blue hover:text-uk-blue-bright"
          >
            <Tx>{company.phonePrimary}</Tx>
          </a>
          .
        </p>
        <button
          type="button"
          onClick={() => {
            setMessageLength(0);
            setStatus("idle");
          }}
          className="mt-5 text-sm font-semibold text-uk-blue underline-offset-4 hover:underline"
        >
          <T>Send another enquiry</T>
        </button>
      </div>
    );
  }

  if (status === "mailto") {
    return (
      <div className="rounded-2xl border border-uk-blue/30 bg-uk-card p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-uk-blue/15 text-uk-blue">
          <Check className="h-6 w-6" />
        </span>
        {/* The form has no backend — it hands the enquiry to the visitor's
            email app. Say so plainly: on phones without a mail app set up
            nothing opens, and "sent" would be untrue. */}
        <h3 className="mt-4 font-heading text-xl font-bold text-uk-heading">
          <T>One last step — press Send in your email app.</T>
        </h3>
        <p className="mt-2 text-sm text-uk-body">
          <T>We&apos;ve written the email for you. Once it&apos;s sent, we reply
          within one business hour.</T>
        </p>
        <p className="mt-4 text-sm text-uk-body">
          Email app didn&apos;t open? Write to{" "}
          <a href={`mailto:${company.email}`} className="font-semibold text-uk-blue hover:text-uk-blue-bright">
            <Tx>{company.email}</Tx>
          </a>{" "}
          or call{" "}
          <a
            href={`tel:${company.phonePrimary.replace(/\s+/g, "")}`}
            className="font-semibold text-uk-blue hover:text-uk-blue-bright"
          >
            <Tx>{company.phonePrimary}</Tx>
          </a>
          .
        </p>
        <button
          type="button"
          onClick={() => {
            // the form remounts empty, so reset the character counter too
            setMessageLength(0);
            setStatus("idle");
          }}
          className="mt-5 text-sm font-semibold text-uk-blue underline-offset-4 hover:underline"
        >
          <T>Back to the form</T>
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-5"
    >
      {/* Honeypot — hidden from people; bots fill it and are ignored. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          <T>Website</T>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="name" error={errors.name} required>
          <Input id="name" name="name" autoComplete="name" placeholder={t("Your name")} required maxLength={100} className="h-11 px-3.5" />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email} required>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder={t("you@example.com")} required maxLength={200} className="h-11 px-3.5" />
        </Field>
        <Field label="Company" htmlFor="company" error={errors.company}>
          <Input
            id="company"
            name="company"
            autoComplete="organization"
            placeholder={t("Company name")}
            maxLength={150}
            aria-invalid={errors.company ? true : undefined}
            className="h-11 px-3.5"
          />
        </Field>
        <Field label="Mobile number (optional)" htmlFor="phone" error={errors.phone}>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={18}
            placeholder={t("+91 98765 43210")}
            aria-invalid={errors.phone ? true : undefined}
            onChange={(e) => {
              const value = e.target.value;
              // Flag letters/symbols the moment they are typed; the full
              // length check waits for blur so a half-typed number isn't
              // shown as an error mid-entry.
              const hasInvalidChars = value.trim() !== "" && !/^\+?[\d\s-]*$/.test(value.trim());
              setErrors((prev) => {
                const next = { ...prev };
                if (hasInvalidChars) next.phone = validatePhone(value) ?? "";
                else delete next.phone;
                return next;
              });
            }}
            onBlur={(e) => {
              const err = validatePhone(e.target.value);
              setErrors((prev) => {
                const next = { ...prev };
                if (err) next.phone = err;
                else delete next.phone;
                return next;
              });
            }}
            className="h-11 px-3.5"
          />
        </Field>
      </div>

      <Field label="What do you need?" htmlFor="service">
        <select
          id="service"
          name="service"
          defaultValue=""
          // text-base (16px) on phones: iOS Safari auto-zooms into any
          // form field under 16px when it's tapped, and stays zoomed in.
          className="h-11 w-full rounded-lg border border-uk-line bg-uk-card px-3 text-base text-uk-body outline-none transition-colors focus:border-uk-blue sm:text-sm"
        >
          <option value="" disabled><T>Select a service…</T></option>
          {SERVICES.map((s) => (
            <option key={s} value={s}><Tx>{s}</Tx></option>
          ))}
        </select>
      </Field>

      <Field label="Budget range" htmlFor="budget">
        <div className="flex flex-wrap gap-2">
          {BUDGETS.map((b) => (
            <label key={b} className="cursor-pointer">
              <input type="radio" name="budget" value={b} className="peer sr-only" />
              <span className="inline-flex items-center rounded-full border border-uk-line bg-uk-surface-2 px-4 py-2 text-sm text-uk-body transition-colors peer-checked:border-uk-blue peer-checked:bg-uk-blue/10 peer-checked:text-uk-blue hover:border-uk-blue/50">
                <Tx>{b}</Tx>
              </span>
            </label>
          ))}
        </div>
      </Field>

      <Field label="Tell us about your project" htmlFor="message" error={errors.message} required>
        <Textarea
          id="message"
          name="message"
          rows={5}
          maxLength={MESSAGE_MAX}
          onChange={(e) => setMessageLength(e.target.value.length)}
          placeholder={t("Goals, scope, timeline, anything that helps us reply with substance.")}
          required
          aria-describedby="message-count"
          data-lenis-prevent
          className="h-32 min-h-32 resize-none overflow-y-auto overscroll-contain px-3.5 py-3 field-sizing-fixed"
        />
        <span
          id="message-count"
          className={`self-end text-xs tabular-nums ${
            messageLength >= MESSAGE_MAX ? "font-semibold text-destructive" : "text-uk-muted"
          }`}
        >
          {messageLength}/{MESSAGE_MAX}
        </span>
      </Field>

      <label className="flex items-start gap-3 text-sm text-uk-body">
        <input
          type="checkbox"
          name="consent"
          className="mt-0.5 h-4 w-4 flex-none rounded border-uk-line-2 bg-uk-card text-uk-blue"
        />
        <span>
          <T>I agree to be contacted about this enquiry. We never share your details.</T>
          {errors.consent && (
            <span className="mt-1 flex items-center gap-1 text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              <Tx>{errors.consent}</Tx>
            </span>
          )}
        </span>
      </label>

      {formError && (
        <p role="alert" className="flex items-center gap-1 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <Tx>{formError}</Tx>
        </p>
      )}

      <Button
        type="submit"
        disabled={status === "submitting"}
        className="h-13 bg-uk-blue text-uk-white hover:bg-uk-blue-bright"
      >
        <Tx>{status === "submitting" ? "Sending…" : "Send enquiry"}</Tx>
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>

      <p className="text-center text-xs text-uk-muted">
        <T>Within 1 business hour: a reply. 3 days: a rough estimate. 7 days: a fixed proposal.</T>
      </p>
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
            *
          </span>
        )}
      </Label>
      {children}
      {error && (
        <span className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
          <Tx>{error}</Tx>
        </span>
      )}
    </div>
  );
}