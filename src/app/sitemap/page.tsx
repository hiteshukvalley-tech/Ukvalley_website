import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site-origin";
import { editableMetadata } from "@/lib/page-metadata";
import Link from "@/components/site/intent-link";
import { ArrowUpRight } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { EditableHero, PageBlocks } from "@/components/site/page-extras";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { getServices } from "@/lib/services-store";
import { getSolutions } from "@/lib/solutions-store";
import { getProducts } from "@/lib/products-store";
import { getCaseStudies } from "@/lib/cases-store";
import { getIndustries } from "@/lib/industries-store";
import { getHireRoles } from "@/lib/hire-store";
import { getLocations } from "@/lib/locations-store";
import { getPosts } from "@/lib/blog-store";
import { getCareers } from "@/lib/careers-store";
import { getMenu } from "@/lib/menu-store";
import { ukText } from "@/lib/texts";

// Re-render at least once a minute so new pages and admin text edits show up.
export const revalidate = 60;

// Title and description can be replaced in Admin → Page text (SEO fields).
export const generateMetadata = () => editableMetadata("sitemap", baseMetadata);
const baseMetadata: Metadata = {
  title: "Sitemap — every page of the Ukvalley website",
  description: "A readable list of every page on the Ukvalley Technologies website, grouped by section.",
  alternates: { canonical: `${SITE_URL}/sitemap` },
};

type Entry = { label: string; href: string };
type Group = { title: string; entries: Entry[] };

const MAIN: Entry[] = [
  { label: "Home", href: "/" },
  { label: "About us", href: "/about" },
  { label: "Why Ukvalley", href: "/why-ukvalley" },
  { label: "Our team", href: "/team" },
  { label: "Our social impact", href: "/social-impact" },
  { label: "Process", href: "/process" },
  { label: "Engagement model", href: "/engagement" },
  { label: "Pricing", href: "/pricing" },
  { label: "Support & SLA", href: "/support-maintenance" },
  { label: "Project rescue", href: "/project-rescue" },
  { label: "Client success", href: "/clients" },
  { label: "Tech stack", href: "/tech-stack" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy policy", href: "/privacy" },
  { label: "Terms of service", href: "/terms" },
];

export default async function SitemapPage() {
  const [services, solutions, products, cases, industries, hire, locations, posts, careers, menu] = await Promise.all([
    getServices(), getSolutions(), getProducts(), getCaseStudies(), getIndustries(),
    getHireRoles(), getLocations(), getPosts(), getCareers(), getMenu(),
  ]);

  // Sections added in Admin → Main menu (their own pages and links).
  const added: Entry[] = menu
    .filter((m) => m.visible && m.id.startsWith("m-"))
    .flatMap((m) => (m.type === "dropdown" ? m.links.map((l) => ({ label: `${m.label} — ${l.label}`, href: l.href })) : [{ label: m.label, href: m.href }]))
    .filter((e) => e.href.startsWith("/"));

  const groups: Group[] = [
    { title: "Main pages", entries: MAIN },
    { title: "Services", entries: [{ label: "All services", href: "/services" }, ...services.filter((s) => /^\/services\/[^/]+$/.test(s.href)).map((s) => ({ label: s.title, href: s.href }))] },
    { title: "Solutions", entries: [{ label: "All solutions", href: "/solutions" }, ...solutions.map((s) => ({ label: s.name, href: `/solutions/${s.slug}` }))] },
    { title: "Products", entries: [{ label: "All products", href: "/products" }, ...products.map((p) => ({ label: p.name, href: `/products/${p.slug}` }))] },
    { title: "Case studies", entries: [{ label: "All case studies", href: "/case-studies" }, ...cases.map((c) => ({ label: c.title, href: `/case-studies/${c.slug}` }))] },
    { title: "Industries", entries: [{ label: "All industries", href: "/industries" }, ...industries.map((i) => ({ label: i.name, href: `/industries/${i.slug}` }))] },
    { title: "Hire developers", entries: [{ label: "All developers", href: "/hire" }, ...hire.map((r) => ({ label: r.title, href: `/hire/${r.slug}` }))] },
    { title: "Locations", entries: [{ label: "All locations", href: "/locations" }, ...locations.map((l) => ({ label: l.city, href: `/locations/${l.slug}` }))] },
    { title: "Insights", entries: [{ label: "All articles", href: "/blog" }, ...posts.map((p) => ({ label: p.title, href: `/blog/${p.slug}` }))] },
    { title: "Careers", entries: [{ label: "Open roles", href: "/careers" }, ...careers.map((c) => ({ label: c.role, href: `/careers/${c.slug}` }))] },
    { title: "More sections", entries: added },
  ].filter((g) => g.entries.length > 0);

  return (
    <>
      <ScrollProgress />
      <Header />
      <main id="main">
        <EditableHero pageKey="sitemap" variant="company"
          eyebrow={ukText("Sitemap")}
          crumbs={[{ label: "Home", href: "/" }, { label: "Sitemap" }]}
          title={ukText("Every page, in one place")}
          description={ukText("A list of all the pages on this website, grouped by section. Looking for something specific? Start here.")}
        />

        <section className="relative bg-uk-surface-2 section-py">
          <Container className="max-w-6xl">
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {groups.map((g) => (
                <Reveal key={g.title} className="rounded-2xl border border-uk-line bg-uk-card p-6">
                  <h2 className="font-heading text-lg font-bold text-uk-heading">
                    {ukText(g.title)} <span className="text-sm font-medium text-uk-muted">· {g.entries.length}</span>
                  </h2>
                  <ul className="mt-4 flex flex-col gap-2">
                    {g.entries.map((e) => (
                      <li key={e.href + e.label}>
                        <Link href={ukText(e.href)} className="group inline-flex items-start gap-1.5 text-sm text-uk-body transition-colors hover:text-uk-blue">
                          <span>{ukText(e.label)}</span>
                          <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </div>
            <p className="mt-8 text-center text-xs text-uk-muted">
              {ukText("Search engines read the machine-readable version at")}{" "}
              <a href="/sitemap.xml" className="text-uk-blue hover:text-uk-blue-bright">/sitemap.xml</a>.
            </p>
          </Container>
        </section>
        <PageBlocks pageKey="sitemap" />
      </main>
      <Footer />
    </>
  );
}
