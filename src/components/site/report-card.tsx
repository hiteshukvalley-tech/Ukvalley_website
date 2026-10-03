import { Download, FileBarChart, Check, Table2 } from "lucide-react";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import reportsJson from "@/lib/reports.json";
import { cn } from "@/lib/utils";
import { ukText } from "@/lib/texts";

export type Report = (typeof reportsJson.reports)[number];
export const reports: Report[] = reportsJson.reports;

/* ── Single-series horizontal bar chart ────────────────────────────────
   One hue (brand blue), bars capped at 24px, 4px rounded data-end, square
   at the baseline, value labelled at the tip, hairline gridlines, a hover
   title per bar and a table view below — so nothing is gated on colour. */
function BarChart({ chart, id }: { chart: Report["chart"]; id: string }) {
  const rows = chart.rows;
  const max = Math.max(...rows.map((r) => r.value));
  const labelW = 46; // % of width reserved for the row label
  const barH = 22;
  const rowH = 38;
  const w = 640;
  const h = rows.length * rowH + 16;
  const plotX = (w * labelW) / 100;
  const plotW = w - plotX - 56; // room for the tip label
  const ticks = 4;

  return (
    <figure aria-labelledby={`${id}-title`} className="w-full">
      <figcaption id={`${id}-title`} className="text-sm font-semibold text-uk-heading">
        {ukText(chart.title)}
      </figcaption>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={chart.title}
        className="mt-3 h-auto w-full"
      >
        {/* recessive hairline gridlines */}
        {Array.from({ length: ticks + 1 }).map((_, i) => {
          const x = plotX + (plotW * i) / ticks;
          return (
            <line
              key={i}
              x1={x}
              x2={x}
              y1={4}
              y2={h - 12}
              stroke="var(--uk-line)"
              strokeWidth="1"
            />
          );
        })}
        {rows.map((r, i) => {
          const y = 8 + i * rowH;
          const bw = Math.max(8, (r.value / max) * plotW);
          return (
            <g key={r.label} className="group/bar">
              <title>{ukText(`${r.label}: ${r.value} ${chart.unit}`)}</title>
              <text
                x={plotX - 10}
                y={y + barH / 2 + 4}
                textAnchor="end"
                className="fill-uk-body text-[12px]"
              >
                {ukText(r.label.length > 34 ? `${r.label.slice(0, 33)}…` : r.label)}
              </text>
              {/* hit target wider than the mark */}
              <rect x={plotX} y={y - 6} width={plotW + 56} height={barH + 12} fill="transparent" />
              <path
                d={`M${plotX} ${y} H${plotX + bw - 4} a4 4 0 0 1 4 4 v${barH - 8} a4 4 0 0 1 -4 4 H${plotX} Z`}
                className="fill-uk-blue transition-opacity group-hover/bar:opacity-80"
              />
              <text
                x={plotX + bw + 8}
                y={y + barH / 2 + 4}
                className="fill-uk-heading text-[12px] font-semibold"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {ukText(r.value)}
              </text>
            </g>
          );
        })}
      </svg>
      <details className="mt-2 text-xs text-uk-muted">
        <summary className="inline-flex cursor-pointer items-center gap-1.5 font-medium hover:text-uk-heading">
          <Table2 className="h-3.5 w-3.5" />{ukText("View as table")}</summary>
        <table className="mt-2 w-full border-separate border-spacing-0 text-left">
          <thead>
            <tr>
              <th className="border-b border-uk-line py-1.5 pr-3 font-semibold text-uk-heading">{ukText("Item")}</th>
              <th className="border-b border-uk-line py-1.5 text-right font-semibold text-uk-heading">{ukText(chart.unit)}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <td className="border-b border-uk-line py-1.5 pr-3 text-uk-body">{ukText(r.label)}</td>
                <td className="border-b border-uk-line py-1.5 text-right tabular-nums text-uk-body">{ukText(r.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

export function ReportCard({ report, className }: { report: Report; className?: string }) {
  return (
    <article
      className={cn(
        "flex flex-col gap-6 rounded-3xl border border-uk-line bg-uk-card p-6 sm:p-8 card-hover",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-uk-blue/12 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-uk-blue">
            <FileBarChart className="h-3.5 w-3.5" />
            {ukText(report.kind)}
          </span>
          <h3 className="mt-3 font-heading text-xl font-bold leading-snug text-uk-heading sm:text-2xl">
            {ukText(report.title)}
          </h3>
          <p className="mt-1 text-xs text-uk-muted">
            {ukText(report.period)}{ukText("· PDF · A4")}</p>
        </div>
        <a
          href={ukText(report.file)}
          download
          className="btn-sheen btn-lift group inline-flex items-center gap-2 rounded-full bg-uk-blue px-4 py-2 text-sm font-semibold text-uk-white shadow-glow-blue-sm hover:bg-uk-blue-bright"
        >
          <Download className="h-4 w-4" />{ukText("Download PDF")}</a>
      </div>

      <p className="text-sm leading-relaxed text-uk-gray sm:text-base">{ukText(report.summary)}</p>

      <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {report.highlights.map((hl) => (
          <li key={hl} className="flex items-start gap-2.5 text-sm leading-snug text-uk-body">
            <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-uk-blue/12 text-uk-blue">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            {ukText(hl)}
          </li>
        ))}
      </ul>

      <div className="rounded-2xl border border-uk-line bg-uk-surface p-4 sm:p-5">
        <BarChart chart={report.chart} id={`chart-${report.slug}`} />
      </div>
    </article>
  );
}

/** Full "Reports" section listing every published report. */
export function ReportsSection({
  eyebrow = "Reports",
  title = (
    <>{ukText("Published numbers, ")}<span className="text-uk-blue">{ukText("not marketing claims.")}</span>
    </>
  ),
  description = "Downloadable reports we refresh on a schedule: how delivery is performing, and what custom software actually costs in India. Read them before you talk to us.",
  className,
}: {
  eyebrow?: string;
  title?: React.ReactNode;
  description?: string;
  className?: string;
}) {
  return (
    <section id="reports" className={cn("relative bg-uk-surface-2 section-py scroll-mt-24", className)}>
      <div className="relative mx-auto max-w-7xl pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] lg:px-8">
        <SectionHeading align="center" eyebrow={ukText(eyebrow)} title={ukText(title)} description={ukText(description)} />
        <Reveal staggerChildren className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {reports.map((r) => (
            <ReportCard key={r.slug} report={r} />
          ))}
        </Reveal>
      </div>
    </section>
  );
}
