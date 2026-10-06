import { Fragment, type ReactNode } from "react";
import { SITE_URL } from "@/lib/site-origin";
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
import { CustomSection } from "@/components/site/custom-section";
import { isHomeSectionKey, type HomeSectionKey } from "@/lib/home-schema";
import { jsonLd } from "@/lib/utils";
import { ukText } from "@/lib/texts";

// Re-render at least once a minute so admin text overrides always show up.
export const revalidate = 60;

export const metadata: Metadata = {
  alternates: { canonical: `${SITE_URL}` },
};

const buildOrganizationSchema = (company: Awaited<ReturnType<typeof getSiteSettings>>) => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: company.name,
  url: `${SITE_URL}`,
  logo: `${SITE_URL}/brand/ukvalley-logo.png`,
  foundingDate: String(company.foundedYear),
  description:
    "Custom software development company in India. Web, mobile, CRM, ERP, HRMS, cloud and cybersecurity services.",
  email: company.email,
  ...((company.sales.phone || company.phonePrimary) ? { telephone: company.sales.phone || company.phonePrimary } : {}),
  // The Nashik head office, as on the Contact page (offices in site-data.ts
  // and its LocalBusiness schema).
  address: {
    "@type": "PostalAddress",
    streetAddress: "Plot No 10, Near Samraat Nucleus, Dr. Homi Bhabha Nagar, Mumbai Naka",
    addressLocality: "Nashik",
    addressRegion: "Maharashtra",
    addressCountry: "IN",
  },
  sameAs: Object.values(company.social).map((u) => u.trim()).filter(Boolean),
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
// off there is left out here, and the sections show in the order set there
// (the hero stays on top). The cards inside sections (services, products,
// case studies…) come from their own admin areas. Sections the admin added
// ("custom-…") render with <CustomSection>.
export default async function Home() {
  const [settings, faqs, { content: c, visible: show, order, custom }, industries, processSteps, techCategories] =
    await Promise.all([getSiteSettings(), getFaqs(), getHomePage(), getIndustries(), getProcessSteps(), getTechStack()]);
  const organizationSchema = buildOrganizationSchema(settings);
  const faqSchema = buildFaqSchema(faqs);

  const builtIn: Record<HomeSectionKey, ReactNode> = {
    hero: <Hero content={c.hero} />,
    trust: <TrustMarquee content={c.trust} />,
    explore: (
      <>
        <ExploreBlobs content={c.explore} />
        <SectionDivider variant="circuit" className="bg-white dark:bg-uk-card py-6" />
      </>
    ),
    services: <Services content={c.services} />,
    why: <WhyChoose content={c.why} />,
    numbers: <ByTheNumbers content={c.numbers} />,
    products: (
      <>
        <Products content={c.products} />
        <SectionDivider variant="circuit" className="bg-uk-surface-2 py-6" />
      </>
    ),
    caseStudies: <CaseStudies content={c.caseStudies} />,
    industries: (
      <Industries
        industries={industries}
        eyebrow={ukText(c.industries.eyebrow)}
        title={<Marked text={ukText(c.industries.title)} />}
        description={ukText(c.industries.description)}
        labels={c.industries}
      />
    ),
    process: <Process steps={processSteps} content={c.process} />,
    engagement: <Engagement content={c.engagement} />,
    tech: <TechStack categories={techCategories} content={c.tech} />,
    testimonials: <Testimonials content={c.testimonials} />,
    insights: <Insights content={c.insights} />,
    faq: <Faq content={c.faq} />,
    cta: <CtaBand content={c.cta} />,
  };

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
        {order.map((id) => {
          if (isHomeSectionKey(id)) return show[id] ? <Fragment key={id}>{ukText(builtIn[id])}</Fragment> : null;
          const section = custom.find((x) => x.id === id);
          return section?.visible ? <CustomSection key={id} id={id} content={section.values} /> : null;
        })}
      </main>
      <Footer />
    </>
  );
}
