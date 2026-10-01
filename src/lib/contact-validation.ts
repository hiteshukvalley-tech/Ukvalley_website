// Shared by the browser form (instant feedback) and the server action (the
// check that actually counts). Keep client-safe: no server imports here.

import type { FieldErrors } from "./list-utils";

export const BUDGETS = [
  "Under ₹2L",
  "₹2L – ₹5L",
  "₹5L – ₹15L",
  "₹15L+",
  "Not sure yet",
];

export const SERVICES = [
  "Web development",
  "Mobile app",
  "Custom software / CRM / ERP",
  "Digital marketing",
  "Managed IT / cloud / security",
  "Blockchain / DeFi",
  "Cloud & DevOps",
  "Graphic & brand design",
  "Something else",
];

// Upper bound for the project description — also keeps the mailto: fallback
// URL well within browser/mail-client length limits.
export const MESSAGE_MAX = 1000;

export const LEAD_SOURCES = ["contact-page", "scoping-popup"] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number] | "website";

/**
 * Validates the optional mobile number. Returns an error message, or
 * undefined when the value is empty or valid.
 *  - Only digits, spaces, hyphens and one leading "+" are allowed.
 *  - Indian numbers: 10 digits starting 6–9, optionally prefixed with
 *    +91 / 91 / 0.
 *  - International numbers (leading "+" other than +91): 8–15 digits
 *    (E.164 length).
 */
export function validatePhone(raw: string): string | undefined {
  const value = raw.trim();
  if (!value) return undefined;

  if (!/^\+?[\d\s-]+$/.test(value)) {
    return "Mobile number can contain digits only — no letters or symbols.";
  }

  const digits = value.replace(/\D/g, "");

  if (value.startsWith("+") && !value.startsWith("+91")) {
    if (digits.length < 8 || digits.length > 15) {
      return "Enter a valid international number (8–15 digits incl. country code).";
    }
    return undefined;
  }

  let local = digits;
  if (value.startsWith("+91")) {
    // An explicit +91 must be followed by exactly 10 digits.
    local = digits.length === 12 ? digits.slice(2) : "";
  } else if (local.length === 12 && local.startsWith("91")) {
    local = local.slice(2);
  } else if (local.length === 11 && local.startsWith("0")) {
    local = local.slice(1);
  }

  if (!/^[6-9]\d{9}$/.test(local)) {
    return "Enter a valid 10-digit mobile number (starting with 6, 7, 8 or 9).";
  }
  return undefined;
}

export type EnquiryInput = {
  name: string;
  email: string;
  company: string;
  phone: string;
  service: string;
  budget: string;
  message: string;
  source: LeadSource;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validates a submitted enquiry form. Same rules as the browser form. */
export function validateEnquiry(
  data: FormData
): { ok: true; value: EnquiryInput } | { ok: false; errors: FieldErrors } {
  const get = (k: string) => String(data.get(k) ?? "").trim();
  const e: FieldErrors = {};

  const name = get("name");
  const email = get("email");
  const company = get("company");
  const phone = get("phone");
  const message = get("message");
  const service = get("service");
  const budget = get("budget");
  const source = get("source");

  if (name.length < 2) e.name = "Please enter your name.";
  else if (name.length > 100) e.name = "Name must be 100 characters or fewer.";
  if (!EMAIL.test(email) || email.length > 200) e.email = "Enter a valid email address.";
  if (company.length > 150) e.company = "Company must be 150 characters or fewer.";
  const phoneError = validatePhone(phone);
  if (phoneError) e.phone = phoneError;
  else if (phone.length > 30) e.phone = "Mobile number is too long.";
  if (message.length < 10) e.message = "Tell us a little more (at least 10 characters).";
  else if (message.length > MESSAGE_MAX) e.message = `Please keep it under ${MESSAGE_MAX} characters.`;
  if (!data.get("consent")) e.consent = "Please agree to be contacted.";

  if (Object.keys(e).length) return { ok: false, errors: e };
  return {
    ok: true,
    value: {
      name, email: email.toLowerCase(), company, phone, message,
      // Only known choices are stored; anything else is dropped.
      service: SERVICES.includes(service) ? service : "",
      budget: BUDGETS.includes(budget) ? budget : "",
      source: (LEAD_SOURCES as readonly string[]).includes(source) ? (source as LeadSource) : "website",
    },
  };
}
