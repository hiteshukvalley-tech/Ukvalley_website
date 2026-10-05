import type { Metadata } from "next";
import { editableMetadata } from "@/lib/page-metadata";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { EditableHero, PageBlocks } from "@/components/site/page-extras";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { getSiteSettings } from "@/lib/settings";
import { ukText } from "@/lib/texts";

// Re-render at least once a minute so admin text overrides always show up.
export const revalidate = 60;

// Title and description can be replaced in Admin → Page text (SEO fields).
export const generateMetadata = () => editableMetadata("privacy", baseMetadata);
const baseMetadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Ukvalley Technologies collects, uses and protects personal data submitted through our website and enquiry forms.",
  alternates: { canonical: "https://ukvalley.com/privacy" },
};

const sections = [
  {
    h: "What we collect",
    p: "We collect the information you voluntarily submit through our contact and enquiry forms — name, work email, company, phone number, and the details of your project enquiry. We also collect basic, non-identifying analytics about how the site is used (pages visited, referring URL, approximate region).",
  },
  {
    h: "How we use it",
    p: "We use the information you submit to respond to your enquiry, prepare estimates and proposals, and — where you have engaged us — deliver and support your project. We never sell your data to third parties, and we do not use it for unrelated marketing without your consent.",
  },
  {
    h: "Legal basis & retention",
    p: "We process enquiry data on the basis of your consent and our legitimate interest in responding to it. We retain enquiry data for as long as needed to respond and for a reasonable period thereafter to maintain a record of correspondence, then delete it on request. Project data is retained per the terms of your engagement agreement.",
  },
  {
    h: "Sharing & subprocessors",
    p: "We share data only with trusted third parties who help us operate (for example, email and analytics providers) under appropriate data-protection terms, and only to the extent necessary. We do not disclose enquiry data to any other third party without your consent unless required by law.",
  },
  {
    h: "Your rights",
    p: "You may request access to, correction of, or deletion of the personal data you have submitted to us, and you may opt out of further contact at any time. To exercise any of these rights, email us at the address below and we will respond within a reasonable period.",
  },
  {
    h: "Security",
    p: "We take reasonable technical and organizational measures to protect your data, including access controls, encryption in transit and secure infrastructure. No method of transmission or storage is perfectly secure, but we work to protect your information consistent with industry practice.",
  },
];

// The date this text last changed — update it with every edit (it used to
// print the build date, which changed on every deploy).
const LAST_UPDATED = "1 October 2026";

export default async function PrivacyPage() {
  const company = await getSiteSettings();
  return (
    <>
      <ScrollProgress />
      <Header />
      <main id="main">
        <EditableHero pageKey="privacy" variant="company"
          eyebrow={ukText("Legal")}
          crumbs={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]}
          title={ukText("Privacy Policy")}
          description={ukText("How we handle the information you share with us.")}
        />

        <section className="relative bg-uk-surface-2 section-py">
          <Container className="max-w-5xl">
            <Reveal className="flex flex-col gap-8">
              <p className="text-sm text-uk-gray">{ukText("Last updated: ")}{ukText(LAST_UPDATED)}
              </p>
              {sections.map((s) => (
                <div key={s.h} className="flex flex-col gap-3">
                  <h2 className="font-heading text-xl font-bold text-uk-heading">{ukText(s.h)}</h2>
                  <p className="text-justify-prose leading-relaxed text-uk-body">{ukText(s.p)}</p>
                </div>
              ))}
              <div className="rounded-2xl border border-uk-line bg-uk-card p-6 text-sm text-uk-gray">
                <p className="font-semibold text-uk-heading">{ukText("Questions about privacy?")}</p>
                <p className="mt-1">{ukText("Email ")}<a href={ukText(`mailto:${company.email}`)} className="text-uk-blue hover:text-uk-blue-bright">{ukText(company.email)}</a>{ukText("and we'll get back to you.")}</p>
              </div>
            </Reveal>
          </Container>
        </section>
        <PageBlocks pageKey="privacy" />
      </main>
      <Footer />
    </>
  );
}