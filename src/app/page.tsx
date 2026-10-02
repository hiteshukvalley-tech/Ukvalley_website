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
import { getHomePage } from "@/lib/home-store";
import { Marked } from "@/components/site/marked";
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

// Every section's text is edited in Admin → Home page; a section switched
// off there is left out here. The cards inside sections (services, products,
// case studies…) come from their own admin areas.
export default async function Home() {
  const [settings, faqs, { content: c, visible: show }] = await Promise.all([
    getSiteSettings(),
    getFaqs(),
    getHomePage(),
  ]);
  const organizationSchema = buildOrganizationSchema(settings);
  const faqSchema = buildFaqSchema(faqs);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(organizationSchema) }}
      />
      {show.faq && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }}
        />
      )}
      <ScrollProgress />
      <Header />
      <main id="main">
        <Hero content={c.hero} />
        {show.trust && <TrustMarquee content={c.trust} />}
        {show.explore && (
          <>
            <ExploreBlobs content={c.explore} />
            <SectionDivider variant="circuit" className="bg-white dark:bg-uk-card py-6" />
          </>
        )}
        {show.services && <Services content={c.services} />}
        {show.why && <WhyChoose content={c.why} />}
        {show.numbers && <ByTheNumbers content={c.numbers} />}
        {show.products && (
          <>
            <Products content={c.products} />
            <SectionDivider variant="circuit" className="bg-uk-surface-2 py-6" />
          </>
        )}
        {show.caseStudies && <CaseStudies content={c.caseStudies} />}
        {show.industries && (
          <Industries
            industries={await getIndustries()}
            eyebrow={c.industries.eyebrow}
            title={<Marked text={c.industries.title} />}
            description={c.industries.description}
          />
        )}
        {show.process && <Process steps={await getProcessSteps()} content={c.process} />}
        {show.engagement && <Engagement content={c.engagement} />}
        {show.tech && <TechStack categories={await getTechStack()} content={c.tech} />}
        {show.testimonials && <Testimonials content={c.testimonials} />}
        {show.insights && <Insights content={c.insights} />}
        {show.faq && <Faq content={c.faq} />}
        {show.cta && <CtaBand content={c.cta} />}
      </main>
      <Footer />
    </>
  );
}