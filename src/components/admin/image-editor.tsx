"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import {
  Check, FlipHorizontal2, ImageIcon, Loader2, RotateCcw, RotateCw, Undo2, Upload, X, ZoomIn, ZoomOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Crop, zoom, rotate and resize a picture in the browser before it is saved to
// the media library. The result is a new image file, so the website shows
// exactly the framing chosen here — no display settings to keep in sync.

/** Same limit as the upload route (lib/media-store MAX_FILE_BYTES; not imported: that module is server-only). */
const MAX_BYTES = 4 * 1024 * 1024;
/** Very large photos are scaled down to this long side while editing (and never saved bigger). */
const MAX_SIDE = 4096;
const MAX_ZOOM = 5;
const WIDTHS = [2400, 1920, 1600, 1200, 1000, 800, 600, 400];
const DEFAULT_WIDTH = 1920;

type Shape = { key: string; label: string; ratio: number | null };

const SHAPES: Shape[] = [
  { key: "original", label: "Original", ratio: null },
  { key: "1/1", label: "Square 1:1", ratio: 1 },
  { key: "4/5", label: "Portrait 4:5", ratio: 4 / 5 },
  { key: "3/4", label: "Portrait 3:4", ratio: 3 / 4 },
  { key: "4/3", label: "Landscape 4:3", ratio: 4 / 3 },
  { key: "3/2", label: "Landscape 3:2", ratio: 3 / 2 },
  { key: "16/10", label: "Wide 16:10", ratio: 16 / 10 },
  { key: "16/9", label: "Wide 16:9", ratio: 16 / 9 },
];

/** "16/10" → 1.6. Anything unparsable → undefined. */
export function parseAspect(aspect?: string): number | undefined {
  const m = aspect?.match(/^\s*(\d+(?:\.\d+)?)\s*[/:]\s*(\d+(?:\.\d+)?)\s*$/);
  if (!m) return undefined;
  const r = Number(m[1]) / Number(m[2]);
  return Number.isFinite(r) && r > 0 ? r : undefined;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const formatBytes = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

function baseName(source: File | string) {
  const raw = typeof source === "string" ? "" : source.name;
  return raw.replace(/\.[^.]+$/, "").replace(/[^\w\- ]+/g, "").trim().slice(0, 80) || "image";
}

export type ImageEditorProps = {
  /** A file the admin just picked, or the address of an image already in use. */
  source: File | string;
  /** Shape of the frame this image fills on the website, e.g. "16/10". Preselected when given. */
  aspect?: string;
  onClose: () => void;
  /** Receives the edited file; resolve with an error message to keep the editor open. */
  onSave: (file: File) => Promise<string | null>;
  /** New uploads only: save the picked file without changes. */
  onUseOriginal?: () => Promise<string | null>;
};

export function ImageEditor({ source, aspect, onClose, onSave, onUseOriginal }: ImageEditorProps) {
  const siteRatio = parseAspect(aspect);
  const shapes = useMemo<Shape[]>(
    () => (siteRatio ? [{ key: "site", label: `Website frame (${aspect!.replace("/", ":")})`, ratio: siteRatio }, ...SHAPES] : SHAPES),
    [siteRatio, aspect]
  );
  const defaultShape = shapes[0].key;

  /* ── Load the picture ──────────────────────────────────────────── */
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    const isFile = typeof source !== "string";
    const url = isFile ? URL.createObjectURL(source) : source;
    // Ignore a load that was superseded (the URL below is revoked on cleanup,
    // which makes a still-loading image fail).
    let current = true;
    const el = new Image();
    // Another site's picture can only be edited if it allows it (CORS).
    if (!isFile && /^https?:\/\//i.test(url) && new URL(url).origin !== window.location.origin) el.crossOrigin = "anonymous";
    el.decoding = "async";
    el.onload = () => {
      if (!current) return;
      if (el.naturalWidth > 0) setImg(el);
      else setLoadError("This picture has no size and can't be edited.");
    };
    el.onerror = () => {
      if (!current) return;
      setLoadError(
        isFile
          ? "This file couldn't be opened as a picture."
          : "This picture can't be edited here — it is hosted on another website. Download it, then upload the file instead."
      );
    };
    el.src = url;
    return () => {
      current = false;
      if (isFile) URL.revokeObjectURL(url);
    };
  }, [source]);

  /* ── Edit state ────────────────────────────────────────────────── */
  const [shapeKey, setShapeKey] = useState(defaultShape);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0 | 90 | 180 | 270
  const [flip, setFlip] = useState(false);
  /** Centre of the crop, as a fraction of the (rotated) picture. */
  const [pos, setPos] = useState({ fx: 0.5, fy: 0.5 });
  const [targetW, setTargetW] = useState<number | null>(null); // null = automatic
  const [saving, setSaving] = useState<"" | "edited" | "original">("");
  const [error, setError] = useState("");

  // The picture, rotated/flipped and capped at MAX_SIDE, as a canvas all drawing starts from.
  const base = useMemo(() => {
    if (!img) return null;
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const turned = rotation % 180 !== 0;
    const c = document.createElement("canvas");
    c.width = turned ? h : w;
    c.height = turned ? w : h;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.imageSmoothingQuality = "high";
    ctx.translate(c.width / 2, c.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    return c;
  }, [img, rotation, flip]);

  const bw = base?.width ?? 1;
  const bh = base?.height ?? 1;
  const shape = shapes.find((s) => s.key === shapeKey) ?? shapes[0];
  const ratio = shape.ratio ?? bw / bh;
  // Largest frame of this shape that fits the picture, then shrunk by the zoom.
  const fitW = bw / bh > ratio ? bh * ratio : bw;
  const cropW = fitW / zoom;
  const cropH = cropW / ratio;
  const cx = clamp(pos.fx * bw, cropW / 2, bw - cropW / 2);
  const cy = clamp(pos.fy * bh, cropH / 2, bh - cropH / 2);
  const rect = { x: cx - cropW / 2, y: cy - cropH / 2, w: cropW, h: cropH };

  const fullW = Math.max(1, Math.round(rect.w));
  const outW = Math.min(targetW ?? DEFAULT_WIDTH, fullW);
  const outH = Math.max(1, Math.round(outW / ratio));
  const widthOptions = [fullW, ...WIDTHS.filter((w) => w < fullW)];

  const moveTo = useCallback(
    (x: number, y: number) => {
      setPos({
        fx: clamp(x, cropW / 2, bw - cropW / 2) / bw,
        fy: clamp(y, cropH / 2, bh - cropH / 2) / bh,
      });
    },
    [bw, bh, cropW, cropH]
  );

  /* ── Stage: the whole picture, scaled to fit, with the crop frame on top ── */
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLCanvasElement>(null);
  const [box, setBox] = useState({ w: 640, h: 420 });
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () =>
      setBox({ w: Math.max(200, el.clientWidth), h: Math.max(200, Math.min(window.innerHeight * 0.52, 560)) });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const s = Math.min(box.w / bw, box.h / bh);
  const dispW = Math.round(bw * s);
  const dispH = Math.round(bh * s);

  useEffect(() => {
    const c = stageRef.current;
    if (!c || !base) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.max(1, Math.round(dispW * dpr));
    c.height = Math.max(1, Math.round(dispH * dpr));
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(base, 0, 0, c.width, c.height);
  }, [base, dispW, dispH]);

  // Drag the frame (or click anywhere on the picture to centre it there).
  const drag = useRef<{ px: number; py: number; cx: number; cy: number } | null>(null);
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!base || e.button !== 0) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / s;
    const y = (e.clientY - r.top) / s;
    let startX = cx;
    let startY = cy;
    if (x < rect.x || x > rect.x + rect.w || y < rect.y || y > rect.y + rect.h) {
      startX = clamp(x, cropW / 2, bw - cropW / 2);
      startY = clamp(y, cropH / 2, bh - cropH / 2);
      moveTo(startX, startY);
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, cx: startX, cy: startY };
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (d) moveTo(d.cx + (e.clientX - d.px) / s, d.cy + (e.clientY - d.py) / s);
  }
  const endDrag = () => (drag.current = null);

  // Mouse wheel / trackpad zoom (native listener: React's wheel handler can't preventDefault).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!base) return;
      e.preventDefault();
      setZoom((z) => clamp(z * (e.deltaY < 0 ? 1.08 : 1 / 1.08), 1, MAX_ZOOM));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [base]);

  function onFrameKey(e: React.KeyboardEvent) {
    const step = (e.shiftKey ? 0.1 : 0.02) * Math.max(bw, bh);
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
    };
    if (moves[e.key]) {
      e.preventDefault();
      moveTo(cx + moves[e.key][0], cy + moves[e.key][1]);
    } else if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      setZoom((z) => clamp(z + 0.25, 1, MAX_ZOOM));
    } else if (e.key === "-") {
      e.preventDefault();
      setZoom((z) => clamp(z - 0.25, 1, MAX_ZOOM));
    }
  }

  /* ── Preview: the crop as it appears in the website's frame ─────── */
  const previewRatio = siteRatio ?? ratio;
  const previewRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = previewRef.current;
    if (!c || !base) return;
    const dpr = window.devicePixelRatio || 1;
    const W = Math.round(240 * dpr);
    const H = Math.round(W / previewRatio);
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingQuality = "high";
    // object-fit: cover, centred — how the website fills its frame.
    let { x, y, w, h } = rect;
    if (w / h > previewRatio) {
      const nw = h * previewRatio;
      x += (w - nw) / 2;
      w = nw;
    } else {
      const nh = w / previewRatio;
      y += (h - nh) / 2;
      h = nh;
    }
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(base, x, y, w, h, 0, 0, W, H);
  }, [base, rect.x, rect.y, rect.w, rect.h, previewRatio]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Actions ───────────────────────────────────────────────────── */
  function reset() {
    setShapeKey(defaultShape);
    setZoom(1);
    setRotation(0);
    setFlip(false);
    setPos({ fx: 0.5, fy: 0.5 });
    setTargetW(null);
    setError("");
  }

  async function save() {
    if (!base) return;
    setSaving("edited");
    setError("");
    try {
      const c = document.createElement("canvas");
      c.width = outW;
      c.height = outH;
      const ctx = c.getContext("2d");
      if (!ctx) throw new Error("canvas");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(base, rect.x, rect.y, rect.w, rect.h, 0, 0, outW, outH);

      // WebP keeps transparency and is small. Browsers that can't write WebP
      // return PNG instead; if that is over the limit, fall back to JPEG.
      let blob = await toBlob(c, "image/webp", 0.9);
      if (!blob || (blob.type !== "image/webp" && blob.size > MAX_BYTES)) {
        const flat = document.createElement("canvas");
        flat.width = outW;
        flat.height = outH;
        const fctx = flat.getContext("2d")!;
        fctx.fillStyle = "#ffffff"; // JPEG has no transparency
        fctx.fillRect(0, 0, outW, outH);
        fctx.drawImage(c, 0, 0);
        blob = await toBlob(flat, "image/jpeg", 0.88);
      }
      if (!blob) throw new Error("encode");
      if (blob.size > MAX_BYTES) {
        setError(`The result is ${formatBytes(blob.size)}; the limit is 4 MB. Choose a smaller size.`);
        return;
      }
      const ext = blob.type === "image/webp" ? "webp" : blob.type === "image/png" ? "png" : "jpg";
      const problem = await onSave(new File([blob], `${baseName(source)}.${ext}`, { type: blob.type }));
      if (problem) setError(problem);
      else onClose();
    } catch (e) {
      setError(
        e instanceof DOMException && e.name === "SecurityError"
          ? "This picture is hosted on another website, so it can't be edited here. Download it, then upload the file instead."
          : "Could not create the image. Try a smaller size."
      );
    } finally {
      setSaving("");
    }
  }

  async function saveOriginal() {
    if (!onUseOriginal) return;
    setSaving("original");
    setError("");
    const problem = await onUseOriginal();
    setSaving("");
    if (problem) setError(problem);
    else onClose();
  }

  const file = typeof source === "string" ? null : source;
  const originalTooBig = Boolean(file && file.size > MAX_BYTES);
  const isGif = file?.type === "image/gif";
  const busy = saving !== "";

  const btn =
    "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-uk-line px-3 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading disabled:pointer-events-none disabled:opacity-50";
  const iconBtn =
    "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-uk-line text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading disabled:pointer-events-none disabled:opacity-40";

  return (
    <Dialog.Root open onOpenChange={(open) => !open && !busy && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[90] bg-black/55 backdrop-blur-sm" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-[91] flex max-h-[96dvh] w-[min(68rem,calc(100vw-1rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-uk-line bg-uk-surface text-uk-body shadow-2xl outline-none">
          <div className="flex items-start justify-between gap-4 border-b border-uk-line px-5 py-4">
            <div>
              <Dialog.Title className="font-heading text-lg font-bold text-uk-heading">Adjust image</Dialog.Title>
              <Dialog.Description className="text-sm text-uk-muted">
                Drag the frame to choose what shows, zoom to crop closer, and pick a size. The website shows exactly this.
              </Dialog.Description>
            </div>
            <Dialog.Close className={iconBtn} aria-label="Close without saving" disabled={busy}>
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 overflow-y-auto overflow-x-hidden p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_17rem]">
            {/* Stage (min-w-0: the column must not grow to fit the canvas it measures) */}
            <div ref={wrapRef} className="flex min-h-[220px] min-w-0 items-center justify-center">
              {loadError ? (
                <p role="alert" className="max-w-sm text-center text-sm font-medium text-destructive">{loadError}</p>
              ) : !base ? (
                <Loader2 className="h-6 w-6 animate-spin text-uk-muted" aria-label="Loading picture" />
              ) : (
                <div
                  className="relative touch-none select-none overflow-hidden rounded-lg bg-[repeating-conic-gradient(#e5e7eb_0_25%,#ffffff_0_50%)] bg-[length:16px_16px]"
                  style={{ width: dispW, height: dispH }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                >
                  <canvas ref={stageRef} className="block h-full w-full" aria-hidden />
                  <div
                    role="group"
                    tabIndex={0}
                    aria-label="Crop frame. Arrow keys move it, plus and minus zoom."
                    onKeyDown={onFrameKey}
                    className="absolute cursor-move border-2 border-white outline-none ring-uk-blue focus-visible:ring-2"
                    style={{
                      left: rect.x * s,
                      top: rect.y * s,
                      width: rect.w * s,
                      height: rect.h * s,
                      boxShadow: "0 0 0 9999px rgba(7,5,17,0.55)",
                    }}
                  >
                    {/* rule-of-thirds guides */}
                    <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3" aria-hidden>
                      {Array.from({ length: 9 }, (_, i) => (
                        <span key={i} className="border-[0.5px] border-white/35" />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex min-w-0 flex-col gap-5">
              <div className="space-y-2">
                <label htmlFor="img-shape" className="text-sm font-medium text-uk-heading">Shape</label>
                <select
                  id="img-shape"
                  value={shapeKey}
                  disabled={!base}
                  onChange={(e) => {
                    setShapeKey(e.target.value);
                    setZoom(1);
                  }}
                  className="h-9 w-full rounded-lg border border-uk-line bg-uk-surface px-2 text-base text-uk-heading sm:text-sm"
                >
                  {shapes.map((sh) => (
                    <option key={sh.key} value={sh.key}>{sh.label}</option>
                  ))}
                </select>
                {siteRatio && shapeKey !== "site" && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    The website shows this picture in a {aspect!.replace("/", ":")} frame, so the edges may be trimmed. See the preview below.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="img-zoom" className="text-sm font-medium text-uk-heading">Zoom</label>
                  <span className="text-xs tabular-nums text-uk-muted">{Math.round(zoom * 100)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" className={iconBtn} disabled={!base || zoom <= 1} onClick={() => setZoom((z) => clamp(z - 0.25, 1, MAX_ZOOM))} aria-label="Zoom out">
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <input
                    id="img-zoom"
                    type="range"
                    min={1}
                    max={MAX_ZOOM}
                    step={0.01}
                    value={zoom}
                    disabled={!base}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="min-w-0 flex-1 accent-uk-blue"
                  />
                  <button type="button" className={iconBtn} disabled={!base || zoom >= MAX_ZOOM} onClick={() => setZoom((z) => clamp(z + 0.25, 1, MAX_ZOOM))} aria-label="Zoom in">
                    <ZoomIn className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium text-uk-heading">Rotate &amp; flip</span>
                <div className="flex gap-2">
                  <button type="button" className={iconBtn} disabled={!base} onClick={() => setRotation((r) => (r + 270) % 360)} aria-label="Rotate left">
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <button type="button" className={iconBtn} disabled={!base} onClick={() => setRotation((r) => (r + 90) % 360)} aria-label="Rotate right">
                    <RotateCw className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={cn(iconBtn, flip && "border-uk-blue/50 bg-uk-blue/10 text-uk-blue")}
                    disabled={!base}
                    aria-pressed={flip}
                    onClick={() => setFlip((f) => !f)}
                    aria-label="Flip horizontally"
                  >
                    <FlipHorizontal2 className="h-4 w-4" />
                  </button>
                  <button type="button" className={cn(btn, "ml-auto")} disabled={!base} onClick={reset}>
                    <Undo2 className="h-4 w-4" /> Reset
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="img-width" className="text-sm font-medium text-uk-heading">Size</label>
                <select
                  id="img-width"
                  value={String(outW)}
                  disabled={!base}
                  onChange={(e) => setTargetW(Number(e.target.value))}
                  className="h-9 w-full rounded-lg border border-uk-line bg-uk-surface px-2 text-base text-uk-heading sm:text-sm"
                >
                  {widthOptions.map((w, i) => (
                    <option key={w} value={w}>
                      {w} px wide{i === 0 ? " (full detail)" : w === DEFAULT_WIDTH ? " (recommended)" : ""}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-uk-muted">
                  Result: {outW} × {outH} px. 1920 px is plenty for full-width pictures; 800 px for cards and photos.
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium text-uk-heading">
                  {siteRatio ? "Preview on the website" : "Preview"}
                </span>
                <div className="overflow-hidden rounded-lg border border-uk-line bg-[repeating-conic-gradient(#e5e7eb_0_25%,#ffffff_0_50%)] bg-[length:16px_16px]">
                  {base ? (
                    <canvas ref={previewRef} className="block w-full" style={{ aspectRatio: String(previewRatio) }} aria-label="Preview of the result" />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center text-uk-muted"><ImageIcon className="h-5 w-5" /></div>
                  )}
                </div>
                {file && (
                  <p className="text-xs text-uk-muted">
                    Original: {img ? `${img.naturalWidth} × ${img.naturalHeight} px, ` : ""}{formatBytes(file.size)}
                  </p>
                )}
                {isGif && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Saving an edit turns an animated GIF into a still picture. Use “Upload as is” to keep the animation.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-uk-line px-5 py-4 sm:flex-row sm:items-center">
            {error ? (
              <p role="alert" className="text-sm font-medium text-destructive sm:mr-auto">{error}</p>
            ) : (
              <p className="text-xs text-uk-muted sm:mr-auto">Saved as a new file in Admin → Media; the original is not changed.</p>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" className={btn} disabled={busy} onClick={onClose}>Cancel</button>
              {onUseOriginal && (
                <button
                  type="button"
                  className={btn}
                  disabled={busy || originalTooBig}
                  title={originalTooBig ? "Larger than 4 MB — save an adjusted copy instead" : undefined}
                  onClick={() => void saveOriginal()}
                >
                  {saving === "original" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Upload as is
                </button>
              )}
              <button
                type="button"
                className={cn(btn, "border-uk-blue bg-uk-blue text-white hover:bg-uk-blue/90 hover:text-white")}
                disabled={busy || !base}
                onClick={() => void save()}
              >
                {saving === "edited" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {saving === "edited" ? "Saving…" : "Save image"}
              </button>
            </div>
          </div>
          {originalTooBig && onUseOriginal && (
            <p className="-mt-2 px-5 pb-4 text-right text-xs text-uk-muted">
              This file is over 4 MB, so it can only be saved as an adjusted copy.
            </p>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
