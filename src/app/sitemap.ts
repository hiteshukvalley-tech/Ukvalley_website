import type { MetadataRoute } from "next";
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

const BASE = "https://ukvalley.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/services`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/solutions`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/hire`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/locations`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/products`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/case-studies`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/industries`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/process`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${BASE}/engagement`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${BASE}/tech-stack`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/team`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/why-ukvalley`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/clients`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/project-rescue`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/support-maintenance`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/careers`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.7 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Every service linking to its own /services/<slug> page (admin-created ones
  // render a generated detail page, so they are no longer dead links).
  const liveServices = (await getServices()).filter((s) => /^\/services\/[^/]+$/.test(s.href));
  const serviceRoutes: MetadataRoute.Sitemap = liveServices.map((s) => ({
    url: `${BASE}/services/${s.href.split("/").pop()}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // Pages behind main-menu sections added in Admin → Main menu.
  const mainSectionRoutes: MetadataRoute.Sitemap = (await listMainSlugs()).map((slug) => ({
    url: `${BASE}/s/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const productRoutes: MetadataRoute.Sitemap = (await getProducts()).map((p) => ({
    url: `${BASE}/products/${p.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const caseRoutes: MetadataRoute.Sitemap = (await getCaseStudies()).map((c) => ({
    url: `${BASE}/case-studies/${c.slug}`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  const industryRoutes: MetadataRoute.Sitemap = (await getIndustries()).map((i) => ({
    url: `${BASE}/industries/${i.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const blogRoutes: MetadataRoute.Sitemap = (await getPosts()).map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "yearly",
    priority: 0.5,
  }));

  const solutionRoutes: MetadataRoute.Sitemap = (await getSolutions()).map((s) => ({
    url: `${BASE}/solutions/${s.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const hireRoutes: MetadataRoute.Sitemap = (await getHireRoles()).map((r) => ({
    url: `${BASE}/hire/${r.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const locationRoutes: MetadataRoute.Sitemap = (await getLocations()).map((l) => ({
    url: `${BASE}/locations/${l.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const careerRoutes: MetadataRoute.Sitemap = (await getCareers()).map((c) => ({
    url: `${BASE}/careers/${c.slug}`,
    lastModified: new Date(`${c.postedAt}T00:00:00Z`),
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