import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The photo backdrop of a dark hero band: the picture, deep-indigo overlays
 * that keep white text readable, and a fade into the page below. Place it as
 * the first child of a `relative isolate overflow-hidden` section that also
 * carries `page-hero-photo` (the header turns its text light over it).
 * `align` follows the copy: "left" keeps the photo showing through on the
 * right, "center" darkens evenly behind centred text.
 */
export function HeroPhoto({
  src,
  className,
  align = "left",
}: {
  src: string;
  /** object-position + filter grade for the photo */
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <>
      {/* data-scan-*: Admin → All page text lists the photo as its own card */}
      <div className="absolute inset-0 -z-10" aria-hidden data-scan-card="Hero picture (behind the title)" data-scan-late="">
        <Image src={src} alt="" fill preload sizes="100vw" quality={80} className={cn("object-cover", className)} />
      </div>
      <div
        className={cn(
          "absolute inset-0 -z-10",
          align === "left"
            ? "bg-gradient-to-r from-[#0b0820] via-[#0b0820]/90 to-[#0b0820]/45"
            : "bg-[radial-gradient(ellipse_at_50%_35%,rgba(11,8,32,0.78),rgba(11,8,32,0.93)_70%)]"
        )}
        aria-hidden
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0b0820] via-transparent to-[#0b0820]/50" aria-hidden />
      <div className="absolute inset-0 -z-10 bg-blueprint opacity-[0.07]" aria-hidden />
    </>
  );
}
