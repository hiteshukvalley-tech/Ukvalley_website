"use client";

import Link from "@/components/site/intent-link";
import { useRef, useState, useTransition } from "react";
import { GripVertical, Loader2 } from "lucide-react";
import { reorderServicesAction } from "./actions";
import { RowActions } from "./row-actions";
import { toast } from "@/components/admin/toast";
import { useFullOrder } from "@/components/admin/sortable-rows";

export type SortableItem = {
  slug: string;
  title: string;
  href: string;
  bullets: number;
  published: boolean;
};

// Start scrolling the page when the pointer is this close to the viewport edge.
const EDGE = 90;
const MAX_SPEED = 22;

/**
 * Service rows you can drag anywhere in the list (to the very top or bottom
 * too). The new order shows instantly and is saved on drop. While dragging near
 * the top/bottom of the screen the page scrolls by itself. The whole row is the
 * drag handle.
 */
export function SortableList({
  initial,
  locked,
}: {
  initial: SortableItem[];
  /** True while a search/filter is active: reordering needs the full list. */
  locked: boolean;
}) {
  const fullOrder = useFullOrder();
  const [items, setItems] = useState(initial);
  const [dragging, setDragging] = useState<string | null>(null);
  // Index the dragged row would land at (0..n), shown as a line between rows.
  const [dropAt, setDropAt] = useState<number | null>(null);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  // Refs mirror the drag state so back-to-back drag events never see a stale render.
  const dragRef = useRef<string | null>(null);
  const dropRef = useRef<number | null>(null);
  const speed = useRef(0);
  const raf = useRef<number | null>(null);

  const stopScroll = () => {
    speed.current = 0;
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
  };

  const tick = () => {
    if (speed.current === 0) {
      raf.current = null;
      return;
    }
    window.scrollBy(0, speed.current);
    raf.current = requestAnimationFrame(tick);
  };

  const autoScroll = (clientY: number) => {
    const h = window.innerHeight;
    if (clientY < EDGE) speed.current = -Math.ceil(((EDGE - clientY) / EDGE) * MAX_SPEED);
    else if (clientY > h - EDGE) speed.current = Math.ceil(((clientY - (h - EDGE)) / EDGE) * MAX_SPEED);
    else speed.current = 0;
    if (speed.current !== 0 && raf.current === null) raf.current = requestAnimationFrame(tick);
  };

  const reset = () => {
    stopScroll();
    dragRef.current = null;
    dropRef.current = null;
    setDragging(null);
    setDropAt(null);
  };

  const markDrop = (index: number) => {
    dropRef.current = index;
    setDropAt(index);
  };

  const drop = () => {
    const slug = dragRef.current;
    const at = dropRef.current;
    if (slug === null || at === null) return reset();
    const from = items.findIndex((s) => s.slug === slug);
    // Removing the dragged row shifts every later index down by one.
    const to = at > from ? at - 1 : at;
    reset();
    if (from < 0 || to === from) return;

    const previous = items;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setItems(next);
    setError(undefined);
    start(async () => {
      // the full order (other pages of the list keep their places)
      const r = await reorderServicesAction(fullOrder(next.map((s) => s.slug)));
      if (!r.ok) {
        setItems(previous);
        setError(r.message);
      }
      toast.result(r, "Order saved.");
    });
  };

  const onDragOverRow = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    if (dragRef.current === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = e.currentTarget.getBoundingClientRect();
    markDrop(e.clientY < rect.top + rect.height / 2 ? index : index + 1);
    autoScroll(e.clientY);
  };

  return (
    <div>
      {error && (
        <p role="alert" className="border-b border-uk-line px-4 py-2 text-sm text-destructive">{error}</p>
      )}
      {!locked && (
        <p className="flex items-center gap-2 border-b border-uk-line px-4 py-2 text-xs text-uk-muted">
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GripVertical className="h-3.5 w-3.5" />}
          {pending ? "Saving order…" : "Drag any row and drop it anywhere — first, last or in between. The order saves automatically."}
        </p>
      )}
      <ul
        className="divide-y divide-uk-line"
        onDragOver={(e) => {
          // Dropping in the gap below the last row still counts as "last".
          if (dragRef.current !== null && e.target === e.currentTarget) {
            e.preventDefault();
            markDrop(items.length);
            autoScroll(e.clientY);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          drop();
        }}
      >
        {items.map((s, i) => (
          <li
            key={s.slug}
            draggable={!locked}
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", s.slug);
              dragRef.current = s.slug;
              setDragging(s.slug);
            }}
            onDragOver={(e) => onDragOverRow(e, i)}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              drop();
            }}
            onDragEnd={reset}
            className={[
              "relative flex flex-wrap items-center justify-between gap-4 px-4 py-4 transition-opacity",
              dragging === s.slug ? "opacity-40" : "",
            ].join(" ")}
          >
            {dropAt === i && dragging !== null && (
              <span className="pointer-events-none absolute inset-x-0 -top-px h-0.5 bg-uk-blue" aria-hidden />
            )}
            {dropAt === items.length && i === items.length - 1 && dragging !== null && (
              <span className="pointer-events-none absolute inset-x-0 -bottom-px h-0.5 bg-uk-blue" aria-hidden />
            )}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {!locked && (
                <span
                  role="presentation"
                  title="Drag to reorder"
                  className="flex h-8 w-6 shrink-0 cursor-grab items-center justify-center rounded text-uk-muted hover:text-uk-heading active:cursor-grabbing"
                >
                  <GripVertical className="h-4 w-4" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link draggable={false} href={`/admin/services/${s.slug}`} className="truncate text-sm font-semibold text-uk-heading hover:text-uk-blue">
                    {s.title}
                  </Link>
                  <span
                    className={
                      s.published
                        ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-[0.7rem] font-semibold text-emerald-700 dark:text-emerald-300"
                        : "rounded-full bg-uk-surface-3 px-2 py-0.5 text-[0.7rem] font-semibold text-uk-muted"
                    }
                  >
                    {s.published ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-uk-muted">
                  {s.href} · {s.bullets} bullets
                </p>
              </div>
            </div>
            <RowActions
              slug={s.slug}
              title={s.title}
              published={s.published}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
