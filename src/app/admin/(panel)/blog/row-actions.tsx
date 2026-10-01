"use client";

import Link from "@/components/site/intent-link";
import { useState, useTransition } from "react";
import { ExternalLink, Eye, EyeOff, Loader2, Pencil, Trash2 } from "lucide-react";
import { deletePostAction, setPostPublishedAction, type ActionResult } from "./actions";

const btn =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-uk-line text-uk-muted transition-colors hover:bg-uk-surface-2 hover:text-uk-heading disabled:opacity-40";

export function RowActions({
  slug,
  title,
  published,
}: {
  slug: string;
  title: string;
  published: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();

  const run = (fn: () => Promise<ActionResult>) =>
    start(async () => {
      const r = await fn();
      setError(r.ok ? undefined : r.message);
    });

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5">
        {pending && <Loader2 className="h-4 w-4 animate-spin text-uk-muted" aria-label="Working" />}
        {published && (
          <Link href={`/blog/${slug}`} target="_blank" className={btn} aria-label={`View ${title} on the site`} title="View on site">
            <ExternalLink className="h-4 w-4" />
          </Link>
        )}
        <button
          type="button"
          className={btn}
          disabled={pending}
          aria-label={published ? `Unpublish ${title}` : `Publish ${title}`}
          title={published ? "Unpublish (make draft)" : "Publish"}
          onClick={() => run(() => setPostPublishedAction(slug, !published))}
        >
          {published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        <Link href={`/admin/blog/${slug}`} className={btn} aria-label={`Edit ${title}`}>
          <Pencil className="h-4 w-4" />
        </Link>
        <button
          type="button"
          className={`${btn} hover:!text-destructive`}
          disabled={pending}
          aria-label={`Delete ${title}`}
          onClick={() => {
            if (window.confirm(`Delete “${title}”? This removes it from the live site and can't be undone.`)) {
              run(() => deletePostAction(slug));
            }
          }}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {error && <p role="alert" className="max-w-56 text-right text-xs text-destructive">{error}</p>}
    </div>
  );
}
