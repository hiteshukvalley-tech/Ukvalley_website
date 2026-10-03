import {
  FileText, Rocket, CalendarCheck, Clock, GitBranch, KeyRound, type LucideIcon,
} from "lucide-react";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { timeSavers } from "@/lib/site-data";
import { cn } from "@/lib/utils";
import { ukText } from "@/lib/texts";

const icons: Record<string, LucideIcon> = {
  fileText: FileText,
  rocket: Rocket,
  calendarCheck: CalendarCheck,
  clock: Clock,
  gitBranch: GitBranch,
  keyRound: KeyRound,
};

/**
 * "How we give you your time back" — six mechanisms in the delivery model,
 * each with the hours or weeks it returns to the client's team. Reused across
 * services, process, engagement, pricing and hire pages.
 */
export function TimeSavers({
  eyebrow = "Your time back",
  title = (
    <>{ukText("Six ways the model ")}<span className="text-uk-blue">{ukText("saves your team's time.")}</span>
    </>
  ),
  description = "Every figure below is a mechanism, not a promise — a contractual term or a fixed delivery ritual you can check on any engagement.",
  align = "center",
  className,
}: {
  eyebrow?: string;
  title?: React.ReactNode;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <section className={cn("relative bg-uk-surface section-py", className)}>
      <div className="absolute inset-0 bg-dots opacity-20" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading align={align} eyebrow={ukText(eyebrow)} title={ukText(title)} description={ukText(description)} />
        <Reveal staggerChildren className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {timeSavers.map((t) => {
            const Icon = icons[t.icon] ?? Clock;
            return (
              <div
                key={t.title}
                className="flex flex-col gap-4 rounded-2xl border border-uk-line bg-uk-card p-6 card-hover"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-uk-blue/12 text-uk-blue">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="flex flex-col items-end text-right">
                    <span className="font-heading text-2xl font-bold leading-none text-uk-blue">{ukText(t.saved)}</span>
                    <span className="mt-1 text-[0.68rem] font-semibold uppercase tracking-wider text-uk-muted">
                      {ukText(t.savedLabel)}
                    </span>
                  </span>
                </div>
                <h3 className="font-heading text-base font-bold text-uk-heading">{ukText(t.title)}</h3>
                <p className="text-sm leading-relaxed text-uk-gray">{ukText(t.desc)}</p>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
