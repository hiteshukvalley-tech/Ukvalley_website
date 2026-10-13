import Link from "@/components/site/intent-link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "./reveal";
import { ukText } from "@/lib/texts";

type Chip = { label: string; href: string };

/**
 * Pages worth visiting next, per site section (the folder under src/app).
 * Shown as a centred "Related" row of pill links above each page's closing
 * call to action.
 */
export const RELATED: Record<string, Chip[]> = {
  about: [{ label: "Our team", href: "/team" }, { label: "Why Ukvalley", href: "/why-ukvalley" }, { label: "Our process", href: "/process" }, { label: "Press kit", href: "/press-kit" }],
  blog: [{ label: "Case studies", href: "/case-studies" }, { label: "Services", href: "/services" }, { label: "Solutions", href: "/solutions" }, { label: "FAQ", href: "/faq" }],
  careers: [{ label: "Our team", href: "/team" }, { label: "About us", href: "/about" }, { label: "Social impact", href: "/social-impact" }, { label: "Locations", href: "/locations" }],
  "case-studies": [{ label: "Client success", href: "/clients" }, { label: "Industries", href: "/industries" }, { label: "Products", href: "/products" }, { label: "Our process", href: "/process" }],
  clients: [{ label: "Case studies", href: "/case-studies" }, { label: "Why Ukvalley", href: "/why-ukvalley" }, { label: "Industries", href: "/industries" }, { label: "About us", href: "/about" }],
  engagement: [{ label: "Pricing", href: "/pricing" }, { label: "Our process", href: "/process" }, { label: "Support & SLA", href: "/support-maintenance" }, { label: "Hire developers", href: "/hire" }],
  faq: [{ label: "Pricing", href: "/pricing" }, { label: "Our process", href: "/process" }, { label: "Support & SLA", href: "/support-maintenance" }, { label: "Contact", href: "/contact" }],
  hire: [{ label: "Engagement models", href: "/engagement" }, { label: "Pricing", href: "/pricing" }, { label: "Our team", href: "/team" }, { label: "Tech stack", href: "/tech-stack" }],
  industries: [{ label: "Case studies", href: "/case-studies" }, { label: "Solutions", href: "/solutions" }, { label: "Client success", href: "/clients" }, { label: "Services", href: "/services" }],
  locations: [{ label: "Contact", href: "/contact" }, { label: "About us", href: "/about" }, { label: "Our team", href: "/team" }, { label: "Careers", href: "/careers" }],
  pricing: [{ label: "Engagement models", href: "/engagement" }, { label: "Our process", href: "/process" }, { label: "Support & SLA", href: "/support-maintenance" }, { label: "FAQ", href: "/faq" }],
  process: [{ label: "Engagement models", href: "/engagement" }, { label: "Pricing", href: "/pricing" }, { label: "Tech stack", href: "/tech-stack" }, { label: "Case studies", href: "/case-studies" }],
  products: [{ label: "Case studies", href: "/case-studies" }, { label: "Solutions", href: "/solutions" }, { label: "Tech stack", href: "/tech-stack" }, { label: "Services", href: "/services" }],
  "project-rescue": [{ label: "Support & SLA", href: "/support-maintenance" }, { label: "Our process", href: "/process" }, { label: "Case studies", href: "/case-studies" }, { label: "Pricing", href: "/pricing" }],
  services: [{ label: "Solutions", href: "/solutions" }, { label: "Products", href: "/products" }, { label: "Tech stack", href: "/tech-stack" }, { label: "Pricing", href: "/pricing" }],
  "social-impact": [{ label: "About us", href: "/about" }, { label: "Our team", href: "/team" }, { label: "Careers", href: "/careers" }, { label: "Press kit", href: "/press-kit" }],
  solutions: [{ label: "Services", href: "/services" }, { label: "Industries", href: "/industries" }, { label: "Products", href: "/products" }, { label: "Case studies", href: "/case-studies" }],
  "support-maintenance": [{ label: "Project rescue", href: "/project-rescue" }, { label: "Pricing", href: "/pricing" }, { label: "Engagement models", href: "/engagement" }, { label: "FAQ", href: "/faq" }],
  team: [{ label: "About us", href: "/about" }, { label: "Careers", href: "/careers" }, { label: "Social impact", href: "/social-impact" }, { label: "Locations", href: "/locations" }],
  "tech-stack": [{ label: "Services", href: "/services" }, { label: "Our process", href: "/process" }, { label: "Hire developers", href: "/hire" }, { label: "Solutions", href: "/solutions" }],
  "why-ukvalley": [{ label: "About us", href: "/about" }, { label: "Client success", href: "/clients" }, { label: "Case studies", href: "/case-studies" }, { label: "Our process", href: "/process" }],
  "press-kit": [{ label: "Media", href: "/media" }, { label: "About us", href: "/about" }, { label: "Our process", href: "/process" }, { label: "Services", href: "/services" }],
  media: [{ label: "Press kit", href: "/press-kit" }, { label: "About us", href: "/about" }, { label: "Case studies", href: "/case-studies" }, { label: "Our process", href: "/process" }],
  contact: [{ label: "Pricing", href: "/pricing" }, { label: "Our process", href: "/process" }, { label: "Locations", href: "/locations" }, { label: "FAQ", href: "/faq" }],
  privacy: [{ label: "Terms of service", href: "/terms" }, { label: "Contact", href: "/contact" }, { label: "About us", href: "/about" }, { label: "Sitemap", href: "/sitemap" }],
  terms: [{ label: "Privacy policy", href: "/privacy" }, { label: "Contact", href: "/contact" }, { label: "Support & SLA", href: "/support-maintenance" }, { label: "Sitemap", href: "/sitemap" }],
  sitemap: [{ label: "Services", href: "/services" }, { label: "Solutions", href: "/solutions" }, { label: "Case studies", href: "/case-studies" }, { label: "Contact", href: "/contact" }],
};

/** Centred "Related" heading with pill links (the reference site's pattern). */
export function RelatedChips({ page, links }: { page?: string; links?: Chip[] }) {
  const chips = links ?? (page ? RELATED[page] : undefined);
  if (!chips?.length) return null;
  return (
    <Reveal className="flex flex-col items-center gap-4 text-center">
      <p className="font-heading text-base font-semibold text-uk-heading">{ukText("Related")}</p>
      <ul className="flex flex-wrap justify-center gap-2.5">
        {chips.map((c) => (
          <li key={c.href}>
            <Link
              href={ukText(c.href)}
              className="group inline-flex items-center gap-1.5 rounded-full border border-uk-line bg-white px-4 py-2 text-sm font-medium text-uk-heading shadow-float transition-colors hover:border-uk-blue/50 hover:text-uk-blue dark:bg-uk-card"
            >
              <ArrowUpRight className="h-3.5 w-3.5 text-uk-blue transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              {ukText(c.label)}
            </Link>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

/** RelatedChips as its own band, for pages without the closing call to action. */
export function RelatedSection({ page }: { page: string }) {
  if (!RELATED[page]?.length) return null;
  return (
    <section className="relative bg-uk-surface px-5 pb-20 pt-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <RelatedChips page={page} />
      </div>
    </section>
  );
}
