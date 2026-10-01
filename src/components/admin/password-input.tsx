"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Password input with an eye button that shows / hides what was typed. */
export function PasswordInput({
  id,
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type"> & { id: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input {...props} id={id} type={visible ? "text" : "password"} className={cn("h-10 pr-10", className)} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        aria-controls={id}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-uk-muted transition-colors hover:text-uk-heading focus-visible:text-uk-heading focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
