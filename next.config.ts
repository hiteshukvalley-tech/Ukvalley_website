import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a test/CI build run beside `next dev` without sharing its .next folder.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Pin Turbopack's workspace root to this app so the build stops warning about
  // the parent folder's package-lock.json living outside a Git repository.
  turbopack: {
    root: process.cwd(),
  },
  // Dev only: let phones/tablets on the local network open the dev server
  // (e.g. http://192.168.1.11:3000). Without this, Next 16 answers the
  // page's JS chunks with 403, so nothing hydrates — the loader never
  // fades and the menu, popup and animations stay dead on mobile.
  // Private LAN ranges only; this has no effect on production builds.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
  images: {
    // Next 16 only allows quality 75 by default. 95 is used for the
    // circular page-hero artwork, where fine detail must stay crisp.
    qualities: [75, 95],
  },
};

export default nextConfig;
