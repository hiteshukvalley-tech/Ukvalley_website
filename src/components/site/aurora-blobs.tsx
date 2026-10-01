import { cn } from "@/lib/utils";

export type AuroraBlobSpec = {
  /** CSS `left`, e.g. "-6%" */
  left: string;
  /** CSS `top`, e.g. "10%" */
  top: string;
  /** CSS width/height, e.g. "22rem" */
  size: string;
  /** Rim gradient tone — all drawn from the Dark Aurora ramp */
  tone: "indigo" | "blue" | "cyan";
  /** Organic silhouette variant */
  shape?: "a" | "b" | "c";
  /** Negative animation delay to desynchronise the drift */
  delay?: string;
  /** Override the default opacity (0.32 light / 0.5 dark) */
  opacity?: number;
};

/**
 * Decorative layer of organic glowing-rim blobs — the CSS recreation of
 * the ChatGPT reference artwork. Place inside a relative, overflow-hidden
 * section, behind the content. Purely decorative, aria-hidden.
 */
export function AuroraBlobs({
  blobs,
  className,
}: {
  blobs: AuroraBlobSpec[];
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
    >
      {blobs.map((b, i) => (
        <div
          key={i}
          className={cn(
            "aurora-blob",
            `aurora-blob--${b.tone}`,
            b.shape && `aurora-blob--shape-${b.shape}`
          )}
          style={{
            left: b.left,
            top: b.top,
            width: b.size,
            height: b.size,
            opacity: b.opacity,
            animationDelay: b.delay,
          }}
        >
          <div className="aurora-blob-glow" />
          <div className="aurora-blob-rim" />
          <div className="aurora-blob-core" />
        </div>
      ))}
    </div>
  );
}