import type { Metadata } from "next";
import { Header } from "@/components/site/header";
import { Hero } from "@/components/site/hero";
import { TrustMarquee } from "@/components/site/trust-marquee";
import { Services } from "@/components/site/services";
import { WhyChoose } from "@/components/site/why-choose";
import { Products } from "@/components/site/products";
import { CaseStudies } from "@/components/site/case-studies";
import { Industries } from "@/components/site/industries";
import { Process } from "@/components/site/process";
import { Engagement } from "@/components/site/engagement";
import { TechStack } from "@/components/site/tech-stack";
import { Testimonials } from "@/components/site/testimonials";
import { Insights } from "@/components/site/insights";
import { Faq } from "@/components/site/faq";
import { CtaBand } from "@/components/site/cta";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { SectionDivider } from "@/components/site/section-divider";
import { ExploreBlobs } from "@/components/site/explore-blobs";
import { ByTheNumbers } from "@/components/site/by-the-numbers";
import { getFaqs } from "@/lib/faqs-store";
import { getProcessSteps } from "@/lib/process-store";
import { getTechStack } from "@/lib/tech-stack-store";
import { getSiteSettings } from "@/lib/settings";
import { getIndustries } from "@/lib/industries-store";
import { jsonLd } from "@/lib/utils";

export const metadata: Metadata = {
  alternates: { canonical: "https://ukvalley.com" },
};

const buildOrganizationSchema = (company: Awaited<ReturnType<typeof getSiteSettings>>) => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: company.name,
  url: "https://ukvalley.com",
  foundingDate: String(company.foundedYear),
  description:
    "Custom software development company in India. Web, mobile, CRM, ERP, HRMS, cloud and cybersecurity services.",
  email: company.email,
  address: {
    "@type": "PostalAddress",
    addressCountry: "IN",
  },
  sameAs: Object.values(company.social).filter(Boolean),
});

const buildFaqSchema = (faqs: Awaited<ReturnType<typeof getFaqs>>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
});

export default async function Home() {
  const organizationSchema = buildOrganizationSchema(await getSiteSettings());
  const faqSchema = buildFaqSchema(await getFaqs());
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }}
      />
      <ScrollProgress />
      <Header />
      <main id="main">
        <Hero />
        <TrustMarquee />
        <ExploreBlobs />
        <SectionDivider variant="circuit" className="bg-white dark:bg-uk-card py-6" />
        <Services />
        <WhyChoose />
        <ByTheNumbers limit={4} />
        <Products />
        <SectionDivider variant="circuit" className="bg-uk-surface-2 py-6" />
        <CaseStudies />
        <Industries industries={await getIndustries()} />
        <Process steps={await getProcessSteps()} />
        <Engagement />
        <TechStack categories={await getTechStack()} />
        <Testimonials />
        <Insights />
        <Faq />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}