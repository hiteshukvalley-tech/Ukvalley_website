import Link from "@/components/site/intent-link";
import { Search, Video } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin-session";
import { listPositions, listRecordings, type RecordingFilter } from "@/lib/ai-interview/store";
import { DbError, StatusBadge, fmt } from "../ui";

export const metadata = { title: "Recordings" };
export const dynamic = "force-dynamic";

const PATH = "/admin/ai-interviews/recordings";
const select = "h-10 rounded-lg border border-input bg-transparent px-3 text-sm text-uk-body outline-none focus-visible:border-ring";

const TABS: { key: RecordingFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "yes", label: "With recording" },
  { key: "none", label: "No recording received" },
  { key: "deleted", label: "Deleted" },
];

type Props = { searchParams: Promise<{ has?: string; position?: string; q?: string }> };

const size = (bytes: number) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

/**
 * Every AI interview recording in one place (GrowthValley's "Recordings"):
 * which interviews have one, which never sent one, and which were deleted.
 * Recordings are encrypted and play only inside the admin.
 */
export default async function RecordingsPage({ searchParams }: Props) {
  await requireAdmin("ai-interviews");
  const sp = await searchParams;
  const has = (TABS.some((t) => t.key === sp.has) ? sp.has : "all") as RecordingFilter;
  const position = (sp.position ?? "").trim();
  const q = (sp.q ?? "").trim();
  const [{ items, counts, dbError }, positions] = await Promise.all([listRecordings({ has, position, q }), listPositions()]);
  const tabHref = (k: RecordingFilter) => `${PATH}?${new URLSearchParams(Object.entries({ has: k === "all" ? "" : k, position, q }).filter(([, v]) => v) as [string, string][])}`;

  return (
    <>
      <PageHeader
        title="Recordings"
        crumbs={[{ label: "AI interviews", href: "/admin/ai-interviews" }, { label: "Recordings" }]}
        description="Video and audio of every AI interview that was started. Recordings are encrypted, play only here in the panel and are deleted after the retention period in Settings."
      />

      <nav aria-label="Recording filter" className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link key={t.key} href={tabHref(t.key)} aria-current={has === t.key ? "page" : undefined} className={`rounded-full border px-3 py-1.5 text-sm ${has === t.key ? "border-uk-blue bg-uk-blue text-uk-white" : "border-uk-line text-uk-body hover:bg-uk-surface-2"}`}>
            {t.label} <span className="opacity-75">({counts[t.key]})</span>
          </Link>
        ))}
      </nav>

      <form method="get" className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-uk-line bg-uk-card p-4">
        {has !== "all" && <input type="hidden" name="has" value={has} />}
        <label className="relative min-w-52 flex-1">
          <span className="sr-only">Search</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-uk-muted" />
          <input type="search" name="q" defaultValue={q} placeholder="Name, email or position" className="h-10 w-full rounded-lg border border-input bg-transparent pl-9 pr-3 text-sm outline-none focus-visible:border-ring" />
        </label>
        <select name="position" defaultValue={position} className={select} aria-label="Job position">
          <option value="">Every job</option>
          {positions.map((p) => <option key={p.position} value={p.position}>{p.position}</option>)}
        </select>
        <button type="submit" className="h-10 rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body hover:bg-uk-surface-2">Show</button>
        {(position || q) && <Link href={tabHref(has)} className="pb-2.5 text-sm text-uk-muted hover:text-uk-heading">Reset</Link>}
      </form>

      <DbError message={dbError && `Could not read recordings (${dbError}).`} />

      {!dbError && items.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-uk-line bg-uk-card p-10 text-center">
          <Video className="mx-auto mb-3 h-8 w-8 text-uk-muted" />
          <h2 className="font-heading text-lg font-semibold text-uk-heading">No recordings {q || position || has !== "all" ? "match these filters" : "yet"}</h2>
          <p className="mx-auto mt-1 max-w-lg text-sm text-uk-muted">A recording appears here once a candidate starts their AI interview.</p>
        </section>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-uk-line bg-uk-card">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="border-b border-uk-line text-left text-xs uppercase tracking-wide text-uk-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Candidate</th>
                <th className="px-4 py-3 font-medium">Position</th>
                <th className="px-4 py-3 font-medium">Started (IST)</th>
                <th className="px-4 py-3 font-medium">Interview</th>
                <th className="px-4 py-3 font-medium">Recording</th>
                <th className="px-4 py-3 text-right font-medium">Play</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-uk-line">
              {items.map((i) => {
                const rec = i.recording;
                const deleted = !!rec.deletedAt;
                const received = rec.chunks > 0 && !deleted;
                const upload = deleted
                  ? `Deleted ${fmt(rec.deletedAt)}`
                  : !received
                    ? "Nothing received"
                    : i.status === "in_progress"
                      ? "Uploading…"
                      : i.status === "completed"
                        ? "Complete"
                        : "Interrupted";
                return (
                  <tr key={i.id} className="align-top">
                    <td className="px-4 py-3">
                      <Link href={`/admin/ai-interviews/${i.id}`} className="font-medium text-uk-heading hover:text-uk-blue">{i.candidate.name}</Link>
                      <span className="block text-xs text-uk-muted">{i.candidate.email}</span>
                    </td>
                    <td className="px-4 py-3 text-uk-body">{i.position}</td>
                    <td className="px-4 py-3 text-uk-body">{fmt(i.startedAt)}</td>
                    <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                    <td className="px-4 py-3">
                      <span className={`block text-sm ${received ? "text-uk-heading" : "text-uk-muted"}`}>{upload}</span>
                      {received && (
                        <span className="block text-xs text-uk-muted">
                          {rec.segments} part{rec.segments === 1 ? "" : "s"} · {size(rec.bytes)}
                          {rec.deleteAfter ? ` · deleted after ${fmt(rec.deleteAfter)}` : ""}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {received ? (
                        <Link href={`/admin/ai-interviews/${i.id}#recording`} className="inline-flex items-center gap-1.5 rounded-lg border border-uk-line px-3 py-1.5 text-xs font-medium text-uk-blue hover:bg-uk-surface-2">
                          <Video className="h-3.5 w-3.5" /> Play
                        </Link>
                      ) : (
                        <span className="text-xs text-uk-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
