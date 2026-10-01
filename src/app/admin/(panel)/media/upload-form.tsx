"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, CircleCheck, Loader2, UploadCloud } from "lucide-react";
import type { UploadResult } from "@/lib/media-store";

export function UploadForm({ maxMb, maxFiles }: { maxMb: number; maxFiles: number }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string>();
  const [results, setResults] = useState<UploadResult[]>([]);

  async function upload(list: FileList | File[]) {
    const picked = Array.from(list);
    if (picked.length === 0) return;
    setError(undefined);
    setResults([]);

    if (picked.length > maxFiles) {
      setError(`Choose ${maxFiles} files or fewer at a time.`);
      return;
    }

    // One file per request: hosting platforms cap a request body (Vercel at
    // 4.5 MB), so sending several 4 MB images together would be rejected.
    setBusy(true);
    const all: UploadResult[] = [];
    try {
      for (const f of picked) {
        const body = new FormData();
        body.append("files", f);
        const res = await fetch("/admin/media/upload", { method: "POST", body });
        const data = (await res.json().catch(() => ({}))) as { results?: UploadResult[]; error?: string };
        if (!res.ok || !data.results) {
          all.push({ name: f.name, ok: false, error: data.error ?? `Upload failed (${res.status}).` });
        } else {
          all.push(...data.results);
        }
        setResults([...all]);
      }
      if (all.some((r) => r.ok)) router.refresh();
    } catch {
      setError("Upload failed — check your connection and try again.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!busy) void upload(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? "border-uk-blue bg-uk-blue/10" : "border-uk-line bg-uk-card"
        }`}
      >
        {busy ? <Loader2 className="h-7 w-7 animate-spin text-uk-blue" /> : <UploadCloud className="h-7 w-7 text-uk-blue" />}
        <div>
          <p className="text-sm font-semibold text-uk-heading">{busy ? "Uploading…" : "Drag images here, or choose files"}</p>
          <p className="mt-1 text-xs text-uk-muted">
            PNG, JPG, GIF, WebP or AVIF · up to {maxMb} MB each · {maxFiles} files at a time
          </p>
        </div>
        <input
          ref={input}
          id="media-files"
          type="file"
          multiple
          accept="image/png,image/jpeg,image/gif,image/webp,image/avif"
          disabled={busy}
          className="sr-only"
          onChange={(e) => e.target.files && void upload(e.target.files)}
        />
        <label
          htmlFor="media-files"
          className={`btn-sheen inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-uk-blue px-5 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright ${busy ? "pointer-events-none opacity-60" : ""}`}
        >
          Choose images
        </label>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {results.length > 0 && (
        <ul role="status" className="space-y-1.5 rounded-xl border border-uk-line bg-uk-card p-4 text-sm">
          {results.map((r, i) => (
            <li key={`${r.name}-${i}`} className="flex items-start gap-2">
              {r.ok ? (
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              )}
              <span className="min-w-0 break-words text-uk-body">
                <span className="font-medium text-uk-heading">{r.name}</span>
                {r.ok ? " uploaded." : ` — ${r.error}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
