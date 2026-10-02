"use client";

import { useState, useTransition } from "react";
import { Check, Copy, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { deleteMediaAction } from "./actions";
import { toast } from "@/components/admin/toast";

export type MediaCardItem = {
  id: string;
  name: string;
  sizeLabel: string;
  dateLabel: string;
};

const btn =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-uk-line px-2.5 text-xs font-medium text-uk-muted transition-colors hover:bg-uk-surface-2 hover:text-uk-heading disabled:opacity-40";

export function MediaCard({ item }: { item: MediaCardItem }) {
  const path = `/media/${item.id}`;
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();

  async function copy() {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard API needs a secure context; fall back to a prompt.
      window.prompt("Copy this URL:", url);
      return;
    }
    setCopied(true);
    toast.info("Image URL copied.");
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <li className="overflow-hidden rounded-2xl border border-uk-line bg-uk-card">
      <div className="flex aspect-[4/3] items-center justify-center bg-uk-surface-2">
        {/* Plain <img>: files are served by our own route, not the Next image optimizer. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={path} alt={item.name} loading="lazy" className="h-full w-full object-contain" />
      </div>
      <div className="space-y-2 p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-uk-heading" title={item.name}>{item.name}</p>
          <p className="text-xs text-uk-muted">{item.sizeLabel} · {item.dateLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" className={btn} onClick={copy} aria-label={`Copy URL of ${item.name}`}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy URL"}
          </button>
          <a href={path} target="_blank" rel="noreferrer" className={btn} aria-label={`Open ${item.name}`}>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            type="button"
            className={`${btn} ml-auto hover:!text-destructive`}
            disabled={pending}
            aria-label={`Delete ${item.name}`}
            onClick={() => {
              if (window.confirm(`Delete “${item.name}”? Any page using this URL will show a broken image. This can't be undone.`)) {
                start(async () => {
                  const r = await deleteMediaAction(item.id);
                  setError(r.ok ? undefined : r.message);
                  toast.result(r, `“${item.name}” deleted.`);
                });
              }
            }}
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
        {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      </div>
    </li>
  );
}
