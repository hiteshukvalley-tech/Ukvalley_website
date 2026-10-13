"use client";

/** A table-header filter dropdown that applies as soon as a value is picked. */
export function ColumnFilterSelect({
  form, name, value, label, options,
}: {
  /** id of the filter form the select belongs to */
  form: string;
  name: string;
  value: string;
  label: string;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <select
      form={form}
      name={name}
      defaultValue={value}
      aria-label={`Filter by ${label}`}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className={`h-8 w-full min-w-28 rounded-md border bg-uk-card px-2 text-xs font-normal normal-case tracking-normal outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 ${
        value ? "border-uk-blue/60 text-uk-heading" : "border-uk-line text-uk-body"
      }`}
    >
      <option value="">All</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
