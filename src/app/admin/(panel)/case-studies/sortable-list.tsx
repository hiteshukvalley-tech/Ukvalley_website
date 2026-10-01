"use client";

import Link from "@/components/site/intent-link";
import { useState, useTransition } from "react";
import { ExternalLink, Eye, EyeOff, Loader2, Pencil, Trash2 } from "lucide-react";
import { SortableRows } from "@/components/admin/sortable-rows";
import {
  deleteCaseAction, reorderCasesAction, setCasePublishedAction, type ActionResult,
} from "./actions";

export type CaseItem = {
  slug: string;
  title: string;
  client: string;
  sector: string;
  published: boolean;
};

const btn =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-uk-line text-uk-muted transition-colors hover:bg-uk-surface-2 hover:text-uk-heading disabled:opacity-40";

function RowActions({ slug, title, published }: { slug: string; title: string; published: boolean }) {
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
          <Link draggable={false} href={`/case-studies/${slug}`} target="_blank" className={btn} aria-label={`View ${title} on the site`} title="View on site">
            <ExternalLink className="h-4 w-4" />
          </Link>
        )}
        <button
          type="button"
          className={btn}
          disabled={pending}
          aria-label={published ? `Unpublish ${title}` : `Publish ${title}`}
          title={published ? "Unpublish (make draft)" : "Publish"}
          onClick={() => run(() => setCasePublishedAction(slug, !published))}
        >
          {published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        <Link draggable={false} href={`/admin/case-studies/${slug}`} className={btn} aria-label={`Edit ${title}`}>
          <Pencil className="h-4 w-4" />
        </Link>
        <button
          type="button"
          className={`${btn} hover:!text-destructive`}
          disabled={pending}
          aria-label={`Delete ${title}`}
          onClick={() => {
            if (window.confirm(`Delete “${title}”? This removes it from the live site and can't be undone.`)) {
              run(() => deleteCaseAction(slug));
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

/** Case-study rows with drag-and-drop ordering. The first four appear on the home page. */
export function CaseList({ initial, locked }: { initial: CaseItem[]; locked: boolean }) {
  return (
    <SortableRows
      initial={initial}
      locked={locked}
      onReorder={reorderCasesAction}
      hint="Drag any row and drop it anywhere — first, last or in between. The order saves automatically; the first four show on the home page."
      renderRow={(c, i) => (
        <>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                draggable={false}
                href={`/admin/case-studies/${c.slug}`}
                className="truncate text-sm font-semibold text-uk-heading hover:text-uk-blue"
              >
                {c.title}
              </Link>
              {!locked && i < 4 && (
                <span className="rounded-full bg-uk-blue/12 px-2 py-0.5 text-[0.7rem] font-semibold text-uk-blue">
                  On home page
                </span>
              )}
              <span
                className={
                  c.published
                    ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-[0.7rem] font-semibold text-emerald-700 dark:text-emerald-300"
                    : "rounded-full bg-uk-surface-3 px-2 py-0.5 text-[0.7rem] font-semibold text-uk-muted"
                }
              >
                {c.published ? "Published" : "Draft"}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-uk-muted">
              {c.sector} · {c.client} · /case-studies/{c.slug}
            </p>
          </div>
          <RowActions slug={c.slug} title={c.title} published={c.published} />
        </>
      )}
    />
  );
}
