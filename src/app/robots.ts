import type { MetadataRoute } from "next";
import { SITE_INDEXABLE, SITE_URL } from "@/lib/site-origin";

// The admin isn't listed here (that would advertise it): every /admin response
// carries an X-Robots-Tag: noindex header from src/proxy.ts, and its pages set
// robots noindex in their metadata.
export default function robots(): MetadataRoute.Robots {
  // A test deployment (uat., staging., *.onrender.com, localhost …): block everything.
  if (!SITE_INDEXABLE) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
