import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-origin";
import { getServices } from "@/lib/services-store";
import { getPosts } from "@/lib/blog-store";
import { getProducts } from "@/lib/products-store";
import { getSolutions } from "@/lib/solutions-store";
import { getIndustries } from "@/lib/industries-store";
import { getHireRoles } from "@/lib/hire-store";
import { getCaseStudies } from "@/lib/cases-store";
import { getLocations } from "@/lib/locations-store";
import { getCareers } from "@/lib/careers-store";
import { listMainSlugs } from "@/lib/menu-store";

const BASE = `${SITE_URL}`;

// lastModified only where a real date is known (blog posts, job posts), and
// never an invalid one: an Invalid Date would throw while writing the XML.
// Pages without a known date leave it out rather than claim "changed now".
function modified(value: string | undefined): { lastModified?: Date } {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? { lastModified: d } : {};
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/services`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/solutions`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/hire`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/locations`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/products`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/case-studies`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/industries`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/process`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${BASE}/engagement`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${BASE}/tech-stack`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE}/pricing`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/team`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/social-impact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/press-kit`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE}/media`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE}/why-ukvalley`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/clients`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/project-rescue`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/support-maintenance`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/faq`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/blog`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/careers`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/contact`, changeFrequency: "yearly", priority: 0.7 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Every service linking to its own /services/<slug> page (admin-created ones
  // render a generated detail page, so they are no longer dead links).
  const liveServices = (await getServices()).filter((s) => /^\/services\/[^/]+$/.test(s.href));
  const serviceRoutes: MetadataRoute.Sitemap = liveServices.map((s) => ({
    url: `${BASE}/services/${s.href.split("/").pop()}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // Pages behind main-menu sections added in Admin → Main menu.
  const mainSectionRoutes: MetadataRoute.Sitemap = (await listMainSlugs()).map((slug) => ({
    url: `${BASE}/s/${slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const productRoutes: MetadataRoute.Sitemap = (await getProducts()).map((p) => ({
    url: `${BASE}/products/${p.slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const caseRoutes: MetadataRoute.Sitemap = (await getCaseStudies()).map((c) => ({
    url: `${BASE}/case-studies/${c.slug}`,
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  const industryRoutes: MetadataRoute.Sitemap = (await getIndustries()).map((i) => ({
    url: `${BASE}/industries/${i.slug}`,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const blogRoutes: MetadataRoute.Sitemap = (await getPosts()).map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    ...modified(p.date),
    changeFrequency: "yearly",
    priority: 0.5,
  }));

  const solutionRoutes: MetadataRoute.Sitemap = (await getSolutions()).map((s) => ({
    url: `${BASE}/solutions/${s.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const hireRoutes: MetadataRoute.Sitemap = (await getHireRoles()).map((r) => ({
    url: `${BASE}/hire/${r.slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const locationRoutes: MetadataRoute.Sitemap = (await getLocations()).map((l) => ({
    url: `${BASE}/locations/${l.slug}`,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const careerRoutes: MetadataRoute.Sitemap = (await getCareers()).map((c) => ({
    url: `${BASE}/careers/${c.slug}`,
    ...modified(c.postedAt ? `${c.postedAt}T00:00:00Z` : undefined),
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [
    ...staticRoutes,
    ...careerRoutes,
    ...serviceRoutes,
    ...mainSectionRoutes,
    ...solutionRoutes,
    ...hireRoutes,
    ...locationRoutes,
    ...productRoutes,
    ...caseRoutes,
    ...industryRoutes,
    ...blogRoutes,
  ];
}