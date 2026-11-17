"use client";

import Link from "@/components/site/intent-link";
import { useState, useTransition } from "react";
import { ExternalLink, Eye, EyeOff, Link2, Loader2, Pencil, Trash2 } from "lucide-react";
import { SITE_URL } from "@/lib/site-origin";
import { SortableRows } from "@/components/admin/sortable-rows";
import {
  deleteCareerAction, reorderCareersAction, setCareerPublishedAction, type ActionResult,
} from "./actions";
import { toast } from "@/components/admin/toast";
import { confirmDialog } from "@/components/admin/confirm-dialog";

export type CareerItem = {
  slug: string;
  title: string;
  type: string;
  location: string;
  mode: string;
  experience: string;
  posted: string;
  published: boolean;
};

const btn =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-uk-line text-uk-muted transition-colors hover:bg-uk-surface-2 hover:text-uk-heading disabled:opacity-40";

function RowActions({ slug, name, published }: { slug: string; name: string; published: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();

  const run = (fn: () => Promise<ActionResult>, success: string) =>
    start(async () => {
      const r = await fn();
      setError(r.ok ? undefined : r.message);
      toast.result(r, success);
    });

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5">
        {pending && <Loader2 className="h-4 w-4 animate-spin text-uk-muted" aria-label="Working" />}
        {published && (
          <>
            {/* The link to share: opens this role's application form while the
                role is published, and the Careers page ("closed") once it isn't. */}
            <button
              type="button"
              className={btn}
              aria-label={`Copy the apply link for ${name}`}
              title="Copy apply link to share"
              onClick={async () => {
                const url = `${SITE_URL}/careers/${slug}?apply=1`;
                try {
                  await navigator.clipboard.writeText(url);
                  toast.success("Apply link copied. It works while the role is published.");
                } catch {
                  toast.error(`Couldn't copy. The link is ${url}`);
                }
              }}
            >
              <Link2 className="h-4 w-4" />
            </button>
            <Link draggable={false} href={`/careers/${slug}`} target="_blank" className={btn} aria-label={`View ${name} on the website`} title="View job page">
              <ExternalLink className="h-4 w-4" />
            </Link>
          </>
        )}
        <button
          type="button"
          className={btn}
          disabled={pending}
          aria-label={published ? `Unpublish ${name}` : `Publish ${name}`}
          title={published ? "Unpublish (make draft)" : "Publish"}
          onClick={() => run(() => setCareerPublishedAction(slug, !published), published ? `“${name}” moved to drafts.` : `“${name}” published.`)}
        >
          {published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        <Link draggable={false} href={`/admin/careers/${slug}`} className={btn} aria-label={`Edit ${name}`}>
          <Pencil className="h-4 w-4" />
        </Link>
        <button
          type="button"
          className={`${btn} hover:!text-destructive`}
          disabled={pending}
          aria-label={`Delete ${name}`}
          onClick={async () => {
            if (await confirmDialog(`Delete “${name}”? It comes off the live site and moves to Recycle openings, where you can restore it.`)) {
              run(() => deleteCareerAction(slug), `“${name}” moved to Recycle openings.`);
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

/** Open-role rows with drag-and-drop ordering. */
export function CareerList({ initial, locked }: { initial: CareerItem[]; locked: boolean }) {
  return (
    <SortableRows
      initial={initial}
      locked={locked}
      onReorder={reorderCareersAction}
      hint="Drag any row and drop it anywhere — first, last or in between. The order saves automatically."
      renderRow={(p) => (
        <>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                draggable={false}
                href={`/admin/careers/${p.slug}`}
                className="block max-w-full truncate text-sm font-semibold text-uk-heading hover:text-uk-blue"
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
              {p.type} · {p.mode} · {p.location} · {p.experience} · Posted {p.posted}
            </p>
          </div>
          <RowActions slug={p.slug} name={p.title} published={p.published} />
        </>
      )}
    />
  );
}
