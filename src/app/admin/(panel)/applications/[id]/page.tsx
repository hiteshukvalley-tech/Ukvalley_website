import Link from "@/components/site/intent-link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, ExternalLink, FileText, Mail, MailCheck, MailX, Phone } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { getApplication } from "@/lib/applications-store";
import { ApplicationStatusBadge, formatApplicationDate, formatBytes } from "../application-ui";
import { ApplicationForm } from "../application-form";

export const metadata = { title: "Job application" };
export const dynamic = "force-dynamic";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-uk-line py-3 last:border-0 sm:grid-cols-[12rem_1fr] sm:gap-4">
      <dt className="text-sm font-medium text-uk-muted">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-uk-heading">{children}</dd>
    </div>
  );
}

function EmailStatus({ label, sent }: { label: string; sent?: boolean }) {
  // undefined = still sending (or the server restarted before it finished)
  return (
    <span className="inline-flex items-center gap-1.5">
      {sent ? <MailCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <MailX className="h-4 w-4 text-uk-muted" />}
      {label}: {sent ? "sent" : sent === false ? "not sent" : "pending"}
    </span>
  );
}

export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = await getApplication(id);
  if (!app) notFound();

  const resumeHref = `/admin/applications/${app.id}/resume`;
  return (
    <>
      <PageHeader
        title={app.name}
        crumbs={[{ label: "Careers", href: "/admin/careers" }, { label: "Applications", href: "/admin/applications" }, { label: app.name }]}
        description={`Applied for ${app.position} · ${formatApplicationDate(app.createdAt)}`}
        action={<ApplicationStatusBadge status={app.status} />}
      />

      <div className="space-y-6">
        <section className="rounded-2xl border border-uk-line bg-uk-card p-6">
          <h2 className="font-heading text-lg font-semibold text-uk-heading">Application</h2>
          <dl className="mt-3">
            <Row label="Full name">{app.name}</Row>
            <Row label="Email address">
              <a href={`mailto:${app.email}`} className="inline-flex items-center gap-1.5 text-uk-blue hover:underline">
                <Mail className="h-3.5 w-3.5" /> {app.email}
              </a>
            </Row>
            <Row label="Phone number">
              <a href={`tel:${app.phone.replace(/\s+/g, "")}`} className="inline-flex items-center gap-1.5 text-uk-blue hover:underline">
                <Phone className="h-3.5 w-3.5" /> {app.phone}
              </a>
            </Row>
            <Row label="Current location">{app.location}</Row>
            <Row label="Position applied for">
              {app.position}
              {!app.careerSlug && <span className="ml-2 text-xs text-uk-muted">(typed by the applicant — not an open role)</span>}
            </Row>
            <Row label="Years of experience">{app.experience}</Row>
            <Row label="Portfolio / LinkedIn">
              {app.portfolio ? (
                <a href={app.portfolio} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 break-all text-uk-blue hover:underline">
                  {app.portfolio} <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
              ) : (
                <span className="text-uk-muted">—</span>
              )}
            </Row>
            <Row label="Resume">
              <span className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-uk-blue" /> {app.resume.name}
                  <span className="text-uk-muted">({formatBytes(app.resume.size)})</span>
                </span>
                {/* Plain links: they open/download a file, not a page. */}
                <a href={resumeHref} target="_blank" rel="noopener" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-uk-line px-3 text-sm font-medium text-uk-body hover:bg-uk-surface-2 hover:text-uk-heading">
                  <ExternalLink className="h-3.5 w-3.5" /> Open
                </a>
                <a href={`${resumeHref}?download=1`} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-uk-line px-3 text-sm font-medium text-uk-body hover:bg-uk-surface-2 hover:text-uk-heading">
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
              </span>
            </Row>
            <Row label="Cover letter">
              {/* whitespace-pre-wrap keeps the applicant's line breaks; React escapes the text */}
              {app.coverLetter ? <p className="whitespace-pre-wrap">{app.coverLetter}</p> : <span className="text-uk-muted">—</span>}
            </Row>
            <Row label="Emails">
              <span className="flex flex-wrap gap-x-5 gap-y-1 text-uk-body">
                <EmailStatus label="To HR" sent={app.emails?.hr} />
                <EmailStatus label="Thank-you to applicant" sent={app.emails?.applicant} />
              </span>
            </Row>
          </dl>
        </section>

        <ApplicationForm id={app.id} name={app.name} initial={{ status: app.status, note: app.note }} />

        <Link
          href="/admin/applications"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
        >
          <ArrowLeft className="h-4 w-4" /> Back to applications
        </Link>
      </div>
    </>
  );
}
