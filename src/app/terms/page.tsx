import type { Metadata } from "next";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern use of the Ukvalley Technologies website and the basis on which project engagements are proposed.",
  alternates: { canonical: "https://ukvalley.com/terms" },
};

const sections = [
  {
    h: "Use of this website",
    p: "You may use this website for personal, non-commercial research and to evaluate whether to engage our services. You may not scrape, copy or re-use its content commercially, or attempt to disrupt or compromise the site or its infrastructure. All site content is owned by or licensed to Ukvalley Technologies.",
  },
  {
    h: "Estimates & proposals",
    p: "Rough estimates provided after a scoping call are indicative only and not a binding offer. A fixed proposal, when issued, is valid for the period stated in it. Any engagement is governed by a separate signed agreement that takes precedence over anything on this website.",
  },
  {
    h: "Engagements",
    p: "Project engagements are governed by a signed agreement that defines scope, fees, timeline, IP assignment and a 24-hour response SLA. Where this website and that agreement differ, the signed agreement controls. Code ownership, NDA and IP terms are set out in that agreement.",
  },
  {
    h: "Intellectual property",
    p: "Site content, branding and the Ukvalley name are our property. Client deliverables are owned by the client per the terms of their signed engagement agreement — including, by default, full source-code ownership from day one. Our own product names referenced on the site are our IP.",
  },
  {
    h: "No warranty",
    p: "This website is provided 'as is' without warranty of any kind. We do not guarantee that the site will be uninterrupted or error-free. To the extent permitted by law, we exclude liability for indirect or consequential loss arising from use of the site.",
  },
  {
    h: "Governing law",
    p: "These terms are governed by the laws of India. Any disputes will be subject to the exclusive jurisdiction of the courts in Maharashtra, India, unless your signed engagement agreement states otherwise.",
  },
];

// The date this text last changed — update it with every edit (it used to
// print the build date, which changed on every deploy).
const LAST_UPDATED = "1 October 2026";

export default async function TermsPage() {
  const company = await getSiteSettings();
  return (
    <>
      <ScrollProgress />
      <Header />
      <main id="main">
        <PageHero variant="company"
          eyebrow="Legal"
          crumbs={[{ label: "Home", href: "/" }, { label: "Terms of Service" }]}
          title="Terms of Service"
          description="The terms that govern use of this website. Project engagements are governed by a separate signed agreement that takes precedence."
        />

        <section className="relative bg-uk-surface-2 section-py">
          <Container className="max-w-5xl">
            <Reveal className="flex flex-col gap-8">
              <p className="text-sm text-uk-gray">
                Last updated: {LAST_UPDATED}
              </p>
              {sections.map((s) => (
                <div key={s.h} className="flex flex-col gap-3">
                  <h2 className="font-heading text-xl font-bold text-uk-heading">{s.h}</h2>
                  <p className="text-justify-prose leading-relaxed text-uk-body">{s.p}</p>
                </div>
              ))}
              <div className="rounded-2xl border border-uk-line bg-uk-card p-6 text-sm text-uk-gray">
                <p className="font-semibold text-uk-heading">Questions about these terms?</p>
                <p className="mt-1">
                  Email <a href={`mailto:${company.email}`} className="text-uk-blue hover:text-uk-blue-bright">{company.email}</a>.
                </p>
              </div>
            </Reveal>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}