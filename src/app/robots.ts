import type { MetadataRoute } from "next";
import { SITE_INDEXABLE, SITE_URL } from "@/lib/site-origin";

// The admin isn't listed here (that would advertise it): every /admin response
// carries an X-Robots-Tag: noindex header from src/proxy.ts, and its pages set
// robots noindex in their metadata.
/**
 * Bots that only fetch a page to build a link preview when someone shares it
 * (WhatsApp and Facebook use facebookexternalhit). They obey robots.txt, so
 * blocking them would leave shared links without the logo, title or text.
 * They never index anything, and every page still says noindex.
 */
const LINK_PREVIEW_BOTS = [
  "facebookexternalhit", "Facebot", "Twitterbot", "LinkedInBot", "WhatsApp",
  "Slackbot", "Slackbot-LinkExpanding", "TelegramBot", "Discordbot", "SkypeUriPreview", "Pinterestbot",
];

export default function robots(): MetadataRoute.Robots {
  // A test deployment (uat., staging., *.onrender.com, localhost …): block
  // search engines, but let link previews work when the address is shared.
  if (!SITE_INDEXABLE) {
    return {
      rules: [
        { userAgent: LINK_PREVIEW_BOTS, allow: "/" },
        { userAgent: "*", disallow: "/" },
      ],
    };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
