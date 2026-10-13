"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { T } from "./texts-context";

/** Copies `text` to the clipboard (press-kit boilerplates). */
export function CopyButton({ text, label = "Copy text" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard blocked (insecure origin, permissions): the text is on screen to select.
        }
      }}
      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-uk-line bg-white/80 px-3.5 text-xs font-semibold text-uk-heading transition-colors hover:border-uk-blue/50 hover:text-uk-blue-bright dark:bg-uk-card/80"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-uk-blue" /> : <Copy className="h-3.5 w-3.5" />}
      <span aria-live="polite">{copied ? <T>Copied</T> : <T>{label}</T>}</span>
    </button>
  );
}
