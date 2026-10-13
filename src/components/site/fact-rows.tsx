import { Reveal } from "./reveal";

/**
 * A bordered list of "— fact | what it means" rows (the reference site's
 * contact/leadership details block). `term` may be a link.
 */
export function FactRows({ rows }: { rows: { term: React.ReactNode; desc: React.ReactNode }[] }) {
  return (
    <Reveal>
      <dl className="divide-y divide-uk-line rounded-2xl border border-uk-line bg-uk-card px-5 shadow-float sm:px-7">
        {rows.map((r, i) => (
          <div key={i} className="grid gap-1 py-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:items-center sm:gap-6">
            <dt className="flex items-center gap-3 font-heading text-base font-semibold text-uk-heading">
              <span className="h-0.5 w-4 flex-none rounded-full bg-uk-blue" aria-hidden />
              <span className="min-w-0 break-words">{r.term}</span>
            </dt>
            <dd className="pl-7 text-sm leading-relaxed text-uk-gray sm:pl-0">{r.desc}</dd>
          </div>
        ))}
      </dl>
    </Reveal>
  );
}
