import Link from "@/components/site/intent-link";
import { Clock, ExternalLink, Mail, MapPin, Phone, Repeat, Video } from "lucide-react";
import type { Interview } from "@/lib/interviews-store";
import { isIsoDate } from "@/lib/careers-shared";
import { ApplicationStatusBadge } from "../applications/application-ui";

/** The day `n` days after `iso` (YYYY-MM-DD; n may be negative). */
export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** "03:30 PM" from HH:MM; "" stays "". */
export function formatInterviewTime(v: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v.trim());
  if (!m) return v;
  const h = Number(m[1]);
  return `${String(((h + 11) % 12) + 1).padStart(2, "0")}:${m[2]} ${h < 12 ? "AM" : "PM"}`;
}

/** "Monday, 12 Oct 2026". Formatted in UTC so server and browser agree. */
export function formatInterviewDay(iso: string): string {
  if (!isIsoDate(iso)) return iso;
  return new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`)
  );
}

/** "Today" / "Tomorrow" / "Yesterday", or "" for any other day. */
export function relativeDay(iso: string, today: string): string {
  if (iso === today) return "Today";
  if (iso === addDays(today, 1)) return "Tomorrow";
  if (iso === addDays(today, -1)) return "Yesterday";
  return "";
}

const isUrl = (s: string) => /^https?:\/\/\S+$/i.test(s);

/** One interview: time, candidate, role, mode and venue, with a link to the application. */
export function InterviewRow({ interview: i, compact = false }: { interview: Interview; compact?: boolean }) {
  const cancelled = i.status === "rejected";
  return (
    <li className={`flex flex-col gap-3 py-4 sm:flex-row sm:items-start ${cancelled ? "opacity-60" : ""}`}>
      <div className="flex w-28 shrink-0 items-center gap-1.5 font-heading text-sm font-semibold text-uk-heading">
        <Clock className="h-4 w-4 text-uk-blue" />
        {i.time ? formatInterviewTime(i.time) : <span className="font-normal text-uk-muted">No time set</span>}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/admin/applications/${i.applicationId}`} className="font-semibold text-uk-heading hover:text-uk-blue">
            {i.name}
          </Link>
          <ApplicationStatusBadge status={i.status} />
          {i.rescheduled && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
              <Repeat className="h-3 w-3" /> Rescheduled
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-uk-body">{i.position}</p>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-uk-muted">
          {i.mode && (
            <span className="inline-flex items-center gap-1">
              <Video className="h-3.5 w-3.5" /> {i.mode}
            </span>
          )}
          {i.venue &&
            (isUrl(i.venue) ? (
              <a href={i.venue} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 text-uk-blue hover:text-uk-blue-bright">
                <ExternalLink className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{i.venue}</span>
              </a>
            ) : (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {i.venue}
              </span>
            ))}
          {!compact && (
            <>
              {i.phone && (
                <a href={`tel:${i.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1 hover:text-uk-heading">
                  <Phone className="h-3.5 w-3.5" /> {i.phone}
                </a>
              )}
              <a href={`mailto:${i.email}`} className="inline-flex items-center gap-1 hover:text-uk-heading">
                <Mail className="h-3.5 w-3.5" /> {i.email}
              </a>
            </>
          )}
        </div>
        {!compact && i.agenda && <p className="mt-1.5 whitespace-pre-line text-xs text-uk-muted">Agenda: {i.agenda}</p>}
      </div>
    </li>
  );
}
