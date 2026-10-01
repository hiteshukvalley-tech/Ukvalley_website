import Link from "@/components/site/intent-link";
import {
  Wrench, Newspaper, Trophy, Boxes, Puzzle, Building2, UserPlus, MapPin,
  Users, Briefcase, MessageSquareQuote, HelpCircle, ExternalLink, CircleCheck,
  CircleAlert, Info, ArrowUpRight, Inbox, Image as ImageIcon,
} from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { adminNav } from "@/components/admin/nav";
import { checkDatabase } from "@/lib/db/client";
import { getServices } from "@/lib/services-store";
import { getPosts } from "@/lib/blog-store";
import { getCaseStudies } from "@/lib/cases-store";
import { getProducts } from "@/lib/products-store";
import { getSolutions } from "@/lib/solutions-store";
import { getIndustries } from "@/lib/industries-store";
import { getHireRoles } from "@/lib/hire-store";
import { getTestimonials } from "@/lib/testimonials-store";
import { getFaqs } from "@/lib/faqs-store";
import { countNewLeads } from "@/lib/leads-store";
import { countMedia } from "@/lib/media-store";
import { getTeam } from "@/lib/team-store";
import { getCareers } from "@/lib/careers-store";
import { getLocations } from "@/lib/locations-store";

export const metadata = { title: "Dashboard" };
// Reads env vars / live data on each request.
export const dynamic = "force-dynamic";

const content = (serviceCount: number, postCount: number, caseCount: number, productCount: number, solutionCount: number, industryCount: number, hireCount: number, locationCount: number, teamCount: number, careerCount: number, testimonialCount: number, faqCount: number) => [
  { label: "Services", value: serviceCount, icon: Wrench, href: "/admin/services" },
  { label: "Blog posts", value: postCount, icon: Newspaper, href: "/admin/blog" },
  { label: "Case studies", value: caseCount, icon: Trophy, href: "/admin/case-studies" },
  { label: "Products", value: productCount, icon: Boxes, href: "/admin/products" },
  { label: "Solutions", value: solutionCount, icon: Puzzle, href: "/admin/solutions" },
  { label: "Industries", value: industryCount, icon: Building2, href: "/admin/industries" },
  { label: "Hire roles", value: hireCount, icon: UserPlus, href: "/admin/hire" },
  { label: "Locations", value: locationCount, icon: MapPin, href: "/admin/locations" },
  { label: "Team members", value: teamCount, icon: Users, href: "/admin/team" },
  { label: "Open careers", value: careerCount, icon: Briefcase, href: "/admin/careers" },
  { label: "Testimonials", value: testimonialCount, icon: MessageSquareQuote, href: "/admin/testimonials" },
  { label: "FAQs", value: faqCount, icon: HelpCircle, href: "/admin/faqs" },
];

type Check = { label: string; tone: "ok" | "warn" | "info"; text: string };

async function getStatusChecks(): Promise<Check[]> {
  const db = await checkDatabase();
  const loginOk = Boolean(
    process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && process.env.AUTH_SECRET
  );
  return [
    {
      label: "Admin login",
      tone: loginOk ? "ok" : "warn",
      text: loginOk ? "Configured" : "Set ADMIN_EMAIL, ADMIN_PASSWORD and AUTH_SECRET",
    },
    {
      label: "Database",
      tone: db.state === "connected" ? "ok" : "warn",
      text:
        db.state === "connected"
          ? `Connected (MongoDB “${db.name}”, ${db.ms} ms)`
          : db.state === "missing"
            ? "Not connected — add MONGODB_URI to .env.local"
            : `Connection failed — ${db.message}`,
    },
    {
      label: "Environment",
      tone: "info",
      text: process.env.NODE_ENV === "production" ? "Production" : "Development (local)",
    },
  ];
}

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const { denied } = await searchParams;
  // Every read is independent, so run them together: one round trip to the
  // database instead of ~15 in a row.
  const [
    statusChecks, posts, services, cases, products, solutions, industries,
    hireRoles, locations, team, careers, testimonials, faqs, newLeads, mediaCount,
  ] = await Promise.all([
    getStatusChecks(), getPosts(), getServices(), getCaseStudies(), getProducts(), getSolutions(),
    getIndustries(), getHireRoles(), getLocations(), getTeam(), getCareers(), getTestimonials(),
    getFaqs(), countNewLeads(), countMedia(),
  ]);
  const cards = content(services.length, posts.length, cases.length, products.length, solutions.length, industries.length, hireRoles.length, locations.length, team.length, careers.length, testimonials.length, faqs.length);
  const nextUp = adminNav.flatMap((g) => g.items).filter((i) => !i.ready);
  const recentPosts = posts.slice(0, 5);
  const total = cards.reduce((n, c) => n + c.value, 0);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`${total} content items across ${cards.length} sections. Counts are read from the site's current content.`}
        action={
          <Link
            href="/"
            target="_blank"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-uk-line bg-uk-card px-3 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
          >
            View live site <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        }
      />

      {denied && (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>That page is for admins only. Ask an admin if you need access.</span>
        </div>
      )}

      <section aria-labelledby="leads-heading" className="mb-8">
        <h2 id="leads-heading" className="mb-3 font-heading text-lg font-semibold text-uk-heading">
          Inbox &amp; media
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          <StatCard
            label="New leads"
            value={newLeads ?? "—"}
            icon={Inbox}
            href="/admin/leads"
            hint={newLeads === null ? "Database not connected" : newLeads === 0 ? "All caught up" : "Waiting for a reply"}
          />
          <StatCard
            label="Media files"
            value={mediaCount ?? "—"}
            icon={ImageIcon}
            href="/admin/media"
            hint={mediaCount === null ? "Database not connected" : undefined}
          />
        </div>
      </section>

      <section aria-labelledby="content-heading">
        <h2 id="content-heading" className="mb-3 font-heading text-lg font-semibold text-uk-heading">
          Content overview
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {cards.map((c) => (
            <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} href={"href" in c ? c.href : undefined} />
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <section className="rounded-2xl border border-uk-line bg-uk-card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-uk-heading">Latest blog posts</h2>
            <Link href="/admin/blog" className="text-xs font-medium text-uk-blue hover:text-uk-blue-bright">Manage posts</Link>
          </div>
          <ul className="divide-y divide-uk-line">
            {recentPosts.map((p) => (
              <li key={p.slug} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-uk-heading">{p.title}</p>
                  <p className="mt-0.5 text-xs text-uk-muted">
                    {p.category} · {p.readTime}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-uk-muted">{p.date}</span>
                  <Link
                    href={`/blog/${p.slug}`}
                    target="_blank"
                    aria-label={`View ${p.title}`}
                    className="text-uk-muted hover:text-uk-blue"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-uk-line bg-uk-card p-6">
          <h2 className="mb-4 font-heading text-lg font-semibold text-uk-heading">System status</h2>
          <ul className="space-y-4">
            {statusChecks.map((s) => (
              <li key={s.label} className="flex items-start gap-3">
                {s.tone === "ok" ? (
                  <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                ) : s.tone === "warn" ? (
                  <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                ) : (
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-uk-blue" />
                )}
                <div>
                  <p className="text-sm font-semibold text-uk-heading">{s.label}</p>
                  <p className="text-xs text-uk-muted">{s.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-8 rounded-2xl border border-uk-line bg-uk-card p-6">
        <h2 className="font-heading text-lg font-semibold text-uk-heading">Admin roadmap</h2>
        <p className="mt-1 text-sm text-uk-muted">
          Pages are built one at a time. {nextUp.length} planned pages are still to come.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-uk-blue px-3 py-1 text-xs font-semibold text-uk-white">
            <CircleCheck className="h-3.5 w-3.5" /> Foundation
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-uk-blue px-3 py-1 text-xs font-semibold text-uk-white">
            <CircleCheck className="h-3.5 w-3.5" /> Dashboard
          </span>
          {nextUp.map((i) => (
            <span
              key={i.href}
              className="rounded-full bg-uk-surface-3 px-3 py-1 text-xs font-medium text-uk-muted"
            >
              {i.label}
            </span>
          ))}
        </div>
      </section>
    </>
  );
}
