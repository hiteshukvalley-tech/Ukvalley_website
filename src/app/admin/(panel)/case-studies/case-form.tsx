"use client";

import Link from "@/components/site/intent-link";
import { useActionState } from "react";
import { Loader2, Save } from "lucide-react";
import { FormCheckbox, FormField, FormSection, FormTextarea } from "@/components/admin/form";
import type { CaseValues } from "@/lib/cases-validation";
import { createCaseAction, updateCaseAction, type CaseFormState } from "./actions";
import { useResultToast } from "@/components/admin/toast";
import { TeamMembersInput } from "./team-members-input";

export function CaseForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial: CaseValues;
}) {
  const [state, action, saving] = useActionState<CaseFormState, FormData>(
    mode === "create" ? createCaseAction : updateCaseAction.bind(null, initial.slug),
    {}
  );
  const values = state.values ?? initial;
  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  useResultToast(state);

  return (
    // key remounts the inputs so defaultValues refresh after each result
    <form action={action} key={state.nonce ?? "initial"} className="space-y-6" noValidate>

      <FormSection title="Overview" description="Shown on the case-study cards and at the top of the page.">
        <FormField
          label="Title"
          name="title"
          required
          full
          maxLength={140}
          placeholder="e.g. Loan origination platform for an NBFC"
          defaultValue={values.title}
          error={errors.title}
          hint="A short headline naming what was built and for whom. Up to 140 characters."
        />
        <FormField
          label="Slug"
          name="slug"
          slugFrom="title"
          required
          readOnly={mode === "edit"}
          maxLength={80}
          placeholder="loan-origination-nbfc"
          defaultValue={values.slug}
          error={errors.slug}
          hint={
            mode === "edit"
              ? "The slug can't be changed after creation."
              : "The web address of this page: /case-studies/<slug>. Filled in from the title as you type; lowercase letters, numbers and hyphens only."
          }
        />
        <FormField
          label="Client"
          name="client"
          required
          maxLength={120}
          placeholder="e.g. A Tier-1 Indian NBFC"
          defaultValue={values.client}
          error={errors.client}
          hint="Who the work was for. An anonymised description is fine."
        />
        <FormField
          label="Sector"
          name="sector"
          required
          maxLength={60}
          placeholder="e.g. FinTech"
          defaultValue={values.sector}
          error={errors.sector}
          hint="One or two words. Case studies in the same sector are shown as related."
        />
        <FormField
          label="Timeline"
          name="timeline"
          required
          maxLength={60}
          placeholder="e.g. 14 weeks"
          defaultValue={values.timeline}
          error={errors.timeline}
          hint="How long the project took, written as you want it shown."
        />
        <div className="space-y-2">
          <TeamMembersInput
            initialMembers={values.teamMembers.split(/\r?\n/).filter(Boolean)}
            legacyTeam={values.team}
            error={errors.team}
          />
        </div>
        <FormTextarea
          label="Problem"
          name="problem"
          required
          full
          rows={3}
          maxLength={600}
          placeholder="e.g. Loan applications were processed by hand across three spreadsheets, so approvals took 9 days and 1 in 5 files had missing documents."
          defaultValue={values.problem}
          error={errors.problem}
          hint="The situation before we started, in one or two sentences. Shown on the case-study card."
        />
        <FormTextarea
          label="Result"
          name="result"
          required
          full
          rows={3}
          maxLength={600}
          placeholder="e.g. A digital origination platform that cut approval time from 9 days to 2 and removed manual data entry."
          defaultValue={values.result}
          error={errors.result}
          hint="What was delivered and the outcome, in one or two sentences. Also used as the search-result description."
        />
      </FormSection>

      <FormSection title="Results at a glance" description="The headline numbers and the measured outcomes.">
        <FormTextarea
          label="Metrics"
          name="metrics"
          required
          full
          rows={4}
          placeholder={"78% | Faster loan approvals\n3x | More applications handled per agent"}
          defaultValue={values.metrics}
          error={errors.metrics}
          hint="Big numbers shown as tiles. One per line, written as value | label, with a | between them. Up to 6 lines; the value up to 20 characters, the label up to 60."
          example={"65% | Faster processing\n4x | More leads converted\n₹12L | Saved every year"}
        />
        <FormTextarea
          label="Measured results"
          name="results"
          required
          full
          rows={5}
          placeholder={"Approval time fell from 9 days to 2 days.\nManual data entry was removed for 90% of applications."}
          defaultValue={values.results}
          error={errors.results}
          hint="The proof, one full sentence per line. Up to 10 lines, each up to 400 characters."
          example={"Approval time fell from 9 days to 2 days.\nMissing-document rejections dropped by 70%."}
        />
      </FormSection>

      <FormSection title="The story" description="The detail on the case-study page, from the sector to what was built.">
        <FormTextarea
          label="Industry context"
          name="industryContext"
          required
          full
          rows={4}
          maxLength={1500}
          placeholder="e.g. NBFCs compete on turnaround time, but most still rely on branch staff re-keying documents and compliance rules change every quarter."
          defaultValue={values.industryContext}
          error={errors.industryContext}
          hint="The sector reality this project sat inside: what the industry is like and why the problem is common. A short paragraph."
        />
        <FormTextarea
          label="Challenges"
          name="challenges"
          required
          full
          rows={5}
          placeholder={"Applications arrived by email, WhatsApp and paper.\nNo single view of where each file was stuck."}
          defaultValue={values.challenges}
          error={errors.challenges}
          hint="The pain points found on day one. One per line, up to 10 lines, each up to 400 characters."
          example={"Documents were collected over email and WhatsApp.\nCredit checks were run by hand."}
        />
        <FormTextarea
          label="Approach"
          name="approach"
          required
          full
          rows={5}
          placeholder={"Mapped the full loan journey with the credit and ops teams.\nShipped the application portal first, then the approval workflow."}
          defaultValue={values.approach}
          error={errors.approach}
          hint="How we worked, step by step in order. One step per line, up to 10 lines, each up to 400 characters."
          example={"Week 1–2: process mapping and a clickable prototype.\nWeek 3–8: build in two-week releases.\nWeek 9–14: pilot with two branches, then roll out."}
        />
        <FormTextarea
          label="Solution"
          name="solution"
          required
          full
          rows={5}
          maxLength={2000}
          placeholder="e.g. A web platform where customers apply online, documents are checked automatically and credit officers approve from one dashboard."
          defaultValue={values.solution}
          error={errors.solution}
          hint="What was actually built, in plain language. A short paragraph; the individual parts go in Modules below."
        />
        <FormTextarea
          label="Modules"
          name="modules"
          required
          full
          rows={6}
          placeholder={"Online application | Customers apply and upload documents from any device\nKYC checks | Aadhaar and PAN verified automatically"}
          defaultValue={values.modules}
          error={errors.modules}
          hint="The parts of the system we built. One module per line, written as title | description, with a | between them. Up to 20 lines; the title up to 80 characters, the description up to 300."
          example={"KYC | Aadhaar and PAN checks\nCredit scoring | Pulls bureau data and scores each applicant\nDashboard | One view of every application and its stage"}
        />
      </FormSection>

      <FormSection title="Technology" description="What it was built with and what it connects to.">
        <FormTextarea
          label="Stack"
          name="stack"
          required
          full
          rows={2}
          placeholder="Next.js, Node.js, PostgreSQL, AWS"
          defaultValue={values.stack}
          error={errors.stack}
          hint="The technologies used, separated by commas (or one per line). Up to 20, each up to 40 characters."
        />
        <FormTextarea
          label="Integrations"
          name="integrations"
          full
          rows={3}
          placeholder={"Razorpay\nCIBIL\nWhatsApp Business API"}
          defaultValue={values.integrations}
          error={errors.integrations}
          hint="Optional. Outside systems it connects to, one per line. Up to 20, each up to 80 characters. Leave empty if none."
        />
      </FormSection>

      <FormSection title="Client testimonial" description="A short quote from the client. The name and role can be anonymised.">
        <FormTextarea
          label="Quote"
          name="quote"
          required
          full
          rows={3}
          maxLength={800}
          placeholder="e.g. Ukvalley understood our process better than we did. We went live in 14 weeks and haven't looked back."
          defaultValue={values.quote}
          error={errors.quote}
          hint="What the client said, in their words. Don't add quotation marks; they are added for you."
        />
        <FormField
          label="Name"
          name="quoteName"
          required
          maxLength={80}
          placeholder="e.g. Head of Operations"
          defaultValue={values.quoteName}
          error={errors.quoteName}
          hint="The person's name, or a title such as “Head of Operations” if they prefer to stay anonymous."
        />
        <FormField
          label="Role"
          name="quoteRole"
          required
          maxLength={120}
          placeholder="e.g. CTO, SaaS platform"
          defaultValue={values.quoteRole}
          error={errors.quoteRole}
          hint="Their position and company type."
        />
      </FormSection>

      <FormSection title="Visibility">
        <FormCheckbox label="Published" name="published" defaultChecked={values.published === "on"} hint="Untick to hide it from the live site (draft)." full />
      </FormSection>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-uk-line bg-uk-card/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <Link
          href="/admin/case-studies"
          className="inline-flex h-10 items-center rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
        >
          Back to case studies
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="btn-sheen inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-5 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : mode === "create" ? "Create case study" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
