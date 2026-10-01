import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, Sora } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/site/smooth-scroll";
import { PageLoader } from "@/components/site/page-loader";
import { ThemeProviderWrapper } from "@/components/site/theme-provider";
import { SpotlightCursor } from "@/components/site/spotlight-cursor";
import { ScopingProvider } from "@/components/site/scoping-modal";
import { getSiteSettings } from "@/lib/settings";
import { AuroraBackground } from "@/components/site/aurora-background";
import { SiteOnly } from "@/components/site/site-only";

// Body face — Plus Jakarta Sans: modern, slightly geometric, reads as
// premium-professional while staying highly legible at small sizes.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// Display face for inner-page hero headings only (font-heading-display) —
// the home hero and every other heading stay on Space Grotesk.
const sora = Sora({
  variable: "--font-heading-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

// Mobile browser chrome (Android Chrome address bar, iOS Safari status
// area) tinted to the page surface in each theme instead of default grey.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f7ff" },
    { media: "(prefers-color-scheme: dark)", color: "#070511" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://ukvalley.com"),
  title: {
    default: "Ukvalley Technologies — Custom Software, CRM, ERP & Mobile Apps",
    template: "%s | Ukvalley Technologies",
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
    url: "https://ukvalley.com",
    siteName: "Ukvalley Technologies",
    title: "Ukvalley Technologies — Custom Software, CRM, ERP & Mobile Apps",
    description:
      "Custom software for Indian SMEs and global startups. Engineered to scale, supported for years.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ukvalley Technologies",
    description:
      "Custom software, CRM, ERP & mobile apps — engineered to scale, supported for years.",
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getSiteSettings();
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
        <ThemeProviderWrapper>
          <ScopingProvider email={settings.email} phone={settings.phonePrimary}>
            <SiteOnly>
              <SpotlightCursor />
            </SiteOnly>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-lg focus:bg-uk-blue focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-uk-white"
            >
              Skip to main content
            </a>
            <SmoothScroll>
              <SiteOnly>
                <PageLoader />
              </SiteOnly>
              {children}
            </SmoothScroll>
          </ScopingProvider>
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}