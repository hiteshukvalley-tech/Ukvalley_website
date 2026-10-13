"use client";

import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string };

/**
 * Admin dropdown in the site's own colours, replacing the browser's native
 * <select> list (which Chrome on Windows draws with stray highlight lines).
 * Works in forms: the choice is submitted under `name` through a hidden input.
 * Keyboard: Enter/Space/↓ opens, ↑/↓ moves, Enter picks, Esc closes, typing jumps.
 */
export function AdminSelect({
  id, name, options, value, defaultValue, onChange, placeholder = "Choose…", required, invalid, describedBy, className,
}: {
  id?: string;
  name?: string;
  options: SelectOption[];
  /** controlled value */
  value?: string;
  /** uncontrolled starting value */
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
}) {
  const items = options.map((o) => ({ value: o.value, label: o.label }));
  return (
    <Select.Root
      items={items}
      name={name}
      required={required}
      // An empty string means "nothing chosen yet" (shows the placeholder).
      {...(value !== undefined ? { value: value || null } : { defaultValue: defaultValue || null })}
      onValueChange={(v) => onChange?.(typeof v === "string" ? v : "")}
    >
      <Select.Trigger
        id={id}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "group flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-input bg-uk-card px-3 text-left text-sm text-uk-heading outline-none transition-colors",
          "hover:border-uk-blue/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "data-popup-open:border-uk-blue data-popup-open:ring-3 data-popup-open:ring-uk-blue/20",
          "aria-invalid:border-destructive",
          className
        )}
      >
        <Select.Value className="truncate data-placeholder:text-uk-muted" placeholder={placeholder} />
        <Select.Icon className="shrink-0 text-uk-muted transition-transform duration-150 group-data-popup-open:rotate-180">
          <ChevronDown className="h-4 w-4" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Positioner sideOffset={6} alignItemWithTrigger={false} className="z-[90] outline-none">
          <Select.Popup
            className={cn(
              "max-h-[min(20rem,var(--available-height))] min-w-[var(--anchor-width)] overflow-y-auto rounded-xl border border-uk-line bg-uk-card p-1.5 text-sm shadow-premium-lg outline-none",
              "origin-[var(--transform-origin)] transition-[opacity,transform] duration-150 data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0"
            )}
          >
            <Select.List>
              {options.map((o) => (
                <Select.Item
                  key={o.value}
                  value={o.value}
                  className={cn(
                    "flex cursor-pointer select-none items-center justify-between gap-3 rounded-lg px-3 py-2 text-uk-body outline-none transition-colors",
                    // One solid highlight for the hovered / keyboard-focused option.
                    "data-highlighted:bg-uk-blue/10 data-highlighted:text-uk-heading",
                    "data-selected:font-semibold data-selected:text-uk-blue"
                  )}
                >
                  <Select.ItemText>{o.label}</Select.ItemText>
                  <Select.ItemIndicator className="text-uk-blue">
                    <Check className="h-4 w-4" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
