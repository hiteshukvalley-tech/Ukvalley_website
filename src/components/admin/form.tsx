import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/admin/password-input";
import { CharCounter } from "@/components/admin/char-counter";
import { SlugInput } from "@/components/admin/slug-input";
import { cn } from "@/lib/utils";

/** Titled card that groups related fields. Used on every admin form. */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-uk-line bg-uk-card p-6">
      <h2 className="font-heading text-lg font-semibold text-uk-heading">{title}</h2>
      {description && <p className="mt-1 text-sm text-uk-muted">{description}</p>}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

/** Label + input + hint + inline error, wired for accessibility. */
export function FormField({
  label,
  name,
  defaultValue,
  error,
  hint,
  type = "text",
  placeholder,
  required,
  full,
  inputMode,
  autoComplete,
  readOnly,
  maxLength,
  suggestions,
  slugFrom,
  example,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  error?: string;
  hint?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  /** span both columns */
  full?: boolean;
  inputMode?: "text" | "tel" | "email" | "url" | "numeric";
  autoComplete?: string;
  readOnly?: boolean;
  /** caps the length and shows a "12 / 200" counter under the box */
  maxLength?: number;
  /** suggestions offered while typing; any value is still accepted */
  suggestions?: readonly string[];
  /** makes this a slug box that is filled in from, and corrected like, the named field */
  slugFrom?: string;
  /** a sample value shown under the box */
  example?: string;
}) {
  const id = `f-${name.replace(/\./g, "-")}`;
  const describedBy =
    [error ? `${id}-err` : "", hint ? `${id}-hint` : "", example ? `${id}-example` : "", maxLength ? `${id}-count` : ""].filter(Boolean).join(" ") ||
    undefined;
  return (
    <div className={cn("space-y-2", full && "sm:col-span-2")}>
      <Label htmlFor={id} className="text-uk-heading">
        {label}
        {required && <span className="-ml-1 text-destructive" aria-hidden>*</span>}
      </Label>
      {type === "password" ? (
        <PasswordInput
          id={id}
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          required={required}
          readOnly={readOnly}
          maxLength={maxLength}
          autoComplete={autoComplete ?? "off"}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
      ) : slugFrom && !readOnly ? (
        <SlugInput
          id={id}
          name={name}
          slugFrom={slugFrom}
          defaultValue={defaultValue}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="h-10"
        />
      ) : (
        <Input
          id={id}
          name={name}
          type={type}
          defaultValue={defaultValue}
          placeholder={placeholder}
          required={required}
          readOnly={readOnly}
          maxLength={maxLength}
          inputMode={inputMode}
          autoComplete={autoComplete ?? "off"}
          list={suggestions ? `${id}-list` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="h-10"
        />
      )}
      {suggestions && (
        <datalist id={`${id}-list`}>
          {suggestions.map((s) => <option key={s} value={s} />)}
        </datalist>
      )}
      {maxLength ? (
        <div className="flex items-start gap-3">
          <FieldMessage id={id} error={error} hint={hint} example={example} />
          <CharCounter htmlFor={id} max={maxLength} />
        </div>
      ) : (
        <FieldMessage id={id} error={error} hint={hint} example={example} />
      )}
    </div>
  );
}

function FieldMessage({ id, error, hint, example }: { id: string; error?: string; hint?: string; example?: string }) {
  return (
    <>
      {error && (
        <p id={`${id}-err`} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
      {hint && <p id={`${id}-hint`} className="text-xs text-uk-muted">{hint}</p>}
      {example && (
        <div id={`${id}-example`} className="rounded-lg border border-dashed border-uk-line bg-uk-surface-2 px-3 py-2 text-xs text-uk-body">
          <span className="font-semibold text-uk-heading">Example</span>
          <span className="mt-1 block whitespace-pre-line font-mono text-[0.72rem] leading-relaxed">{example}</span>
        </div>
      )}
    </>
  );
}

/** Multi-line version of FormField. */
export function FormTextarea({
  label, name, defaultValue, error, hint, placeholder, required, full, rows = 4, maxLength, example,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  required?: boolean;
  full?: boolean;
  rows?: number;
  /** caps the length and shows a "120 / 600" counter */
  maxLength?: number;
  /** a sample value shown under the box (for line-by-line formats) */
  example?: string;
}) {
  const id = `f-${name.replace(/\./g, "-")}`;
  const describedBy =
    [error ? `${id}-err` : "", hint ? `${id}-hint` : "", example ? `${id}-example` : "", maxLength ? `${id}-count` : ""].filter(Boolean).join(" ") ||
    undefined;
  return (
    <div className={cn("space-y-2", full && "sm:col-span-2")}>
      <Label htmlFor={id} className="text-uk-heading">
        {label}
        {required && <span className="-ml-1 text-destructive" aria-hidden>*</span>}
      </Label>
      <Textarea
        id={id}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      {maxLength ? (
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <FieldMessage id={id} error={error} hint={hint} example={example} />
          </div>
          <CharCounter htmlFor={id} max={maxLength} />
        </div>
      ) : (
        <FieldMessage id={id} error={error} hint={hint} example={example} />
      )}
    </div>
  );
}

/** Native select styled to match Input. */
export function FormSelect({
  label, name, defaultValue, error, hint, options, required, full, onChange,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  required?: boolean;
  full?: boolean;
  /** Optional: react to the choice (the select stays uncontrolled). */
  onChange?: (value: string) => void;
}) {
  const id = `f-${name.replace(/\./g, "-")}`;
  return (
    <div className={cn("space-y-2", full && "sm:col-span-2")}>
      <Label htmlFor={id} className="text-uk-heading">
        {label}
        {required && <span className="-ml-1 text-destructive" aria-hidden>*</span>}
      </Label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        required={required}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        className="h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-uk-card text-uk-heading">
            {o.label}
          </option>
        ))}
      </select>
      <FieldMessage id={id} error={error} hint={hint} />
    </div>
  );
}

/** Checkbox that submits "on" when ticked. */
export function FormCheckbox({
  label, name, defaultChecked, hint, full,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
  hint?: string;
  full?: boolean;
}) {
  const id = `f-${name.replace(/\./g, "-")}`;
  return (
    <div className={cn("space-y-1", full && "sm:col-span-2")}>
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-uk-heading">
        <input
          id={id}
          name={name}
          type="checkbox"
          defaultChecked={defaultChecked}
          className="h-4 w-4 accent-[var(--uk-blue)]"
        />
        {label}
      </label>
      {hint && <p className="text-xs text-uk-muted">{hint}</p>}
    </div>
  );
}
