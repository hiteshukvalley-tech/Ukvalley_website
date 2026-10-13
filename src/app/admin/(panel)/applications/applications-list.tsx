import Link from "@/components/site/intent-link";
import {
  ArrowRight, BriefcaseBusiness, CalendarCheck, CalendarClock, Download, Eye, FileText, Filter,
  LayoutGrid, Mail, MapPin, Phone, Search, Table2, X,
} from "lucide-react";
import { Pagination } from "@/components/admin/pagination";
import { formatPostedDate, isIsoDate } from "@/lib/careers-shared";
import type { Application, ApplicationCounts, ColumnFilters, RoleSummary } from "@/lib/applications-store";
import { APPLICATION_STATUSES, EXPERIENCE_OPTIONS, applicationStatusLabel, type ApplicationStatus } from "@/lib/applications-validation";
import { ApplicationStatusBadge, formatApplicationDate, scheduledInterview } from "./application-ui";
import { ColumnFilterSelect } from "./column-filter-select";
import { DateBoxes, DateModeSwitch, type DateMode } from "./date-filter";

/** Initials for the card's avatar, e.g. "Rahul Patil" → "RP". */
const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";

/** The Grid view: one card per applicant. The whole card opens the application. */
function ApplicationCards({ items, showPosition }: { items: Application[]; showPosition: boolean }) {
  const detail = "flex min-w-0 items-center gap-2 text-sm text-uk-body";
  const icon = "h-4 w-4 shrink-0 text-uk-muted";
  return (
    <ul className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {items.map((a) => {
        const interview = scheduledInterview(a);
        return (
          <li key={a.id} className="min-w-0">
            <Link
              href={`/admin/applications/${a.id}`}
              className="group flex h-full flex-col rounded-xl border border-uk-line bg-uk-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-uk-blue/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {/* Who, and where they are in the hiring process */}
              <div className="flex items-start gap-3 border-b border-uk-line p-4">
                <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-uk-blue/15 text-sm font-bold text-uk-blue">
                  {initials(a.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-base text-uk-heading ${a.status === "new" ? "font-bold" : "font-semibold"}`} title={a.name}>
                    {a.name}
                  </p>
                  {showPosition && <p className="truncate text-sm font-medium text-uk-blue" title={a.position}>{a.position}</p>}
                  <div className="mt-2"><ApplicationStatusBadge status={a.status} /></div>
                </div>
              </div>

              {/* Contact and profile */}
              <div className="flex flex-1 flex-col gap-2 p-4">
                <p className={detail}><Mail className={icon} /><span className="truncate" title={a.email}>{a.email}</span></p>
                <p className={detail}><Phone className={icon} /><span className="truncate">{a.phone}</span></p>
                <p className={detail}><MapPin className={icon} /><span className="truncate" title={a.location}>{a.location}</span></p>
                <p className={detail}><BriefcaseBusiness className={icon} /><span className="truncate">{a.experience}</span></p>
                {a.joiningDate && (
                  <p className={detail}><CalendarCheck className={icon} /><span className="truncate">Expected joining: {formatPostedDate(a.joiningDate)}</span></p>
                )}
                {interview && (
                  <p className="mt-1 flex min-w-0 items-center gap-2 rounded-lg bg-violet-500/10 px-2.5 py-1.5 text-xs font-medium text-violet-700 dark:text-violet-300">
                    <CalendarClock className="h-4 w-4 shrink-0" />
                    <span className="truncate">Interview: {interview.date}{interview.time && `, ${interview.time}`}{interview.mode && ` · ${interview.mode}`}</span>
                  </p>
                )}
              </div>

              {/* Applied on, résumé, open */}
              <div className="flex items-center justify-between gap-2 border-t border-uk-line px-4 py-3 text-xs text-uk-muted">
                <span>Applied {formatApplicationDate(a.createdAt)}</span>
                <span className="inline-flex shrink-0 items-center gap-3">
                  <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> Resume</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-uk-blue">
                    View <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** The chosen day (`to` empty) or range of days, from the address. */
export type Dates = { mode: DateMode; from: string; to: string };

/**
 * Reads ?mode=&from=&to= (and the older ?date=). Invalid dates are dropped, a
 * reversed range is swapped, and an end date alone becomes a single day.
 */
export function readDates(sp: { mode?: string; from?: string; to?: string; date?: string }): Dates {
  const mode: DateMode = sp.mode === "range" ? "range" : "single";
  let from = isIsoDate(sp.from ?? "") ? sp.from! : isIsoDate(sp.date ?? "") ? sp.date! : "";
  let to = mode === "range" && isIsoDate(sp.to ?? "") ? sp.to! : "";
  if (!from && to) [from, to] = [to, ""];
  if (from && to && to < from) [from, to] = [to, from];
  if (to === from) to = "";
  return { mode, from, to };
}

/** "2 Oct 2026" or "1 Oct 2026 – 9 Oct 2026". */
export const datesLabel = ({ from, to }: Dates) => (to ? `${formatPostedDate(from)} – ${formatPostedDate(to)}` : formatPostedDate(from));

function setDates(p: URLSearchParams, { mode, from, to }: Dates) {
  if (mode === "range") p.set("mode", "range");
  if (from) p.set("from", from);
  if (to) p.set("to", to);
}

export type ListFilters = {
  /** this page's address, e.g. /admin/applications */
  basePath: string;
  /** extra address parameters this page always keeps (e.g. the role) */
  keep?: Record<string, string>;
  status: ApplicationStatus | "all";
  q: string;
  dates: Dates;
  pageSize: number;
  /** the table view's per-column filters */
  columns?: ColumnFilters;
  /** the page fixes the day (Today's applications): no date controls */
  lockDates?: boolean;
};

/** Address parameter of each table-header filter. */
const COLUMN_PARAMS = {
  name: "c_name",
  email: "c_email",
  phone: "c_phone",
  location: "c_loc",
  position: "c_pos",
  experience: "c_exp",
  interview: "c_int",
} as const satisfies Record<keyof ColumnFilters, string>;

/** Reads the table-header filters from the address; unknown values are dropped. */
export function readColumns(sp: Record<string, string | undefined>): ColumnFilters {
  const get = (k: keyof ColumnFilters) => (sp[COLUMN_PARAMS[k]] ?? "").trim().slice(0, 100);
  const experience = get("experience");
  const interview = get("interview");
  return {
    name: get("name"),
    email: get("email"),
    phone: get("phone"),
    location: get("location"),
    position: get("position"),
    experience: (EXPERIENCE_OPTIONS as readonly string[]).includes(experience) ? experience : "",
    interview: interview === "scheduled" || interview === "none" ? interview : "",
  };
}

export const hasColumns = (c?: ColumnFilters) => !!c && Object.values(c).some(Boolean);

function setColumns(p: URLSearchParams, c?: ColumnFilters) {
  if (!c) return;
  for (const k of Object.keys(COLUMN_PARAMS) as (keyof ColumnFilters)[]) {
    if (c[k]) p.set(COLUMN_PARAMS[k], c[k]);
  }
}

export type RoleRow = { position: string; open: boolean; total: number; new: number; latest: Date | null };

/**
 * Every open role (even with no applications yet), followed by any other
 * positions applicants typed in, with their application counts.
 */
export function roleRows(roles: RoleSummary[], careers: { role: string }[]): RoleRow[] {
  const byKey = new Map(roles.map((r) => [r.position.toLowerCase(), r]));
  return [
    ...careers.map((c) => {
      const r = byKey.get(c.role.toLowerCase());
      return { position: c.role, open: true, total: r?.total ?? 0, new: r?.new ?? 0, latest: r?.latest ?? null };
    }),
    ...roles
      .filter((r) => !careers.some((c) => c.role.toLowerCase() === r.position.toLowerCase()))
      .map((r) => ({ ...r, open: false })),
  ];
}

export const APPLICANTS_PATH = "/admin/applications/applicants";

/** How the list is shown: cards (the default) or a table with one row per applicant. */
export type ListView = "grid" | "table";
export const readView = (v?: string): ListView => (v === "table" ? "table" : "grid");

/** The applicants page: every applicant, or one job role's (`position`), keeping the chosen dates and view. */
export function applicantsHref(position = "", dates?: Dates, view: ListView = "grid") {
  const p = new URLSearchParams();
  if (position) p.set("role", position);
  if (view === "table") p.set("view", "table");
  if (dates) setDates(p, dates);
  const qs = p.toString();
  return qs ? `${APPLICANTS_PATH}?${qs}` : APPLICANTS_PATH;
}

/** Link to the page with some filters changed; `null` clears one. */
export function listHref(f: ListFilters, over: { status?: string; q?: string | null; page?: number } = {}) {
  const p = new URLSearchParams(f.keep);
  const s = over.status ?? f.status;
  const search = over.q === null ? "" : (over.q ?? f.q).trim();
  if (s !== "all") p.set("status", s);
  if (!f.lockDates) setDates(p, f.dates);
  if (search) p.set("q", search);
  setColumns(p, f.columns);
  if (over.page && over.page > 1) p.set("page", String(over.page));
  if (f.pageSize !== 25) p.set("per", String(f.pageSize));
  const qs = p.toString();
  return qs ? `${f.basePath}?${qs}` : f.basePath;
}

/**
 * The same list in the other view; the view is kept in `keep` so every filter
 * link carries it. The column filters belong to the table, so Grid drops them.
 */
function viewHref(f: ListFilters, view: ListView, page: number) {
  const keep = { ...f.keep };
  if (view === "table") keep.view = "table";
  else delete keep.view;
  return listHref({ ...f, keep, columns: view === "table" ? f.columns : undefined }, { page });
}

const viewBtn = (active: boolean) =>
  active
    ? "inline-flex h-8 items-center gap-1.5 rounded-md bg-uk-blue px-3 text-sm font-semibold text-uk-white"
    : "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading";

// Every cell stays on one line (no squeezed, wrapped text); the table scrolls
// sideways when the screen is narrower than it.
const th = "whitespace-nowrap border-b border-uk-line px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-uk-muted";
const td = "whitespace-nowrap px-5 py-4 align-middle text-sm text-uk-body";
// The applicant column stays in view while the rest scrolls sideways.
const stickyCol = "sticky left-0 z-10 border-r border-uk-line bg-uk-card group-hover:bg-uk-surface-2";
const muted = <span className="text-uk-muted">—</span>;

// Filter row under the column titles.
const FILTER_FORM = "applicant-column-filters";
const fth = "border-b border-uk-line px-3 py-2 align-middle font-normal";
const filterInput = (active: boolean) =>
  `h-8 w-full min-w-32 rounded-md border bg-uk-card px-2 text-xs text-uk-heading outline-none placeholder:text-uk-muted focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 ${
    active ? "border-uk-blue/60" : "border-uk-line"
  }`;

const STATUS_OPTIONS = APPLICATION_STATUSES.map((s) => ({ value: s, label: applicationStatusLabel[s] }));
const EXPERIENCE_FILTER_OPTIONS = EXPERIENCE_OPTIONS.map((e) => ({ value: e, label: e }));
const INTERVIEW_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "none", label: "Not scheduled" },
] as const;

/**
 * The filter form behind the table's filter row (the inputs sit in the header
 * cells and join it with `form=`). Carries every other filter so applying one
 * keeps the rest; the page goes back to 1.
 */
function ColumnFilterForm({ f }: { f: ListFilters }) {
  return (
    <form id={FILTER_FORM} method="get" action={f.basePath} className="hidden">
      {Object.entries(f.keep ?? {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {f.pageSize !== 25 && <input type="hidden" name="per" value={String(f.pageSize)} />}
      {!f.lockDates && f.dates.mode === "range" && <input type="hidden" name="mode" value="range" />}
      {!f.lockDates && f.dates.from && <input type="hidden" name="from" value={f.dates.from} />}
      {!f.lockDates && f.dates.to && <input type="hidden" name="to" value={f.dates.to} />}
      {f.q.trim() && <input type="hidden" name="q" value={f.q.trim()} />}
    </form>
  );
}

function TextFilter({ f, field, label }: { f: ListFilters; field: "name" | "email" | "phone" | "location" | "position"; label: string }) {
  const value = f.columns?.[field] ?? "";
  return (
    <input
      form={FILTER_FORM}
      type="search"
      name={COLUMN_PARAMS[field]}
      defaultValue={value}
      placeholder={`Filter ${label.toLowerCase()}…`}
      aria-label={`Filter by ${label.toLowerCase()}`}
      maxLength={100}
      className={filterInput(!!value)}
    />
  );
}

/** One row per applicant with every detail, the interview date and the CV, with a filter under each column title. */
function ApplicationsTable({ f, items, showPosition, first }: { f: ListFilters; items: Application[]; showPosition: boolean; first: number }) {
  const filtered = hasColumns(f.columns) || f.status !== "all";
  const columnCount = showPosition ? 12 : 11;
  return (
    <div className="overflow-x-auto">
      <ColumnFilterForm f={f} />
      <table className="w-full min-w-max border-separate border-spacing-0">
        <thead className="bg-uk-surface-2">
          <tr>
            <th scope="col" className={`${th} w-12 text-right`}>#</th>
            <th scope="col" className={`${th} sticky left-0 z-10 border-r bg-uk-surface-2`}>Applicant</th>
            <th scope="col" className={th}>Email</th>
            <th scope="col" className={th}>Phone</th>
            <th scope="col" className={th}>Location</th>
            {showPosition && <th scope="col" className={th}>Position applied for</th>}
            <th scope="col" className={th}>Experience</th>
            <th scope="col" className={th}>Expected joining</th>
            <th scope="col" className={th}>Status</th>
            <th scope="col" className={th}>Interview</th>
            <th scope="col" className={th}>Applied on</th>
            <th scope="col" className={`${th} text-center`}>CV</th>
          </tr>
          {/* Column filters: type and press Enter (or Apply); dropdowns apply at once */}
          <tr className="bg-uk-surface-2/60">
            <td className={fth}>
              <button
                type="submit"
                form={FILTER_FORM}
                title="Apply filters"
                aria-label="Apply column filters"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-uk-blue text-uk-white transition-colors hover:bg-uk-blue-bright"
              >
                <Filter className="h-3.5 w-3.5" />
              </button>
            </td>
            <td className={`${fth} sticky left-0 z-10 border-r bg-uk-surface-2`}><TextFilter f={f} field="name" label="Name" /></td>
            <td className={fth}><TextFilter f={f} field="email" label="Email" /></td>
            <td className={fth}><TextFilter f={f} field="phone" label="Phone" /></td>
            <td className={fth}><TextFilter f={f} field="location" label="Location" /></td>
            {showPosition && <td className={fth}><TextFilter f={f} field="position" label="Position" /></td>}
            <td className={fth}>
              <ColumnFilterSelect form={FILTER_FORM} name={COLUMN_PARAMS.experience} value={f.columns?.experience ?? ""} label="experience" options={EXPERIENCE_FILTER_OPTIONS} />
            </td>
            <td className={fth} />
            <td className={fth}>
              <ColumnFilterSelect form={FILTER_FORM} name="status" value={f.status === "all" ? "" : f.status} label="status" options={STATUS_OPTIONS} />
            </td>
            <td className={fth}>
              <ColumnFilterSelect form={FILTER_FORM} name={COLUMN_PARAMS.interview} value={f.columns?.interview ?? ""} label="interview" options={INTERVIEW_OPTIONS} />
            </td>
            <td className={`${fth} text-xs text-uk-muted`}>{f.lockDates ? "Today" : "Use the date box above"}</td>
            <td className={`${fth} text-center`}>
              {filtered && (
                <Link
                  href={listHref({ ...f, status: "all", columns: undefined }, { page: 1 })}
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-uk-line px-2.5 text-xs font-medium text-uk-body transition-colors hover:bg-uk-surface-3 hover:text-uk-heading"
                >
                  <X className="h-3.5 w-3.5" /> Clear
                </Link>
              )}
            </td>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={columnCount} className="px-5 py-10 text-center text-sm text-uk-muted">
                {f.lockDates && !filtered && !f.q.trim() ? "No applications have come in today yet." : "No applicants match these filters."}
              </td>
            </tr>
          )}
          {items.map((a, i) => {
            const interview = scheduledInterview(a);
            const resume = `/admin/applications/${a.id}/resume`;
            const cell = (extra = "") => `${td} border-b border-uk-line ${extra}`;
            return (
              <tr key={a.id} className="group transition-colors hover:bg-uk-surface-2">
                <td className={cell("text-right text-xs tabular-nums text-uk-muted")}>{first + i}</td>
                <td className={cell(stickyCol)}>
                  <Link
                    href={`/admin/applications/${a.id}`}
                    className={`text-[0.95rem] text-uk-heading hover:text-uk-blue hover:underline ${a.status === "new" ? "font-bold" : "font-semibold"}`}
                  >
                    {a.name}
                  </Link>
                </td>
                <td className={cell()}>
                  <a href={`mailto:${a.email}`} className="hover:text-uk-blue hover:underline">{a.email}</a>
                </td>
                <td className={cell("tabular-nums")}>
                  <a href={`tel:${a.phone.replace(/[^\d+]/g, "")}`} className="hover:text-uk-blue hover:underline">{a.phone}</a>
                </td>
                <td className={cell()}>{a.location || muted}</td>
                {showPosition && <td className={cell("font-medium text-uk-heading")}>{a.position}</td>}
                <td className={cell()}>{a.experience || muted}</td>
                <td className={cell()}>{a.joiningDate ? formatPostedDate(a.joiningDate) : muted}</td>
                <td className={cell()}><ApplicationStatusBadge status={a.status} /></td>
                <td className={cell()}>
                  {interview ? (
                    <div className="leading-tight">
                      <p className="font-medium text-uk-heading">{interview.date}</p>
                      {(interview.time || interview.mode) && (
                        <p className="mt-0.5 text-xs text-uk-muted">{[interview.time, interview.mode].filter(Boolean).join(" · ")}</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-uk-muted">Not scheduled</span>
                  )}
                </td>
                <td className={cell("text-uk-muted")}>{formatApplicationDate(a.createdAt)}</td>
                <td className={cell()}>
                  <div className="flex items-center justify-center gap-1.5">
                    <a
                      href={resume}
                      target="_blank"
                      rel="noopener"
                      title={`View ${a.resume.name}`}
                      aria-label={`View ${a.name}'s CV`}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-uk-line px-2.5 text-xs font-medium text-uk-body transition-colors hover:border-uk-blue/50 hover:text-uk-blue"
                    >
                      <Eye className="h-3.5 w-3.5" /> View
                    </a>
                    <a
                      href={`${resume}?download`}
                      title={`Download ${a.resume.name}`}
                      aria-label={`Download ${a.name}'s CV`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-uk-line text-uk-body transition-colors hover:border-uk-blue/50 hover:text-uk-blue"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Status tabs with a date box beside them, search, the applications and paging. */
export function ApplicationsList({
  filters: f, items, total, counts, page, today, noneYet, dbError, showPosition = true, view = "grid", viewSwitch = false,
}: {
  filters: ListFilters;
  items: Application[];
  total: number;
  counts: ApplicationCounts;
  page: number;
  /** today in India, the latest date the calendar offers */
  today: string;
  /** true when there are no applications at all in this list's scope */
  noneYet: boolean;
  dbError?: string;
  showPosition?: boolean;
  /** cards ("grid") or one row per applicant ("table") */
  view?: ListView;
  /** show the Grid / Table switch */
  viewSwitch?: boolean;
}) {
  const tabs = [{ key: "all", label: "All" }, ...APPLICATION_STATUSES.map((s) => ({ key: s, label: applicationStatusLabel[s] }))] as const;

  return (
    <>
      {/* Grid / Table switch, and the date filter type; the date boxes sit in the table header */}
      <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
        {viewSwitch && (
          <div role="group" aria-label="View" className="mr-auto inline-flex rounded-lg border border-uk-line bg-uk-card p-0.5">
            <Link href={viewHref(f, "grid", page)} aria-current={view === "grid" ? "page" : undefined} className={viewBtn(view === "grid")}>
              <LayoutGrid className="h-4 w-4" /> Grid
            </Link>
            <Link href={viewHref(f, "table", page)} aria-current={view === "table" ? "page" : undefined} className={viewBtn(view === "table")}>
              <Table2 className="h-4 w-4" /> Table
            </Link>
          </div>
        )}
        {!f.lockDates && (
          <>
            <span className="text-sm text-uk-muted">Filter by</span>
            <DateModeSwitch mode={f.dates.mode} from={f.dates.from} to={f.dates.to} />
          </>
        )}
      </div>
      {/* data-wide: with the Grid / Table switch, both views get the whole screen width (the admin page drops its width limit) */}
      <section data-wide={viewSwitch || undefined} className="rounded-2xl border border-uk-line bg-uk-card">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-uk-line p-3">
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by status">
            {tabs.map((t) => {
              const active = f.status === t.key;
              return (
                <Link
                  key={t.key}
                  href={listHref(f, { status: t.key, page: 1 })}
                  role="tab"
                  aria-selected={active}
                  className={
                    active
                      ? "inline-flex h-9 items-center gap-2 rounded-lg bg-uk-blue/15 px-3 text-sm font-semibold text-uk-blue"
                      : "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-uk-muted transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
                  }
                >
                  {t.label}
                  <span className="rounded-full bg-uk-surface-3 px-2 py-0.5 text-[0.7rem] font-semibold text-uk-body">{counts[t.key]}</span>
                </Link>
              );
            })}
          </div>
          {!f.lockDates && <DateBoxes mode={f.dates.mode} from={f.dates.from} to={f.dates.to} max={today} />}
        </div>

        {f.dates.from && (
          <p className="border-b border-uk-line px-4 py-2.5 text-sm text-uk-body">
            <span className="font-semibold text-uk-heading">{counts.all}</span> {counts.all === 1 ? "application" : "applications"}{" "}
            {f.dates.to ? "from" : "on"}{" "}
            <span className="font-semibold text-uk-heading">{formatPostedDate(f.dates.from)}</span>
            {f.dates.to && (
              <>
                {" "}to <span className="font-semibold text-uk-heading">{formatPostedDate(f.dates.to)}</span>
              </>
            )}
          </p>
        )}

        <form method="get" action={f.basePath} className="flex flex-wrap items-center gap-3 border-b border-uk-line p-4">
          {Object.entries(f.keep ?? {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
          {f.pageSize !== 25 && <input type="hidden" name="per" value={String(f.pageSize)} />}
          {f.status !== "all" && <input type="hidden" name="status" value={f.status} />}
          {!f.lockDates && f.dates.mode === "range" && <input type="hidden" name="mode" value="range" />}
          {!f.lockDates && f.dates.from && <input type="hidden" name="from" value={f.dates.from} />}
          {!f.lockDates && f.dates.to && <input type="hidden" name="to" value={f.dates.to} />}
          {hasColumns(f.columns) &&
            Object.entries(COLUMN_PARAMS).map(([k, param]) => {
              const v = f.columns?.[k as keyof ColumnFilters];
              return v ? <input key={param} type="hidden" name={param} value={v} /> : null;
            })}
          <label className="relative min-w-52 flex-1">
            <span className="sr-only">Search applications</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-uk-muted" />
            <input
              type="search"
              name="q"
              defaultValue={f.q}
              placeholder={showPosition ? "Search by name, email, phone, location or position" : "Search by name, email, phone or location"}
              className="h-10 w-full rounded-lg border border-input bg-transparent pl-9 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </label>
          <button type="submit" className="h-10 rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading">
            Search
          </button>
          {f.q.trim() && (
            <Link href={listHref(f, { q: null, page: 1 })} className="text-sm text-uk-muted hover:text-uk-heading">
              Clear
            </Link>
          )}
        </form>

        {!dbError && noneYet ? (
          <div className="p-10 text-center">
            <h2 className="font-heading text-lg font-semibold text-uk-heading">No applications yet</h2>
            <p className="mx-auto mt-1 max-w-lg text-sm text-uk-muted">
              When someone applies from the Careers page, the application appears here and HR gets an email.
            </p>
          </div>
        ) : items.length === 0 && (dbError || view !== "table") ? (
          // (the table shows its own "no match" row, keeping its filters in reach)
          <p className="p-8 text-center text-sm text-uk-muted">
            {dbError
              ? "No data."
              : f.lockDates && counts.all === 0 && !f.q.trim()
                ? "No applications have come in today yet. They appear here as soon as someone applies."
                : f.dates.from ? `No applications ${f.dates.to ? "between" : "on"} ${datesLabel(f.dates)} match these filters.` : "No applications match these filters."}
          </p>
        ) : (
          <>
            {view === "table" ? (
              <ApplicationsTable f={f} items={items} showPosition={showPosition} first={(page - 1) * f.pageSize + 1} />
            ) : (
              <ApplicationCards items={items} showPosition={showPosition} />
            )}

            <Pagination total={total} page={page} pageSize={f.pageSize} defaultSize={25} noun="applications" />
          </>
        )}
      </section>
    </>
  );
}
