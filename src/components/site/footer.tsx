import Link from "@/components/site/intent-link";
import { ArrowRight } from "lucide-react";
import type { NavLink } from "@/lib/site-core";
import { getSiteSettings } from "@/lib/settings";
import { getChrome } from "@/lib/home-store";
import { fill } from "@/lib/home-schema";
import { SmartLink } from "@/components/site/smart-link";
import { isRealIdentifier } from "@/lib/site-core";
import { getServices } from "@/lib/services-store";
import { getSolutions } from "@/lib/solutions-store";
import { liveLinks } from "@/lib/nav-links";
import { ukText } from "@/lib/texts";
import { SiteLogo } from "@/components/site/site-logo";

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

export async function Footer() {
  const [company, { header, footer: f }] = await Promise.all([getSiteSettings(), getChrome()]);
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
      <div className="mx-auto max-w-7xl pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] py-12 pb-[max(3rem,env(safe-area-inset-bottom))] sm:py-16 lg:px-8">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4 md:gap-x-12 md:gap-y-12 lg:grid-cols-[1.25fr_1.1fr_1fr_0.95fr_1.4fr] lg:gap-x-14">
          {/* Brand */}
          <div className="col-span-2 flex flex-col gap-5 lg:col-span-1">
            <Link href={ukText("/")} className="flex items-center gap-2.5" aria-label={`${header.logoName} ${header.logoSub} home`.trim()}>
              <SiteLogo content={header} text={ukText} />
            </Link>
            {f.brandText && <p className="max-w-xs text-sm leading-relaxed text-uk-muted">{ukText(f.brandText)}</p>}
            <div className="flex flex-wrap gap-2.5">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={ukText(s.href)}
                  aria-label={s.label}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-uk-line bg-white dark:bg-uk-surface-2 text-uk-muted sm:h-9 sm:w-9 transition-colors hover:border-uk-blue/40 hover:bg-uk-blue/10 hover:text-uk-blue"
                >
                  {s.path ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                      <path d={s.path} />
                    </svg>
                  ) : (
                    <span aria-hidden="true" className="text-[0.7rem] font-bold leading-none">{ukText(s.text)}</span>
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <FooterCol title={ukText(f.servicesTitle)} links={serviceLinks} />
          {/* Solutions */}
          <FooterCol title={ukText(f.solutionsTitle)} links={liveLinks(f.solutionLinks, "/solutions", await getSolutions())} />
          {/* Company */}
          <FooterCol title={ukText(f.companyTitle)} links={f.companyLinks} />

          {/* Contact — phone, email and address live on the Contact page only */}
          <div className="col-span-2 flex flex-col gap-4 md:col-span-1">
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-uk-heading">{ukText(f.contactTitle)}</h3>
            {f.contactText && <p className="text-sm leading-relaxed text-uk-muted">{ukText(f.contactText)}</p>}
            {f.contactLinkLabel && (
              <SmartLink
                href={ukText(f.contactLinkHref)}
                className="group inline text-sm font-semibold text-uk-blue transition-colors hover:text-uk-blue-bright max-sm:py-2"
              >
                {ukText(f.contactLinkLabel)}
                {/* word joiner keeps the arrow on the same line as the last word */}
                {"⁠"}
                <ArrowRight className="ml-1 inline h-4 w-4 align-text-bottom transition-transform group-hover:translate-x-0.5" />
              </SmartLink>
            )}
            <SmartLink
              href={ukText(f.buttonHref)}
              className="btn-sheen btn-lift group mt-1 flex min-h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-uk-blue px-6 py-3 text-sm font-semibold sm:inline-flex sm:w-fit sm:justify-start sm:px-5 sm:py-2.5 text-uk-white shadow-glow-blue-sm hover:bg-uk-blue-bright"
            >
              {ukText(f.buttonLabel)}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </SmartLink>
          </div>
        </div>

        {/* registered identifiers — verifiability trust signal (placeholders are never shown) */}
        {registeredIds.length > 0 && (
          <div className="mt-12 grid grid-cols-1 gap-3 rounded-2xl border border-uk-line bg-white dark:bg-uk-card p-5 text-xs text-uk-muted shadow-float sm:grid-cols-3">
            {registeredIds.map(([label, value]) => (
              <span key={label}><span className="font-semibold text-uk-heading">{ukText(label)}:</span> {ukText(value)}</span>
            ))}
          </div>
        )}

        {/* bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-uk-line pt-8 text-xs text-uk-muted sm:mt-14 sm:flex-row">
          <p>{ukText(fill(f.copyright, { year: new Date().getFullYear(), name: company.name }))}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 sm:gap-y-2">
            {f.bottomLinks.map((l) => (
              <SmartLink key={l.href + l.label} href={ukText(humanLink(l.href))} className="inline-flex min-h-10 items-center transition-colors hover:text-uk-blue sm:min-h-0">
                {ukText(l.label)}
              </SmartLink>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/** The raw XML sitemap is for search engines; people get the readable page. */
const humanLink = (href: string) => (href === "/sitemap.xml" ? "/sitemap" : href);

function FooterCol({ title, links }: { title: string; links: NavLink[] }) {
  return (
    <div className="flex min-w-0 flex-col gap-3 sm:gap-5">
      <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-uk-heading">{ukText(title)}</h3>
      <ul className="flex flex-col gap-2 sm:gap-3.5">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <SmartLink href={ukText(humanLink(l.href))} className="footer-link inline-flex min-h-10 items-center text-sm leading-snug text-uk-muted hover:text-uk-blue focus-visible:text-uk-blue sm:min-h-0">
              {ukText(l.label)}
            </SmartLink>
          </li>
        ))}
      </ul>
    </div>
  );
}