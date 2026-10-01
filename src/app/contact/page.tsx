import type { Metadata } from "next";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { ContactForm } from "@/components/site/contact-form";
import { offices } from "@/lib/site-data";
import { getSiteSettings } from "@/lib/settings";
import { jsonLd } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact Ukvalley — book a free 30-minute scoping call",
  description:
    "Talk to a software architect, not a sales bot. Reply within 1 business hour, a rough estimate in 3 days, a fixed proposal in 7. Offices in Nashik, India and Jersey City, USA.",
  alternates: { canonical: "https://ukvalley.com/contact" },
};

const buildSchema = (company: Awaited<ReturnType<typeof getSiteSettings>>) => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: company.name,
  url: "https://ukvalley.com",
  email: company.email,
  telephone: company.phonePrimary,
  address: [
    {
      "@type": "PostalAddress",
      streetAddress: "Plot No 10, Near Samraat Nucleus, Dr. Homi Bhabha Nagar, Mumbai Naka",
      addressLocality: "Nashik",
      addressRegion: "Maharashtra",
      addressCountry: "IN",
    },
    {
      "@type": "PostalAddress",
      streetAddress: "413 Summit Ave, Apt 1503",
      addressLocality: "Jersey City",
      addressRegion: "NJ",
      postalCode: "07306",
      addressCountry: "US",
    },
  ],
});

export default async function ContactPage() {
  const company = await getSiteSettings();
  const localBusinessSchema = buildSchema(company);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(localBusinessSchema) }}
      />
      <ScrollProgress />
      <Header />
      <main id="main">
        <PageHero variant="company"
          eyebrow="Contact"
          crumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]}
          title={
            <>
              Talk to a software architect —{" "}
              <span className="text-gradient-blue">not a sales bot.</span>
            </>
          }
          description="A free 30-minute scoping call. Within 1 business hour you'll get a reply. A rough estimate in 3 days, a fixed proposal in 7. No charge, no obligation."
        />

        <section className="relative bg-uk-surface-2 section-py">
          <Container>
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              {/* Form card — top edge on the same line as What happens next */}
              <Reveal className="flex">
                <div className="flex w-full flex-col rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-8">
                  <h2 className="font-heading text-2xl font-bold text-uk-heading">
                    Tell us about your project
                  </h2>
                  <p className="mt-2 text-sm text-uk-gray">
                    Share a few details and an architect will reply within one
                    business hour. We never share your details.
                  </p>
                  <div className="mt-6 flex-1">
                    <ContactForm email={company.email} phone={company.phonePrimary} />
                  </div>
                </div>
              </Reveal>

              {/* Sidebar */}
              <Reveal className="flex flex-col gap-5">
                {/* What happens next — same card colour as the cards below */}
                <div className="flex flex-1 flex-col rounded-2xl border border-uk-line bg-uk-card p-6 card-hover">
                  <h3 className="font-heading text-lg font-bold text-uk-heading">
                    What happens next
                  </h3>
                  <ol className="mt-4 flex flex-1 flex-col justify-center gap-4">
                    {[
                      { t: "1 business hour", d: "A real reply from an architect, not an autoresponder." },
                      { t: "3 business days", d: "A written rough estimate based on your scope." },
                      { t: "7 days", d: "A fixed proposal with timeline and price." },
                    ].map((s) => (
                      <li key={s.t} className="flex items-start gap-3">
                        <Clock className="mt-0.5 h-5 w-5 flex-none text-uk-blue" />
                        <div>
                          <p className="font-semibold text-uk-heading">{s.t}</p>
                          <p className="text-sm text-uk-gray">{s.d}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Direct contact */}
                <div className="flex flex-1 flex-col rounded-2xl border border-uk-line bg-uk-card p-6 card-hover">
                  <h3 className="font-heading text-lg font-bold text-uk-heading">
                    Reach us directly
                  </h3>
                  <div className="mt-4 flex flex-1 flex-col justify-center gap-5 text-sm">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-uk-blue">
                        HR team
                      </p>
                      <ul className="mt-2 flex flex-col gap-2">
                        <li>
                          <a href={`tel:${company.hr.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 text-uk-body transition-colors hover:text-uk-blue-bright">
                            <Phone className="h-4 w-4 text-uk-blue" />
                            {company.hr.phone}
                          </a>
                        </li>
                        <li>
                          <a href={`mailto:${company.hr.email}`} className="flex items-center gap-3 text-uk-body transition-colors hover:text-uk-blue-bright">
                            <Mail className="h-4 w-4 text-uk-blue" />
                            {company.hr.email}
                          </a>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-uk-blue">
                        Sales team
                      </p>
                      <ul className="mt-2 flex flex-col gap-2">
                        <li>
                          <a href={`tel:${company.sales.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 text-uk-body transition-colors hover:text-uk-blue-bright">
                            <Phone className="h-4 w-4 text-uk-blue" />
                            {company.sales.phone}
                          </a>
                        </li>
                        <li>
                          <a href={`mailto:${company.sales.email}`} className="flex items-center gap-3 text-uk-body transition-colors hover:text-uk-blue-bright">
                            <Mail className="h-4 w-4 text-uk-blue" />
                            {company.sales.email}
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Offices */}
                <div className="flex flex-1 flex-col rounded-2xl border border-uk-line bg-uk-card p-6 card-hover">
                  <h3 className="font-heading text-lg font-bold text-uk-heading">Our Offices</h3>
                  <ul className="mt-4 flex flex-1 flex-col justify-center gap-5 text-sm">
                    {offices.map((o) => (
                      <li key={o.country} className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-4 w-4 flex-none text-uk-blue" />
                        <address className="not-italic">
                          <p className="font-semibold text-uk-heading">{o.country}</p>
                          <p className="mt-1 text-uk-gray">
                            {o.lines.map((line, i) => (
                              <span key={i} className="block">{line}</span>
                            ))}
                          </p>
                        </address>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}