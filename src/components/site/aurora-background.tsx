import { AuroraBlobs } from "./aurora-blobs";

/**
 * Site-wide aurora background — the ChatGPT reference artwork's ambient
 * deep-space glow, fixed behind all content. Dark mode only: the dark
 * page-level surfaces are slightly translucent so these blobs bleed
 * through as a slow ambient glow everywhere on the site.
 *
 * Light mode keeps opaque surfaces and renders nothing here.
 * Decorative, aria-hidden, pointer-events-none.
 */
export function AuroraBackground() {
  return (
    <div className="hidden dark:block">
      <AuroraBlobs
        className="fixed -z-10"
        blobs={[
          // top-left — large indigo anchor
          { left: "-10%", top: "-14%", size: "38rem", tone: "indigo", shape: "a", delay: "0s", opacity: 0.9 },
          // top-right — cyan counterweight
          { left: "72%", top: "-10%", size: "30rem", tone: "cyan", shape: "b", delay: "-8s", opacity: 0.85 },
          // bottom-right — blue anchor
          { left: "66%", top: "78%", size: "34rem", tone: "blue", shape: "c", delay: "-18s", opacity: 0.9 },
        ]}
      />
    </div>
  );
}