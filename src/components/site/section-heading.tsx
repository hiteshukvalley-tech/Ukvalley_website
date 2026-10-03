import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";
import { ukText } from "@/lib/texts";

type SectionHeadingProps = {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-5",
        align === "center" && "items-center text-center",
        className
      )}
    >
      {eyebrow && (
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue",
            align === "left" && "self-start"
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-uk-yellow shadow-glow-yellow" />
          {ukText(eyebrow)}
        </span>
      )}
      <h2 className="font-heading-display max-w-3xl text-balance text-[clamp(2rem,4.5vw,3.4rem)] font-bold leading-[1.08] tracking-tight text-uk-heading-strong">
        {ukText(title)}
      </h2>
      {description && (
        <p
          className={cn(
            "max-w-2xl text-[clamp(0.95rem,1.35vw,1.125rem)] leading-relaxed text-uk-body",
            align === "center" && "mx-auto"
          )}
        >
          {ukText(description)}
        </p>
      )}
    </Reveal>
  );
}