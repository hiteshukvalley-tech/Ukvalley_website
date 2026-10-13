import Link from "@/components/site/intent-link";
import { CalendarClock, CalendarDays, CircleAlert, Search } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin-session";
import { listInterviews, type Interview } from "@/lib/interviews-store";
import { formatPostedDate, isIsoDate, todayInIndia } from "@/lib/careers-shared";
import { addDays, formatInterviewDay, InterviewRow, relativeDay } from "./interview-ui";

export const metadata = { title: "Daily interviews" };
export const dynamic = "force-dynamic";

const PATH = "/admin/interviews";

/** Quick ranges, as [first day, last day] offsets from today. */
const RANGES = {
  today: { label: "Today", days: [0, 0] },
  tomorrow: { label: "Tomorrow", days: [1, 1] },
  week: { label: "Next 7 days", days: [0, 6] },
  month: { label: "Next 30 days", days: [0, 29] },
  past: { label: "Past 7 days", days: [-7, -1] },
} as const;
type RangeKey = keyof typeof RANGES;
const isRange = (v: unknown): v is RangeKey => typeof v === "string" && v in RANGES;

/** Longest custom range, so one page never reads years of interviews. */
const MAX_DAYS = 366;

type Props = { searchParams: Promise<{ range?: string; from?: string; to?: string; q?: string }> };

/** The days to show: a quick range, or custom dates (from / to), else the next 7 days. */
function readDays(sp: { range?: string; from?: string; to?: string }, today: string) {
  if (!isRange(sp.range) && sp.from && isIsoDate(sp.from)) {
    let to = sp.to && isIsoDate(sp.to) && sp.to >= sp.from ? sp.to : sp.from;
    if (to > addDays(sp.from, MAX_DAYS - 1)) to = addDays(sp.from, MAX_DAYS - 1);
    return { range: null, from: sp.from, to };
  }
  const range: RangeKey = isRange(sp.range) ? sp.range : "week";
  const [a, b] = RANGES[range].days;
  return { range, from: addDays(today, a), to: addDays(today, b) };
}

const href = (params: Record<string, string>) => {
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
  return s ? `${PATH}?${s}` : PATH;
};

/**
 * Interviews day by day: every applicant HR shortlisted with an interview
 * date (Applications → applicant → Shortlisted → email), grouped by the day of
 * the interview and sorted by time. A rescheduled interview shows on its new day.
 */
export default async function InterviewsPage({ searchParams }: Props) {
  await requireAdmin("applications");
  const sp = await searchParams;
  const today = todayInIndia();
  const q = (sp.q ?? "").trim();
  const { range, from, to } = readDays(sp, today);
  const { items, dbError } = await listInterviews({ from, to, q });

  const byDay = new Map<string, Interview[]>();
  for (const i of items) byDay.set(i.date, [...(byDay.get(i.date) ?? []), i]);
  const upcoming = items.filter((i) => i.status !== "rejected").length;
  const rangeText = from === to ? formatPostedDate(from) : `${formatPostedDate(from)} – ${formatPostedDate(to)}`;

  return (
    <>
      <PageHeader
        title="Daily interviews"
        crumbs={[{ label: "Careers", href: "/admin/careers" }, { label: "Daily interviews" }]}
        description="Interviews scheduled with shortlisted applicants, day by day (India time). An interview is added here when you shortlist an applicant and send the email with the interview date."
      />

      {/* Quick ranges, custom dates and search */}
      <section className="mb-6 rounded-2xl border border-uk-line bg-uk-card">
        <nav aria-label="Days" className="flex flex-wrap gap-2 border-b border-uk-line p-4">
          {(Object.keys(RANGES) as RangeKey[]).map((key) => (
            <Link
              key={key}
              href={href({ range: key, q })}
              aria-current={range === key ? "page" : undefined}
              className={
                range === key
                  ? "rounded-full bg-uk-blue px-3.5 py-1.5 text-sm font-semibold text-uk-white"
                  : "rounded-full border border-uk-line px-3.5 py-1.5 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
              }
            >
              {RANGES[key].label}
            </Link>
          ))}
        </nav>
        <form method="get" className="flex flex-wrap items-end gap-3 p-4">
          <label className="text-xs font-medium text-uk-muted">
            From
            <input
              type="date"
              name="from"
              defaultValue={from}
              required
              className="mt-1 block h-10 rounded-lg border border-input bg-transparent px-3 text-sm text-uk-body outline-none focus-visible:border-ring"
            />
          </label>
          <label className="text-xs font-medium text-uk-muted">
            To
            <input
              type="date"
              name="to"
              defaultValue={to}
              className="mt-1 block h-10 rounded-lg border border-input bg-transparent px-3 text-sm text-uk-body outline-none focus-visible:border-ring"
            />
          </label>
          <label className="relative min-w-52 flex-1">
            <span className="sr-only">Search interviews</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-uk-muted" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search by name, email, phone or position"
              className="h-10 w-full rounded-lg border border-input bg-transparent pl-9 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </label>
          <button type="submit" className="h-10 rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading">
            Show
          </button>
          {(q || range !== "week") && (
            <Link href={PATH} className="pb-2.5 text-sm text-uk-muted hover:text-uk-heading">Reset</Link>
          )}
        </form>
      </section>

      {dbError && (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Could not read interviews ({dbError}).</span>
        </div>
      )}

      {!dbError && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-uk-line bg-uk-card p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-uk-blue/12 text-uk-blue">
            <CalendarClock className="h-5 w-5" />
          </span>
          <p className="text-sm text-uk-body">
            <span className="font-heading text-2xl font-bold text-uk-heading">{items.length}</span>{" "}
            {items.length === 1 ? "interview" : "interviews"} · {rangeText}
            {upcoming !== items.length && <span className="text-uk-muted"> ({items.length - upcoming} with rejected applicants)</span>}
          </p>
        </div>
      )}

      {!dbError && items.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-uk-line bg-uk-card p-10 text-center">
          <CalendarDays className="mx-auto mb-3 h-8 w-8 text-uk-muted" />
          <h2 className="font-heading text-lg font-semibold text-uk-heading">No interviews {q ? "match your search" : "on these days"}</h2>
          <p className="mx-auto mt-1 max-w-lg text-sm text-uk-muted">
            To schedule one, open an applicant in{" "}
            <Link href="/admin/applications/applicants" className="text-uk-blue hover:text-uk-blue-bright">Job applications</Link>, set the status to
            Shortlisted and send the email with the interview date and time.
          </p>
        </section>
      ) : (
        <div className="space-y-5">
          {[...byDay].map(([day, list]) => {
            const rel = relativeDay(day, today);
            return (
              <section key={day} aria-labelledby={`day-${day}`} className="rounded-2xl border border-uk-line bg-uk-card px-5">
                <h2 id={`day-${day}`} className="flex flex-wrap items-center gap-2 border-b border-uk-line py-4 font-heading text-base font-semibold text-uk-heading">
                  {rel && (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${rel === "Today" ? "bg-uk-blue text-uk-white" : "bg-uk-surface-2 text-uk-body"}`}>
                      {rel}
                    </span>
                  )}
                  {formatInterviewDay(day)}
                  <span className="text-sm font-normal text-uk-muted">
                    · {list.length} {list.length === 1 ? "interview" : "interviews"}
                  </span>
                </h2>
                <ul className="divide-y divide-uk-line">
                  {list.map((i) => (
                    <InterviewRow key={i.applicationId} interview={i} />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
