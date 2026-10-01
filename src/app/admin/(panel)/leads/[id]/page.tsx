import Link from "@/components/site/intent-link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { getLead, leadStatusLabel } from "@/lib/leads-store";
import { formatLeadDate, sourceLabel, StatusBadge } from "../lead-ui";
import { LeadForm } from "../lead-form";

export const metadata = { title: "Lead" };
export const dynamic = "force-dynamic";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-uk-line py-3 last:border-0 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-sm font-medium text-uk-muted">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-uk-heading">{children}</dd>
    </div>
  );
}

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) notFound();

  return (
    <>
      <PageHeader
        title={lead.name}
        crumbs={[{ label: "Leads", href: "/admin/leads" }, { label: "Enquiry" }]}
        description={`Received ${formatLeadDate(lead.createdAt)} · ${sourceLabel(lead.source)}`}
        action={<StatusBadge status={lead.status} label={leadStatusLabel[lead.status]} />}
      />

      <div className="space-y-6">
        <section className="rounded-2xl border border-uk-line bg-uk-card p-6">
          <h2 className="font-heading text-lg font-semibold text-uk-heading">Enquiry</h2>
          <dl className="mt-3">
            <Row label="Name">{lead.name}</Row>
            <Row label="Email">
              <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 text-uk-blue hover:underline">
                <Mail className="h-3.5 w-3.5" /> {lead.email}
              </a>
            </Row>
            <Row label="Mobile">
              {lead.phone ? (
                <a href={`tel:${lead.phone.replace(/\s+/g, "")}`} className="inline-flex items-center gap-1.5 text-uk-blue hover:underline">
                  <Phone className="h-3.5 w-3.5" /> {lead.phone}
                </a>
              ) : (
                <span className="text-uk-muted">—</span>
              )}
            </Row>
            <Row label="Company">{lead.company || <span className="text-uk-muted">—</span>}</Row>
            <Row label="Service">{lead.service || <span className="text-uk-muted">—</span>}</Row>
            <Row label="Budget">{lead.budget || <span className="text-uk-muted">—</span>}</Row>
            <Row label="Message">
              {/* whitespace-pre-wrap keeps the visitor's line breaks; React escapes the text */}
              <p className="whitespace-pre-wrap">{lead.message}</p>
            </Row>
          </dl>
        </section>

        <LeadForm id={lead.id} name={lead.name} initial={{ status: lead.status, note: lead.note }} />

        <Link
          href="/admin/leads"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
        >
          <ArrowLeft className="h-4 w-4" /> Back to leads
        </Link>
      </div>
    </>
  );
}
