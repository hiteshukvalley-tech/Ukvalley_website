import { cn } from "@/lib/utils";

/**
 * Creative section divider to break flat same-background stacks.
 * Drop between two adjacent sections. `glow` = gradient hairline,
 * `wave` = subtle SVG wave, `dots` = centered dot trio.
 */
export function SectionDivider({
  variant = "glow",
  className,
  flip = false,
}: {
  variant?: "glow" | "wave" | "dots" | "circuit";
  className?: string;
  flip?: boolean;
}) {
  if (variant === "circuit") {
    return (
      <div className={cn("w-full", className)} aria-hidden>
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex items-center gap-3 py-2">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-uk-blue/40" />
            <span className="flex h-2 w-2 items-center justify-center">
              <span className="node-pulse h-2 w-2 rounded-full bg-uk-blue" />
            </span>
            <span className="h-px w-10 bg-uk-blue/30" />
            <span className="h-1.5 w-1.5 rounded-full bg-uk-yellow" />
            <span className="h-px w-10 bg-uk-blue/30" />
            <span className="node-pulse h-2 w-2 rounded-full bg-uk-blue" style={{ animationDelay: "1.2s" }} />
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-uk-blue/40" />
          </div>
        </div>
      </div>
    );
  }
  if (variant === "wave") {
    return (
      <div
        className={cn(
          "pointer-events-none flex h-12 items-center justify-center text-uk-blue/30",
          className
        )}
        aria-hidden
      >
        <svg
          width="160"
          height="20"
          viewBox="0 0 160 20"
          fill="none"
          className={cn(flip && "rotate-180")}
        >
          <path
            d="M0 10 Q 20 0 40 10 T 80 10 T 120 10 T 160 10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="2 6"
          />
        </svg>
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div
        className={cn("flex h-12 items-center justify-center gap-2", className)}
        aria-hidden
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-uk-blue/40 node-pulse"
            style={{ boxShadow: "0 0 12px rgba(49,0,255,0.5)" }}
          />
        ))}
      </div>
    );
  }

  // glow — full-width wrapper (accepts bg/padding) with centered line
  return (
    <div className={cn("w-full", className)} aria-hidden>
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="divider-glow" />
      </div>
    </div>
  );
}