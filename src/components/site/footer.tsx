import Link from "@/components/site/intent-link";
import { ArrowRight } from "lucide-react";
import type { NavLink } from "@/lib/site-data";
import { getSiteSettings } from "@/lib/settings";
import { isRealIdentifier } from "@/lib/site-core";
import { getServices } from "@/lib/services-store";
import { getSolutions } from "@/lib/solutions-store";
import { liveLinks } from "@/lib/nav-links";

// Icons for the social links saved in Admin → Site settings. Empty links are
// skipped, so nothing renders as a dead "#" placeholder.
const LINKEDIN_PATH =
  "M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V24h-4V8zm7.5 0h3.8v2.2h.05c.53-1 1.83-2.2 3.77-2.2 4.03 0 4.78 2.65 4.78 6.1V24h-4v-7.1c0-1.7-.03-3.9-2.37-3.9-2.37 0-2.73 1.85-2.73 3.77V24h-4V8z";
const socialMeta = [
  { key: "linkedin", label: "LinkedIn", path: LINKEDIN_PATH, text: "" },
  { key: "twitter", label: "X (Twitter)", path: "", text: "X" },
  { key: "facebook", label: "Facebook", path: "", text: "f" },
  { key: "instagram", label: "Instagram", path: "", text: "IG" },
  { key: "youtube", label: "YouTube", path: "", text: "YT" },
  { key: "github", label: "GitHub", path: "", text: "GH" },
] as const;

const solutionLinks: NavLink[] = [
  { label: "All Solutions", href: "/solutions" },
  { label: "CRM Systems", href: "/solutions/crm" },
  { label: "ERP Systems", href: "/solutions/erp" },
  { label: "HRMS & Payroll", href: "/solutions/hrms" },
  { label: "E-commerce Platforms", href: "/solutions/ecommerce" },
  { label: "POS Systems", href: "/solutions/pos" },
];

const companyLinks: NavLink[] = [
  { label: "About Us", href: "/about" },
  { label: "Our Team", href: "/team" },
  { label: "Pricing", href: "/pricing" },
  { label: "Case Studies", href: "/case-studies" },
  { label: "Client Success", href: "/clients" },
  { label: "Process", href: "/process" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
];

export async function Footer() {
  const company = await getSiteSettings();
  const registeredIds = (
    [["CIN", company.cin], ["GSTIN", company.gstin], ["Udyam (MSME)", company.udyam]] as const
  ).filter(([, v]) => isRealIdentifier(v));
  const serviceLinks: NavLink[] = (await getServices())
    .slice(0, 5)
    .map((s) => ({ label: s.title, href: s.href }));
  const socials = socialMeta
    .map((m) => ({ ...m, href: company.social[m.key] }))
    .filter((m) => m.href);
  return (
    <footer className="relative border-t border-uk-line bg-uk-surface-2 bg-aurora">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr]">
          {/* Brand */}
          <div className="col-span-2 flex flex-col gap-5 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5" aria-label="Ukvalley Technologies home">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-uk-blue to-uk-blue-bright shadow-glow-blue-sm">
                <span className="font-heading text-lg font-bold text-uk-white">U</span>
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-uk-yellow" />
              </span>
              <span className="flex flex-col leading-none">
                <span className="font-heading text-base font-bold text-uk-heading">Ukvalley</span>
                <span className="text-[0.62rem] font-medium uppercase tracking-[0.28em] text-uk-muted">Technologies</span>
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-uk-muted">
              Custom software for Indian SMEs and global startups.
              Engineered to scale, supported for years.
            </p>
            <div className="flex gap-2.5">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-uk-line bg-white dark:bg-uk-surface-2 text-uk-muted transition-colors hover:border-uk-blue/40 hover:bg-uk-blue/10 hover:text-uk-blue"
                >
                  {s.path ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                      <path d={s.path} />
                    </svg>
                  ) : (
                    <span aria-hidden="true" className="text-[0.7rem] font-bold leading-none">{s.text}</span>
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <FooterCol title="Services" links={serviceLinks} />
          {/* Solutions */}
          <FooterCol title="Solutions" links={liveLinks(solutionLinks, "/solutions", await getSolutions())} />
          {/* Company */}
          <FooterCol title="Company" links={companyLinks} />

          {/* Contact — phone, email and address live on the Contact page only */}
          <div className="col-span-2 flex flex-col gap-4 md:col-span-1">
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-uk-heading">Get in touch</h3>
            <p className="text-sm leading-relaxed text-uk-muted">
              Talk to a software architect — not a sales bot. Reply within 1 business hour.
            </p>
            <Link
              href="/contact"
              className="link-ink group inline text-sm font-semibold text-uk-blue transition-colors hover:text-uk-blue-bright"
            >
              Phone, email &amp; office address
              <ArrowRight className="ml-1 inline h-4 w-4 align-text-bottom transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/contact"
              className="btn-sheen btn-lift group mt-1 flex min-h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-uk-blue px-6 py-3 text-sm font-semibold sm:inline-flex sm:w-fit sm:justify-start sm:px-5 sm:py-2.5 text-uk-white shadow-glow-blue-sm hover:bg-uk-blue-bright"
            >
              Start a project
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* registered identifiers — verifiability trust signal (placeholders are never shown) */}
        {registeredIds.length > 0 && (
          <div className="mt-12 grid grid-cols-1 gap-3 rounded-2xl border border-uk-line bg-white dark:bg-uk-card p-5 text-xs text-uk-muted shadow-float sm:grid-cols-3">
            {registeredIds.map(([label, value]) => (
              <span key={label}><span className="font-semibold text-uk-heading">{label}:</span> {value}</span>
            ))}
          </div>
        )}

        {/* bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-uk-line pt-7 text-xs text-uk-muted sm:flex-row">
          <p>© {new Date().getFullYear()} {company.name}. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href="/privacy" className="transition-colors hover:text-uk-blue">Privacy Policy</Link>
            <Link href="/terms" className="transition-colors hover:text-uk-blue">Terms of Service</Link>
            {/* plain <a>: sitemap.xml is a file, not a page for client-side navigation */}
            <a href="/sitemap.xml" className="transition-colors hover:text-uk-blue">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: NavLink[] }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-uk-heading">{title}</h3>
      <ul className="flex flex-col gap-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="link-ink text-sm text-uk-muted transition-colors hover:text-uk-blue">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}