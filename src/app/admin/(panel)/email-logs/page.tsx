import { Suspense } from "react";
import Link from "@/components/site/intent-link";
import { CircleAlert, CircleCheck, CircleX, Filter, Search, X } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { requireAdmin } from "@/lib/admin-session";
import { readPaging } from "@/lib/pagination";
import { isIsoDate, todayInIndia } from "@/lib/careers-shared";
import { APPLICATION_STATUSES, applicationStatusLabel, isApplicationStatus } from "@/lib/applications-validation";
import { EMAIL_KINDS, emailKindLabel, isEmailKind, listEmailLogs, type EmailLogColumns } from "@/lib/email-logs-store";
import { ApplicationStatusBadge, formatApplicationDate } from "../applications/application-ui";
import { ColumnFilterSelect } from "../applications/column-filter-select";
import { ManualEmailButton, ManualEmailDialog } from "./manual-email";
import { ChatButton, ChatPanel } from "./chat-panel";

export const metadata = { title: "Email logs" };
export const dynamic = "force-dynamic";

const BASE = "/admin/email-logs";
const FORM = "email-log-filters";

/** Address parameter of each text filter in the table header. */
const TEXT_PARAMS = {
  name: "c_name",
  email: "c_email",
  position: "c_pos",
  subject: "c_subject",
  to: "c_to",
  sentBy: "c_by",
} as const;
type TextKey = keyof typeof TEXT_PARAMS;

type Props = { searchParams: Promise<Record<string, string | undefined>> };

type Filters = { q: string; kind: string; result: string; date: string; columns: EmailLogColumns; pageSize: number };

/** This page with some filters changed (back to page 1). */
function href(f: Filters, over: Partial<Filters> = {}) {
  const v = { ...f, ...over };
  const p = new URLSearchParams();
  if (v.q.trim()) p.set("q", v.q.trim());
  if (v.kind) p.set("kind", v.kind);
  if (v.result) p.set("result", v.result);
  if (v.date) p.set("date", v.date);
  for (const [k, param] of Object.entries(TEXT_PARAMS)) {
    const value = v.columns[k as TextKey];
    if (value) p.set(param, value);
  }
  if (v.columns.status) p.set("c_status", v.columns.status);
  if (v.pageSize !== 25) p.set("per", String(v.pageSize));
  const qs = p.toString();
  return qs ? `${BASE}?${qs}` : BASE;
}

const tab = (active: boolean) =>
  active
    ? "inline-flex h-9 items-center gap-2 rounded-lg bg-uk-blue/15 px-3 text-sm font-semibold text-uk-blue"
    : "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-uk-muted transition-colors hover:bg-uk-surface-2 hover:text-uk-heading";
const count = "rounded-full bg-uk-surface-3 px-2 py-0.5 text-[0.7rem] font-semibold text-uk-body";
const control =
  "h-10 rounded-lg border border-input bg-uk-card px-3 text-sm text-uk-heading outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const th = "whitespace-nowrap border-b border-uk-line px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-uk-muted";
const fth = "border-b border-uk-line px-3 py-2 align-middle font-normal";
const td = "whitespace-nowrap border-b border-uk-line px-5 py-4 align-middle text-sm text-uk-body";
const filterInput = (active: boolean) =>
  `h-8 w-full min-w-32 rounded-md border bg-uk-card px-2 text-xs text-uk-heading outline-none placeholder:text-uk-muted focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 ${
    active ? "border-uk-blue/60" : "border-uk-line"
  }`;

const KIND_OPTIONS = EMAIL_KINDS.map((k) => ({ value: k, label: emailKindLabel[k] }));
const STATUS_OPTIONS = APPLICATION_STATUSES.map((s) => ({ value: s, label: applicationStatusLabel[s] }));
const RESULT_OPTIONS = [
  { value: "sent", label: "Sent" },
  { value: "failed", label: "Failed" },
] as const;

function TextFilter({ f, field, label }: { f: Filters; field: TextKey; label: string }) {
  const value = f.columns[field] ?? "";
  return (
    <input
      form={FORM}
      type="search"
      name={TEXT_PARAMS[field]}
      defaultValue={value}
      placeholder={`Filter ${label.toLowerCase()}…`}
      aria-label={`Filter by ${label.toLowerCase()}`}
      maxLength={100}
      className={filterInput(!!value)}
    />
  );
}

/**
 * Every Careers email, newest first: the HR notice and thank-you sent when
 * someone applies, and the status emails HR sends — sent or failed, with the
 * applicant, the address, the subject and the status it was about. Each
 * column has a filter under its title.
 */
export default async function EmailLogsPage({ searchParams }: Props) {
  await requireAdmin("applications");
  const sp = await searchParams;
  const { page, pageSize } = readPaging(sp.page, sp.per, 25);
  const text = (param: string) => (sp[param] ?? "").trim().slice(0, 100);
  const columns: EmailLogColumns = Object.fromEntries(Object.entries(TEXT_PARAMS).map(([k, param]) => [k, text(param)]));
  if (isApplicationStatus(sp.c_status)) columns.status = sp.c_status;
  const f: Filters = {
    q: text("q"),
    kind: isEmailKind(sp.kind) ? sp.kind : "",
    result: sp.result === "sent" || sp.result === "failed" ? sp.result : "",
    date: isIsoDate(sp.date ?? "") ? sp.date! : "",
    columns,
    pageSize,
  };

  const { items, total, counts, dbError } = await listEmailLogs({ ...f, page, pageSize });
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total > 0 && page > pages) redirect(`${href(f)}${href(f).includes("?") ? "&" : "?"}page=${pages}`);
  const filtered = !!(f.q || f.kind || f.result || f.date || Object.values(f.columns).some(Boolean));
  const noneYet = !dbError && !filtered && counts.all === 0;

  return (
    <>
      <PageHeader
        title="Email logs"
        crumbs={[{ label: "Careers", href: "/admin/careers" }, { label: "Email logs" }]}
        description="Every email sent to applicants and HR: application notices, thank-yous, status updates and manual emails. Failed emails are listed too, with the reason."
        action={<ManualEmailButton />}
      />
      <ManualEmailDialog />
      {/* The conversation with one applicant (?chat=<email>), opened from the Chat column or a notification */}
      <Suspense fallback={null}>
        <ChatPanel />
      </Suspense>

      {dbError && (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Could not read the email logs ({dbError}).</span>
        </div>
      )}

      <section data-wide className="rounded-2xl border border-uk-line bg-uk-card">
        {/* Sent / failed */}
        <div className="flex flex-wrap gap-1.5 border-b border-uk-line p-3" role="tablist" aria-label="Filter by result">
          {([["", "All", counts.all], ["sent", "Sent", counts.sent], ["failed", "Failed", counts.failed]] as const).map(([key, label, n]) => (
            <Link key={label} href={href(f, { result: key })} role="tab" aria-selected={f.result === key} className={tab(f.result === key)}>
              {label} <span className={count}>{n}</span>
            </Link>
          ))}
        </div>

        {/*
          The one filter form: the search box here, and every column filter in
          the table header (joined with form=). Enter or Apply submits; the
          dropdowns apply at once.
        */}
        <form id={FORM} method="get" action={BASE} className="flex flex-wrap items-center gap-3 border-b border-uk-line p-4">
          {pageSize !== 25 && <input type="hidden" name="per" value={String(pageSize)} />}
          <label className="relative min-w-60 flex-1">
            <span className="sr-only">Search email logs</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-uk-muted" />
            <input
              type="search"
              name="q"
              defaultValue={f.q}
              placeholder="Search everything: applicant, email, position or subject"
              className={`${control} w-full pl-9`}
            />
          </label>
          <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-4 text-sm font-semibold text-uk-white transition-colors hover:bg-uk-blue-bright">
            <Filter className="h-4 w-4" /> Apply filters
          </button>
          {filtered && (
            <Link href={BASE} className="inline-flex items-center gap-1 text-sm text-uk-muted hover:text-uk-heading">
              <X className="h-3.5 w-3.5" /> Clear all
            </Link>
          )}
        </form>

        {noneYet ? (
          <div className="p-10 text-center">
            <h2 className="font-heading text-lg font-semibold text-uk-heading">No emails logged yet</h2>
            <p className="mx-auto mt-1 max-w-lg text-sm text-uk-muted">
              Emails appear here as they are sent: when someone applies on the Careers page, and when HR sends a status email from an application.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-separate border-spacing-0">
                <thead className="bg-uk-surface-2">
                  <tr>
                    <th scope="col" className={th}>Date &amp; time</th>
                    <th scope="col" className={th}>Applicant</th>
                    <th scope="col" className={th}>Applicant email</th>
                    <th scope="col" className={th}>Position</th>
                    <th scope="col" className={th}>Email</th>
                    <th scope="col" className={th}>Status</th>
                    <th scope="col" className={th}>Subject</th>
                    <th scope="col" className={th}>Sent to</th>
                    <th scope="col" className={th}>Result</th>
                    <th scope="col" className={th}>Sent by</th>
                    <th scope="col" className={`${th} text-center`}>Email</th>
                    <th scope="col" className={`${th} text-center`}>Chat</th>
                  </tr>
                  {/* Column filters */}
                  <tr className="bg-uk-surface-2/60">
                    <td className={fth}>
                      <input
                        form={FORM}
                        type="date"
                        name="date"
                        defaultValue={f.date}
                        max={todayInIndia()}
                        aria-label="Filter by day"
                        className={filterInput(!!f.date)}
                      />
                    </td>
                    <td className={fth}><TextFilter f={f} field="name" label="Applicant" /></td>
                    <td className={fth}><TextFilter f={f} field="email" label="Email" /></td>
                    <td className={fth}><TextFilter f={f} field="position" label="Position" /></td>
                    <td className={fth}>
                      <ColumnFilterSelect form={FORM} name="kind" value={f.kind} label="email type" options={KIND_OPTIONS} />
                    </td>
                    <td className={fth}>
                      <ColumnFilterSelect form={FORM} name="c_status" value={f.columns.status ?? ""} label="status" options={STATUS_OPTIONS} />
                    </td>
                    <td className={fth}><TextFilter f={f} field="subject" label="Subject" /></td>
                    <td className={fth}><TextFilter f={f} field="to" label="Recipient" /></td>
                    <td className={fth}>
                      <ColumnFilterSelect form={FORM} name="result" value={f.result} label="result" options={RESULT_OPTIONS} />
                    </td>
                    <td className={fth}><TextFilter f={f} field="sentBy" label="Sender" /></td>
                    <td className={fth} />
                    <td className={fth} />
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={12} className="px-5 py-10 text-center text-sm text-uk-muted">
                        {dbError ? "No data." : "No emails match these filters."}
                      </td>
                    </tr>
                  )}
                  {items.map((l) => (
                    <tr key={l.id} className="transition-colors hover:bg-uk-surface-2">
                      <td className={`${td} text-uk-muted`}>{formatApplicationDate(l.at)}</td>
                      <td className={td}>
                        {l.applicationId ? (
                          <Link href={`/admin/applications/${l.applicationId}`} className="font-semibold text-uk-heading hover:text-uk-blue hover:underline">
                            {l.applicantName}
                          </Link>
                        ) : (
                          <span className="font-semibold text-uk-heading">{l.applicantName}</span>
                        )}
                      </td>
                      <td className={td}>{l.applicantEmail}</td>
                      <td className={td}>{l.position}</td>
                      <td className={td}>{emailKindLabel[l.kind]}</td>
                      <td className={td}><ApplicationStatusBadge status={l.status} /></td>
                      <td className={`${td} max-w-80 truncate`} title={l.subject}>{l.subject}</td>
                      <td className={td}>{l.to || <span className="text-uk-muted">—</span>}</td>
                      <td className={td}>
                        {l.result === "sent" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                            <CircleCheck className="h-3.5 w-3.5" /> Sent
                          </span>
                        ) : (
                          <span
                            title={l.error}
                            className="inline-flex max-w-72 items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:text-red-300"
                          >
                            <CircleX className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Failed{l.error ? `: ${l.error}` : ""}</span>
                          </span>
                        )}
                      </td>
                      <td className={`${td} text-uk-muted`}>{l.sentBy || "Automatic"}</td>
                      <td className={`${td} text-center`}>
                        {/* Write to this applicant (the HR notice row still emails the applicant, not HR) */}
                        <ManualEmailButton compact prefill={{ to: l.applicantEmail, name: l.applicantName, position: l.position, status: l.status }} />
                      </td>
                      <td className={`${td} text-center`}>
                        {/* Every email between HR and this applicant, as a conversation */}
                        <ChatButton email={l.applicantEmail} name={l.applicantName} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination total={total} page={page} pageSize={pageSize} defaultSize={25} noun="emails" />
          </>
        )}
      </section>
    </>
  );
}
