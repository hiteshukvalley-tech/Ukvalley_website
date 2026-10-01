"use client";

import Link from "@/components/site/intent-link";
import { useState, useTransition } from "react";
import { ExternalLink, Eye, EyeOff, Loader2, Pencil, Trash2 } from "lucide-react";
import { SortableRows } from "@/components/admin/sortable-rows";
import {
  deleteTeamAction, reorderTeamAction, setTeamPublishedAction, type ActionResult,
} from "./actions";

export type TeamItem = {
  slug: string;
  title: string;
  role: string;
  focus: string;
  published: boolean;
};

const btn =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-uk-line text-uk-muted transition-colors hover:bg-uk-surface-2 hover:text-uk-heading disabled:opacity-40";

function RowActions({ slug, name, published }: { slug: string; name: string; published: boolean }) {
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
          <Link draggable={false} href="/team" target="_blank" className={btn} aria-label="View the team page" title="View team page">
            <ExternalLink className="h-4 w-4" />
          </Link>
        )}
        <button
          type="button"
          className={btn}
          disabled={pending}
          aria-label={published ? `Unpublish ${name}` : `Publish ${name}`}
          title={published ? "Unpublish (make draft)" : "Publish"}
          onClick={() => run(() => setTeamPublishedAction(slug, !published))}
        >
          {published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        <Link draggable={false} href={`/admin/team/${slug}`} className={btn} aria-label={`Edit ${name}`}>
          <Pencil className="h-4 w-4" />
        </Link>
        <button
          type="button"
          className={`${btn} hover:!text-destructive`}
          disabled={pending}
          aria-label={`Delete ${name}`}
          onClick={() => {
            if (window.confirm(`Delete “${name}”? This removes it from the live site and can't be undone.`)) {
              run(() => deleteTeamAction(slug));
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

/** Team-member rows with drag-and-drop ordering. */
export function TeamList({ initial, locked }: { initial: TeamItem[]; locked: boolean }) {
  return (
    <SortableRows
      initial={initial}
      locked={locked}
      onReorder={reorderTeamAction}
      hint="Drag any row and drop it anywhere — first, last or in between. The order saves automatically."
      renderRow={(p) => (
        <>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                draggable={false}
                href={`/admin/team/${p.slug}`}
                className="truncate text-sm font-semibold text-uk-heading hover:text-uk-blue"
              >
                {p.title}
              </Link>
              <span
                className={
                  p.published
                    ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-[0.7rem] font-semibold text-emerald-700 dark:text-emerald-300"
                    : "rounded-full bg-uk-surface-3 px-2 py-0.5 text-[0.7rem] font-semibold text-uk-muted"
                }
              >
                {p.published ? "Published" : "Draft"}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-uk-muted">
              {p.role} · {p.focus}
            </p>
          </div>
          <RowActions slug={p.slug} name={p.title} published={p.published} />
        </>
      )}
    />
  );
}
