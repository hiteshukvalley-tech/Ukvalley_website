import { Check, Building2, Users, FileCode2, Clock, BadgeCheck, IndianRupee } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { StatCounter } from "./stat-counter";
import { stats } from "@/lib/site-data";
import { isRealIdentifier } from "@/lib/site-core";
import { getSiteSettings } from "@/lib/settings";
import { getProducts } from "@/lib/products-store";

const differentiators = [
  {
    icon: FileCode2,
    title: "Code you own from day one",
    desc: "All source, docs and repo access are yours. We work under a signed NDA and IP assignment before any line is written.",
    detail: "No lock-in, no hostage code — ever.",
  },
  {
    icon: Clock,
    title: "24-hour response SLA",
    desc: "Stated publicly, written into every contract. A real architect replies — not a chatbot, not a sales queue.",
    detail: "Average first reply: under 4 hours.",
  },
  {
    icon: Users,
    title: "In-house engineers, not brokers",
    desc: "The team that scopes your project is the team that builds it. No freelance middlemen, no faceless offshoring pools.",
    detail: "100% salaried, in-house team.",
  },
  {
    icon: Building2,
    title: "Real product portfolio",
    desc: "TeleValley, Finvalley, BBNPlay and more — proof we build and maintain our own IP, not just billable hours.",
    detail: "", // product count is filled in from the database below
  },
  {
    icon: IndianRupee,
    title: "India cost base, enterprise quality",
    desc: "Our economics run 30–40% below metro agencies, with the same stack, process and security posture.",
    detail: "ISO-grade process at SME pricing.",
  },
  {
    icon: BadgeCheck,
    title: "Verifiable & registered",
    desc: "CIN, GSTIN and Udyam published on-site. A named contracting entity — not a Gmail and a stock photo.",
    detail: "",
  },
];

export async function WhyChoose() {
  const [productCount, company] = await Promise.all([
    getProducts().then((p) => p.length),
    getSiteSettings(),
  ]);
  const items = differentiators.map((d) => {
    if (d.title === "Real product portfolio") return { ...d, detail: `${productCount} products in production right now.` };
    if (d.title === "Verifiable & registered") {
      // Only a real CIN is shown — never the placeholder.
      return { ...d, detail: isRealIdentifier(company.cin) ? `CIN: ${company.cin}` : company.name };
    }
    return d;
  });
  return (
    <section id="why" className="relative overflow-hidden bg-uk-surface-2 section-py">
      <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-uk-blue/15 blur-[130px]" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          align="center"
          eyebrow="Why Ukvalley"
          title={
            <>
              Built to be{" "}
              <span className="text-gradient-blue">verifiable</span>, not just
              impressive.
            </>
          }
          description="Most small IT firms look the same because they make the same claims. We differentiate on the things you can actually check."
        />

        {/* stats band */}
        <Reveal
          staggerChildren
          className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-uk-line bg-uk-line lg:grid-cols-4"
        >
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1.5 bg-uk-card px-4 py-8 text-center">
              <StatCounter
                value={s.value}
                className="font-heading text-4xl font-bold text-uk-blue sm:text-5xl"
              />
              {/* strategic yellow accent under each stat */}
              <span className="h-1 w-8 rounded-full bg-uk-yellow" aria-hidden />
              <span className="text-sm font-semibold text-uk-heading">{s.label}</span>
              <span className="text-xs text-uk-gray">{s.sub}</span>
            </div>
          ))}
        </Reveal>

        {/* differentiators */}
        <Reveal
          staggerChildren
          className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((d) => (
            <div
              key={d.title}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-uk-line card-premium card-spotlight bg-uk-card"
            >
              {/* subtle top accent */}
              <div className="h-0.5 w-full bg-gradient-to-r from-uk-blue/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
              <div className="flex flex-1 flex-col gap-3 p-6">
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-uk-blue/12 text-uk-blue transition-colors group-hover:bg-uk-blue group-hover:text-uk-white">
                    <d.icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-heading text-base font-bold text-uk-heading pt-2">{d.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-uk-gray">{d.desc}</p>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-uk-blue">
                  <Check className="h-3 w-3" />
                  {d.detail}
                </span>
                <Check className="absolute right-5 top-5 h-4 w-4 text-uk-blue/30" aria-hidden />
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}