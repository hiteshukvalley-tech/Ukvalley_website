import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site-origin";
import { editableMetadata } from "@/lib/page-metadata";
import { ArrowDown, Phone, Mail, MapPin, Clock } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { EditableHero, PageBlocks } from "@/components/site/page-extras";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { ContactForm } from "@/components/site/contact-form";
import { offices } from "@/lib/site-data";
import { getSiteSettings } from "@/lib/settings";
import { jsonLd } from "@/lib/utils";
import { ukText } from "@/lib/texts";

// Re-render at least once a minute so admin text overrides always show up.
export const revalidate = 60;

// Title and description can be replaced in Admin → Page text (SEO fields).
export const generateMetadata = () => editableMetadata("contact", baseMetadata);
const baseMetadata: Metadata = {
  title: "Contact us — book a free 30-minute scoping call",
  description:
    "Talk to a software architect, not a sales bot. A reply within one business day, a rough estimate in 3 days, a fixed proposal in 7. Offices in Nashik, India and Jersey City, USA.",
  alternates: { canonical: `${SITE_URL}/contact` },
};

const buildSchema = (company: Awaited<ReturnType<typeof getSiteSettings>>) => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: company.name,
  url: `${SITE_URL}`,
  email: company.email,
  telephone: company.sales.phone || company.phonePrimary,
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
        <EditableHero pageKey="contact" variant="company"
          eyebrow={ukText("Contact")}
          crumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]}
          title={
            <>{ukText("Talk to a software architect —")}{" "}
              <span className="text-gradient-blue">{ukText("not a sales bot.")}</span>
            </>
          }
          description={ukText("A free 30-minute scoping call. You'll get a reply within one business day — on average in under 4 hours. A rough estimate in 3 days, a fixed proposal in 7. No charge, no obligation.")}
        >
          {/* The form sits below the hero artwork: give visitors a way to act straight away. */}
          <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <a
              href="#enquiry"
              className="btn-sheen btn-lift group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-uk-blue px-6 text-sm font-semibold text-white shadow-glow-blue-sm hover:bg-uk-blue-bright sm:w-auto"
            >
              {ukText("Fill in the enquiry form")}
              <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
            </a>
            {company.sales.phone && (
              <a
                href={ukText(`tel:${company.sales.phone.replace(/s/g, "")}`)}
                className="btn-lift inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-uk-line bg-white/80 px-6 text-sm font-semibold text-uk-heading backdrop-blur hover:border-uk-blue/50 hover:text-uk-blue-bright dark:bg-uk-card/80 sm:w-auto"
              >
                <Phone className="h-4 w-4 text-uk-blue" />
                {ukText("Call Sales")} {ukText(company.sales.phone)}
              </a>
            )}
          </div>
        </EditableHero>

        <section id="enquiry" className="relative scroll-mt-24 bg-uk-surface-2 section-py">
          <Container>
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              {/* Form card — top edge on the same line as What happens next */}
              <Reveal className="flex">
                <div className="flex w-full flex-col rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-8">
                  <h2 className="font-heading text-2xl font-bold text-uk-heading">{ukText("Tell us about your project")}</h2>
                  <p className="mt-2 text-sm text-uk-gray">{ukText("Share a few details and an architect will reply within one business day. We never share your details.")}</p>
                  <div className="mt-6 flex-1">
                    <ContactForm email={company.email} phone={company.sales.phone || company.phonePrimary} />
                  </div>
                </div>
              </Reveal>

              {/* Sidebar */}
              <Reveal className="flex flex-col gap-5">
                {/* What happens next — same card colour as the cards below */}
                <div className="flex flex-1 flex-col rounded-2xl border border-uk-line bg-uk-card p-6 card-hover">
                  <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText("What happens next")}</h3>
                  <ol className="mt-4 flex flex-1 flex-col justify-center gap-4">
                    {[
                      { t: "1 business day", d: "A real reply from an architect, not an autoresponder — on average in under 4 hours." },
                      { t: "3 business days", d: "A written rough estimate based on your scope." },
                      { t: "7 days", d: "A fixed proposal with timeline and price." },
                    ].map((s) => (
                      <li key={s.t} className="flex items-start gap-3">
                        <Clock className="mt-0.5 h-5 w-5 flex-none text-uk-blue" />
                        <div>
                          <p className="font-semibold text-uk-heading">{ukText(s.t)}</p>
                          <p className="text-sm text-uk-gray">{ukText(s.d)}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Direct contact */}
                <div className="flex flex-1 flex-col rounded-2xl border border-uk-line bg-uk-card p-6 card-hover">
                  <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText("Reach us directly")}</h3>
                  <div className="mt-4 flex flex-1 flex-col justify-center gap-5 text-sm">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-uk-blue">{ukText("Sales team")}</p>
                      <ul className="mt-2 flex flex-col gap-2">
                        <li>
                          <a href={ukText(`tel:${company.sales.phone.replace(/\s/g, "")}`)} className="flex items-center gap-3 text-uk-body transition-colors hover:text-uk-blue-bright">
                            <Phone className="h-4 w-4 text-uk-blue" />
                            {ukText(company.sales.phone)}
                          </a>
                        </li>
                        <li>
                          <a href={ukText(`mailto:${company.sales.email}`)} className="flex items-center gap-3 text-uk-body transition-colors hover:text-uk-blue-bright">
                            <Mail className="h-4 w-4 text-uk-blue" />
                            {ukText(company.sales.email)}
                          </a>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-uk-blue">{ukText("Careers (HR)")}</p>
                      <ul className="mt-2 flex flex-col gap-2">
                        <li>
                          <a href={ukText(`tel:${company.hr.phone.replace(/\s/g, "")}`)} className="flex items-center gap-3 text-uk-body transition-colors hover:text-uk-blue-bright">
                            <Phone className="h-4 w-4 text-uk-blue" />
                            {ukText(company.hr.phone)}
                          </a>
                        </li>
                        <li>
                          <a href={ukText(`mailto:${company.hr.email}`)} className="flex items-center gap-3 text-uk-body transition-colors hover:text-uk-blue-bright">
                            <Mail className="h-4 w-4 text-uk-blue" />
                            {ukText(company.hr.email)}
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Offices */}
                <div className="flex flex-1 flex-col rounded-2xl border border-uk-line bg-uk-card p-6 card-hover">
                  <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText("Our Offices")}</h3>
                  <ul className="mt-4 flex flex-1 flex-col justify-center gap-5 text-sm">
                    {offices.map((o) => (
                      <li key={o.country} className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-4 w-4 flex-none text-uk-blue" />
                        <address className="not-italic">
                          <p className="font-semibold text-uk-heading">{ukText(o.country)}</p>
                          <p className="mt-1 text-uk-gray">
                            {o.lines.map((line, i) => (
                              <span key={i} className="block">{ukText(line)}</span>
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
        <PageBlocks pageKey="contact" />
      </main>
      <Footer />
    </>
  );
}