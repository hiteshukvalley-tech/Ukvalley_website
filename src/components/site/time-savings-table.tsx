import { Clock, ArrowRight } from "lucide-react";
import { Reveal } from "./reveal";
import { ukText } from "@/lib/texts";

/**
 * Before/after table for a solution — the tasks a client's team currently
 * does by hand, how long each takes today, and what it becomes after the
 * system is live. Rendered as a real table so it prints and reads well.
 */
export function TimeSavingsTable({
  rows,
  name,
}: {
  rows: { task: string; before: string; after: string }[];
  name: string;
}) {
  return (
    <section className="relative bg-uk-surface section-py">
      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal className="max-w-2xl">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">
            <Clock className="h-3.5 w-3.5" />{ukText("Your time back")}</span>
          <h2 className="mt-5 font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("Where your team gets its hours back with ")}{ukText(name)}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-uk-gray sm:text-base">{ukText("Typical figures from live deployments. We measure the “before” during the scoping week on your own numbers, so the “after” is a target you can hold us to.")}</p>
        </Reveal>

        <Reveal className="mt-8 overflow-x-auto rounded-3xl border border-uk-line bg-uk-card">
          <table className="w-full min-w-[560px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr>
                <th className="border-b border-uk-line px-5 py-4 font-heading font-bold text-uk-heading">{ukText("Task")}</th>
                <th className="border-b border-uk-line px-5 py-4 font-heading font-bold text-uk-muted">{ukText("Before")}</th>
                <th className="border-b border-uk-line px-5 py-4 font-heading font-bold text-uk-blue">{ukText("After")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.task} className="transition-colors hover:bg-uk-surface">
                  <td className="border-b border-uk-line px-5 py-4 font-medium text-uk-heading">{ukText(r.task)}</td>
                  <td className="border-b border-uk-line px-5 py-4 text-uk-muted">
                    <span className="line-through decoration-uk-muted/50">{ukText(r.before)}</span>
                  </td>
                  <td className="border-b border-uk-line px-5 py-4">
                    <span className="inline-flex items-center gap-2 rounded-full bg-uk-blue/10 px-3 py-1 font-semibold text-uk-blue">
                      <ArrowRight className="h-3.5 w-3.5" />
                      {ukText(r.after)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </div>
    </section>
  );
}
