"use client";

import { createContext, useContext, useRef, useState, useTransition, type ReactNode } from "react";
import { GripVertical, Loader2 } from "lucide-react";
import { toast } from "@/components/admin/toast";

// Start scrolling the page when the pointer is this close to the viewport edge.
const EDGE = 90;
const MAX_SPEED = 22;

type Result = { ok: boolean; message?: string };

const ReorderContext = createContext<{ all: string[]; start: number } | null>(null);

/**
 * Wrap a paginated sortable list in this: `all` is every row's slug in the full
 * order and `start` the index of this page's first row. A drag reorders the rows
 * of the page, and the full order saved is the whole list with that page's slots
 * rewritten, so the other pages keep their places.
 */
export function ReorderScope({ all, start, children }: { all: string[]; start: number; children: ReactNode }) {
  return <ReorderContext.Provider value={{ all, start }}>{children}</ReorderContext.Provider>;
}

/**
 * Turns the reordered slugs of the visible page into the full order to save:
 * the whole list with this page's slots rewritten (unchanged without a scope).
 */
export function useFullOrder() {
  const scope = useContext(ReorderContext);
  return (slugs: string[]) =>
    scope ? [...scope.all.slice(0, scope.start), ...slugs, ...scope.all.slice(scope.start + slugs.length)] : slugs;
}

/**
 * A list of rows you can drag anywhere (to the very top or bottom too). The new
 * order shows instantly and is saved on drop through `onReorder`; if the save
 * fails the list snaps back and shows the message. While dragging near the top
 * or bottom of the screen the page scrolls by itself. The whole row is the
 * drag handle. `locked` turns dragging off (e.g. while a filter is active,
 * because reordering needs the full list).
 */
export function SortableRows<T extends { slug: string }>({
  initial,
  locked,
  onReorder,
  renderRow,
  hint = "Drag any row and drop it anywhere — first, last or in between. The order saves automatically.",
}: {
  initial: T[];
  locked: boolean;
  onReorder: (slugs: string[]) => Promise<Result>;
  renderRow: (item: T, index: number) => ReactNode;
  hint?: string;
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
      const r = await onReorder(fullOrder(next.map((s) => s.slug)));
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
          {pending ? "Saving order…" : hint}
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
        {items.map((item, i) => (
          <li
            key={item.slug}
            draggable={!locked}
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", item.slug);
              dragRef.current = item.slug;
              setDragging(item.slug);
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
              dragging === item.slug ? "opacity-40" : "",
            ].join(" ")}
          >
            {dropAt === i && dragging !== null && (
              <span className="pointer-events-none absolute inset-x-0 -top-px h-0.5 bg-uk-blue" aria-hidden />
            )}
            {dropAt === items.length && i === items.length - 1 && dragging !== null && (
              <span className="pointer-events-none absolute inset-x-0 -bottom-px h-0.5 bg-uk-blue" aria-hidden />
            )}
            {!locked && (
              <span
                role="presentation"
                title="Drag to reorder"
                className="flex h-8 w-6 shrink-0 cursor-grab items-center justify-center rounded text-uk-muted hover:text-uk-heading active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4" />
              </span>
            )}
            {renderRow(item, i)}
          </li>
        ))}
      </ul>
    </div>
  );
}
