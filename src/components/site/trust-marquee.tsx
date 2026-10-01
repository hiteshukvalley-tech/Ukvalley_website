import { trustedBy } from "@/lib/site-data";

export function TrustMarquee() {
  const items = [...trustedBy, ...trustedBy];
  return (
    <section className="relative overflow-hidden border-y border-uk-line bg-white dark:bg-uk-card py-10">
      {/* edge node dots — circuit motif */}
      <div className="pointer-events-none absolute inset-y-0 left-6 hidden items-center lg:flex" aria-hidden>
        <span className="node-pulse h-2 w-2 rounded-full bg-uk-blue" />
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-6 hidden items-center lg:flex" aria-hidden>
        <span className="node-pulse h-2 w-2 rounded-full bg-uk-yellow" style={{ animationDelay: "0.8s" }} />
      </div>
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <p className="mb-7 text-center text-xs font-semibold uppercase tracking-[0.28em] text-uk-heading">
          Trusted by 150+ businesses · Products &amp; platforms in production
        </p>
        <div className="relative overflow-hidden mask-fade-x">
          <div className="marquee-track flex w-max items-center gap-12">
            {items.map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="font-heading whitespace-nowrap text-xl font-bold text-uk-heading/75 transition-colors hover:text-uk-blue"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}