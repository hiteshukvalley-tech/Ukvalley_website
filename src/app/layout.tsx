import type { Metadata, Viewport } from "next";
import { SITE_INDEXABLE, SITE_URL } from "@/lib/site-origin";
import localFont from "next/font/local";
import "./globals.css";
import { SmoothScroll } from "@/components/site/smooth-scroll";
import { PageLoader } from "@/components/site/page-loader";
import { ThemeProviderWrapper } from "@/components/site/theme-provider";
import { SpotlightCursor } from "@/components/site/spotlight-cursor";
import { ScopingProvider } from "@/components/site/scoping-modal";
import { getSiteSettings } from "@/lib/settings";
import { getChrome } from "@/lib/home-store";
import { OFFICIAL_LOGO } from "@/lib/site-content-schema";
import { AuroraBackground } from "@/components/site/aurora-background";
import { SiteOnly } from "@/components/site/site-only";
import { TextsProvider } from "@/components/site/texts-context";
import { textsSnapshot, ukText } from "@/lib/texts";

// Fonts are self-hosted (latin variable-weight files from Fontsource, OFL) in
// ./fonts. next/font/google fetches from Google at build time, and an odd
// reply from Google fails the Turbopack build (vercel/next.js#99114).

// Body face — Plus Jakarta Sans: modern, slightly geometric, reads as
// premium-professional while staying highly legible at small sizes.
const jakarta = localFont({
  src: "./fonts/plus-jakarta-sans.woff2",
  variable: "--font-sans",
  weight: "200 800",
  display: "swap",
});

const spaceGrotesk = localFont({
  src: "./fonts/space-grotesk.woff2",
  variable: "--font-heading",
  weight: "300 700",
  display: "swap",
});

// Display face for inner-page hero headings only (font-heading-display) —
// the home hero and every other heading stay on Space Grotesk.
const sora = localFont({
  src: "./fonts/sora.woff2",
  variable: "--font-heading-display",
  weight: "100 800",
  display: "swap",
});

// Mobile browser chrome (Android Chrome address bar, iOS Safari status
// area) tinted to the page surface in each theme instead of default grey.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f7ff" },
    { media: "(prefers-color-scheme: dark)", color: "#070511" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(`${SITE_URL}`),
  title: {
    default: "Ukvalley — Custom Software, CRM, ERP & Mobile Apps",
    template: "%s | Ukvalley",
  },
  description:
    "Custom software for Indian SMEs and global startups. Web, mobile, CRM, ERP, HRMS, cloud & cybersecurity — engineered to scale, supported for years.",
  keywords: [
    "custom software development company India",
    "CRM development company India",
    "ERP software development India",
    "mobile app development company India",
    "managed IT services company India",
    "Ukvalley Technologies",
  ],
  authors: [{ name: "Ukvalley Technologies" }],
  creator: "Ukvalley Technologies",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: `${SITE_URL}`,
    siteName: "Ukvalley Technologies",
    title: "Ukvalley — Custom Software, CRM, ERP & Mobile Apps",
    description:
      "Custom software for Indian SMEs and global startups. Engineered to scale, supported for years.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ukvalley Technologies",
    description:
      "Custom software, CRM, ERP & mobile apps — engineered to scale, supported for years.",
  },
  // Test deployments (uat., *.onrender.com, localhost …) stay out of search results.
  robots: SITE_INDEXABLE ? { index: true, follow: true } : { index: false, follow: false },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [settings, { header }] = await Promise.all([getSiteSettings(), getChrome()]);
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${jakarta.variable} ${spaceGrotesk.variable} ${sora.variable} h-full antialiased`}
    >
      {/* bg-background: solid page base (matches --uk-surface exactly in
          both themes) — the aurora layer sits above it, and translucent
          section surfaces let it bleed through in dark mode */}
      <body className="min-h-full flex flex-col bg-background text-uk-body transition-colors duration-300">
        <SiteOnly>
          <AuroraBackground />
        </SiteOnly>
        <TextsProvider map={textsSnapshot()}>
        <ThemeProviderWrapper>
          {/* The booking modal's "call us" number is the Sales line listed on /contact */}
          <ScopingProvider email={settings.email} phone={settings.sales.phone || settings.phonePrimary}>
            <SiteOnly>
              <SpotlightCursor />
            </SiteOnly>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-lg focus:bg-uk-blue focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-uk-white"
            >
              {ukText("Skip to main content")}
            </a>
            <SmoothScroll>
              {/* Logo loader on a hard reload — website and admin panel alike */}
              <PageLoader
                logo={header.logoImage || OFFICIAL_LOGO}
                logoDark={header.logoImage ? header.logoImageDark : ""}
                alt={`${header.logoName} ${header.logoSub}`.trim() || "Ukvalley Technologies"}
              />
              {children}
            </SmoothScroll>
          </ScopingProvider>
        </ThemeProviderWrapper>
        </TextsProvider>
      </body>
    </html>
  );
}