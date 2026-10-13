import Link from "@/components/site/intent-link";
import {
  Wrench, Newspaper, Trophy, Boxes, Puzzle, Building2, UserPlus, MapPin,
  Users, Briefcase, MessageSquareQuote, HelpCircle, ExternalLink, CircleCheck,
  CircleAlert, Info, ArrowUpRight, Inbox, /* Image as ImageIcon, */ House, EyeOff, FileUser, CalendarClock, CalendarCheck, ArrowRight,
  CalendarDays, Hourglass, UserRound,
} from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { checkDatabase } from "@/lib/db/client";
import { HOME_SECTIONS } from "@/lib/home-schema";
import { getHomeForAdmin } from "@/lib/home-store";
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
import { countNewApplications, listApplications } from "@/lib/applications-store";
import { listInterviews } from "@/lib/interviews-store";
import { formatPostedDate, todayInIndia } from "@/lib/careers-shared";
import { InterviewRow, formatInterviewDay, formatInterviewTime, relativeDay } from "./interviews/interview-ui";
import { ApplicationStatusBadge } from "./applications/application-ui";
import { applicantsHref, roleRows } from "./applications/applications-list";
import { getProfile } from "@/lib/profiles-store";
import { firstName } from "@/lib/profile-validation";
// import { countMedia } from "@/lib/media-store"; // Media card hidden (see below)
import { getTeam } from "@/lib/team-store";
import { getCareers } from "@/lib/careers-store";
import { getLocations } from "@/lib/locations-store";
import { requireAdmin } from "@/lib/admin-session";
import { canOpenPath, canUseArea } from "@/lib/admin-access";

export const metadata = { title: "Dashboard" };
// Reads env vars / live data on each request.
export const dynamic = "force-dynamic";

const content = (serviceCount: number, postCount: number, caseCount: number, productCount: number, solutionCount: number, industryCount: number, hireCount: number, locationCount: number, teamCount: number, careerCount: number, testimonialCount: number, faqCount: number) => [
  { label: "Open careers", value: careerCount, icon: Briefcase, href: "/admin/careers" },
  { label: "Services", value: serviceCount, icon: Wrench, href: "/admin/services" },
  { label: "Blog posts", value: postCount, icon: Newspaper, href: "/admin/blog" },
  { label: "Case studies", value: caseCount, icon: Trophy, href: "/admin/case-studies" },
  { label: "Products", value: productCount, icon: Boxes, href: "/admin/products" },
  { label: "Solutions", value: solutionCount, icon: Puzzle, href: "/admin/solutions" },
  { label: "Industries", value: industryCount, icon: Building2, href: "/admin/industries" },
  { label: "Hire roles", value: hireCount, icon: UserPlus, href: "/admin/hire" },
  { label: "Locations", value: locationCount, icon: MapPin, href: "/admin/locations" },
  { label: "Team members", value: teamCount, icon: Users, href: "/admin/team" },
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

/** How many of today's applications the dashboard lists, in a scrolling box (the count covers all of them). */
const TODAYS_APPLICATIONS_SHOWN = 100;

/** How many upcoming interviews the dashboard lists, in a scrolling box (the count covers all of them). */
const UPCOMING_INTERVIEWS_SHOWN = 100;

/** "Good morning" / "Good afternoon" / "Good evening", by the time in India. */
function greeting(): string {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format(new Date()));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

const appliedAt = (d: Date) => d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const { denied } = await searchParams;
  // Team members see only what belongs to their sections (Admin → Users).
  const me = await requireAdmin();
  const isAdmin = me.role === "admin";
  const can = (area: string) => canUseArea(me.role, me.access, area);
  const today = todayInIndia();
  // Every read is independent, so run them together: one round trip to the
  // database instead of ~15 in a row.
  const [
    statusChecks, posts, services, cases, products, solutions, industries,
    hireRoles, locations, team, careers, testimonials, faqs, newLeads, newApplications, /* mediaCount, */ home,
    interviews, todaysApplications, allApplications, allInterviews, profile,
  ] = await Promise.all([
    getStatusChecks(), getPosts(), getServices(), getCaseStudies(), getProducts(), getSolutions(),
    getIndustries(), getHireRoles(), getLocations(), getTeam(), getCareers(), getTestimonials(),
    getFaqs(), countNewLeads(), countNewApplications(), /* countMedia(), */ getHomeForAdmin(),
    // Only today's interviews here; every day is in Careers → Daily interviews.
    can("applications") ? listInterviews({ from: today, to: today }) : null,
    // Applications received today (India time), newest first; the rest are in Careers → Today's applications.
    can("applications") ? listApplications({ from: today, pageSize: TODAYS_APPLICATIONS_SHOWN }) : null,
    // Every application (only the counts and per-role totals are used).
    can("applications") ? listApplications({ pageSize: 1 }) : null,
    // Every interview ever scheduled; the upcoming ones are listed below.
    can("applications") ? listInterviews({ from: "0000-01-01", to: "9999-12-31" }) : null,
    getProfile(me),
  ]);
  const upcoming = allInterviews ? allInterviews.items.filter((i) => i.date >= today) : [];
  // Every job opening with its applications (all time and today), plus roles that are no longer open.
  const todayByRole = new Map((todaysApplications?.roles ?? []).map((r) => [r.position.toLowerCase(), r.total]));
  const jobRows = allApplications ? roleRows(allApplications.roles, careers) : [];
  const cards = content(services.length, posts.length, cases.length, products.length, solutions.length, industries.length, hireRoles.length, locations.length, team.length, careers.length, testimonials.length, faqs.length)
    .filter((c) => canOpenPath(me.role, me.access, c.href));
  const editedHome = HOME_SECTIONS.filter((s) => home.updated[s.key]).length;
  const recentPosts = posts.slice(0, 5);
  const total = cards.reduce((n, c) => n + c.value, 0);

  return (
    <>
      {/* Welcome: the user's name from My profile (or their account) */}
      <div className="mb-6 flex items-center gap-4">
        {profile.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.photo} alt="" className="h-14 w-14 shrink-0 rounded-full border border-uk-line object-cover" />
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-uk-surface-blue text-uk-blue">
            <UserRound className="h-7 w-7" />
          </span>
        )}
        <div className="min-w-0">
          <p className="font-heading text-xl font-bold text-uk-heading sm:text-2xl">
            Welcome, {profile.name || firstName(undefined, me.email)}!
          </p>
          <p className="text-sm text-uk-muted">
            {greeting()}, have a good day. Today is {formatInterviewDay(today)}.
            {!profile.name && (
              <> <Link href="/admin/profile" className="font-medium text-uk-blue hover:text-uk-blue-bright">Add your name in My profile</Link>.</>
            )}
          </p>
        </div>
      </div>

      <PageHeader
        title="Dashboard"
        description={
          cards.length
            ? `${total} content item${total === 1 ? "" : "s"} across ${cards.length} section${cards.length === 1 ? "" : "s"}. Counts are read from the site's current content.`
            : "Your sections are in the menu on the left."
        }
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
          <span>That section isn't available for your account. Ask an admin if you need access.</span>
        </div>
      )}

      {/* First: what the site holds (Open careers leads), then the hiring overview */}
      {cards.length > 0 && (
      <section aria-labelledby="content-heading" className="mb-8">
        <h2 id="content-heading" className="mb-3 font-heading text-lg font-semibold text-uk-heading">
          Content overview
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {cards.map((c) => (
            <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} href={"href" in c ? c.href : undefined} />
          ))}
        </div>
      </section>
      )}

      {/* Hiring: applications, interviews and job openings at a glance */}
      {allApplications && allInterviews && todaysApplications && interviews && (
      <section aria-labelledby="hiring-heading" className="mb-8">
        <h2 id="hiring-heading" className="mb-3 font-heading text-lg font-semibold text-uk-heading">
          Hiring overview
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <StatCard
            label="All applications"
            value={allApplications.dbError ? "—" : allApplications.counts.all}
            icon={FileUser}
            href={applicantsHref()}
            hint={allApplications.dbError ? "Database not connected" : "Since the start"}
          />
          <StatCard
            label="Today's applications"
            value={todaysApplications.dbError ? "—" : todaysApplications.total}
            icon={CalendarCheck}
            href="/admin/todays-applications"
            hint={formatPostedDate(today)}
          />
          <StatCard
            label="Awaiting review"
            value={newApplications ?? "—"}
            icon={Hourglass}
            href={`${applicantsHref()}?status=new`}
            hint={newApplications === 0 ? "All reviewed" : "Still marked new"}
          />
          <StatCard
            label="All interviews"
            value={allInterviews.dbError ? "—" : allInterviews.items.length}
            icon={CalendarDays}
            href="/admin/interviews"
            hint={allInterviews.dbError ? "Database not connected" : `${upcoming.length} upcoming`}
          />
          <StatCard
            label="Today's interviews"
            value={interviews.dbError ? "—" : interviews.items.length}
            icon={CalendarClock}
            href="/admin/interviews"
            hint={formatPostedDate(today)}
          />
          <StatCard
            label="Job openings"
            value={careers.length}
            icon={Briefcase}
            href={can("careers") ? "/admin/careers" : undefined}
            hint="Shown on the Careers page"
          />
        </div>
      </section>
      )}

      {can("leads") && (
      <section aria-labelledby="leads-heading" className="mb-8">
        <h2 id="leads-heading" className="mb-3 font-heading text-lg font-semibold text-uk-heading">
          Inbox
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          <StatCard
            label="New leads"
            value={newLeads ?? "—"}
            icon={Inbox}
            href="/admin/leads"
            hint={newLeads === null ? "Database not connected" : newLeads === 0 ? "All caught up" : "Waiting for a reply"}
          />
          {/* Media is hidden from the admin panel for now (see nav.ts).
          <StatCard
            label="Media files"
            value={mediaCount ?? "—"}
            icon={ImageIcon}
            href="/admin/media"
            hint={mediaCount === null ? "Database not connected" : undefined}
          /> */}
        </div>
      </section>
      )}

      {/* Today at a glance: applications received and interviews scheduled (Careers) */}
      {(todaysApplications || interviews) && (
      <div className="mb-8 grid gap-5 lg:grid-cols-2">
      {todaysApplications && (
      <section aria-labelledby="todays-applications-heading" className="rounded-2xl border border-uk-line bg-uk-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="todays-applications-heading" className="flex items-center gap-2 font-heading text-lg font-semibold text-uk-heading">
              <CalendarCheck className="h-5 w-5 text-uk-blue" /> Today's applications
              <span className="rounded-full bg-uk-blue/12 px-2.5 py-0.5 text-xs font-semibold text-uk-blue">{todaysApplications.total}</span>
            </h2>
            <p className="mt-1 text-sm text-uk-muted">
              {formatPostedDate(today)} (India time), newest first
              {todaysApplications.counts.new > 0 && <> · <span className="font-semibold text-uk-blue">{todaysApplications.counts.new} still new</span></>}.
            </p>
          </div>
          <Link href="/admin/todays-applications" className="inline-flex items-center gap-1 text-xs font-medium text-uk-blue hover:text-uk-blue-bright">
            All of today's applications <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {todaysApplications.dbError ? (
          <p className="mt-4 text-sm text-amber-700 dark:text-amber-300">Could not read applications ({todaysApplications.dbError}).</p>
        ) : todaysApplications.items.length === 0 ? (
          <p className="mt-4 text-sm text-uk-muted">No applications received today yet.</p>
        ) : (
          <>
            <ul className="dash-scroll mt-2 max-h-72 divide-y divide-uk-line pr-2">
              {todaysApplications.items.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/applications/${a.id}`} className="truncate text-sm font-semibold text-uk-heading hover:text-uk-blue">
                        {a.name}
                      </Link>
                      <ApplicationStatusBadge status={a.status} />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-uk-muted">
                      {a.position} · {a.experience}{a.location ? ` · ${a.location}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-uk-muted">{appliedAt(a.createdAt)}</span>
                </li>
              ))}
            </ul>
            {todaysApplications.total > todaysApplications.items.length && (
              <Link href="/admin/todays-applications" className="mt-3 inline-block text-xs font-medium text-uk-blue hover:text-uk-blue-bright">
                + {todaysApplications.total - todaysApplications.items.length} more today
              </Link>
            )}
          </>
        )}
      </section>
      )}

      {interviews && (
      <section aria-labelledby="interviews-heading" className="rounded-2xl border border-uk-line bg-uk-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="interviews-heading" className="flex items-center gap-2 font-heading text-lg font-semibold text-uk-heading">
              <CalendarClock className="h-5 w-5 text-uk-blue" /> Today's interviews
              <span className="rounded-full bg-uk-blue/12 px-2.5 py-0.5 text-xs font-semibold text-uk-blue">{interviews.items.length}</span>
            </h2>
            <p className="mt-1 text-sm text-uk-muted">{formatPostedDate(today)} (India time), by time.</p>
          </div>
          <Link href="/admin/interviews" className="inline-flex items-center gap-1 text-xs font-medium text-uk-blue hover:text-uk-blue-bright">
            All interviews by day <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {interviews.dbError ? (
          <p className="mt-4 text-sm text-amber-700 dark:text-amber-300">Could not read interviews ({interviews.dbError}).</p>
        ) : interviews.items.length === 0 ? (
          <p className="mt-4 text-sm text-uk-muted">No interviews scheduled for today.</p>
        ) : (
          <ul className="dash-scroll mt-2 max-h-72 divide-y divide-uk-line pr-2">
            {interviews.items.map((i) => (
              <InterviewRow key={i.applicationId} interview={i} compact />
            ))}
          </ul>
        )}
      </section>
      )}

      </div>
      )}

      {allApplications && allInterviews && (
      <div className="mb-8 grid gap-5 lg:grid-cols-5">
        <section aria-labelledby="roles-heading" className="rounded-2xl border border-uk-line bg-uk-card lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-uk-line p-6 pb-4">
            <div>
              <h2 id="roles-heading" className="flex items-center gap-2 font-heading text-lg font-semibold text-uk-heading">
                <Briefcase className="h-5 w-5 text-uk-blue" /> Applications by job opening
              </h2>
              <p className="mt-1 text-sm text-uk-muted">Every job opening and how many people applied, in total and today.</p>
            </div>
            <Link href="/admin/applications" className="inline-flex items-center gap-1 text-xs font-medium text-uk-blue hover:text-uk-blue-bright">
              Filter by date <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {jobRows.length === 0 ? (
            <p className="p-6 text-sm text-uk-muted">No job openings or applications yet.</p>
          ) : (
            <div className="dash-scroll max-h-72 overflow-x-auto">
              <table className="w-full min-w-[30rem] text-sm">
                <thead className="sticky top-0 z-10 bg-uk-card">
                  <tr className="border-b border-uk-line text-left text-xs uppercase tracking-wide text-uk-muted">
                    <th scope="col" className="px-6 py-2 font-medium">Job opening</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">All</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Today</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">New</th>
                    <th scope="col" className="px-6 py-2"><span className="sr-only">Applicants</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-uk-line">
                  {jobRows.map((r) => {
                    const todayCount = todayByRole.get(r.position.toLowerCase()) ?? 0;
                    return (
                      <tr key={r.position}>
                        <td className="px-6 py-2.5">
                          <span className="font-medium text-uk-heading">{r.position}</span>
                          {!r.open && <span className="ml-2 text-xs text-uk-muted">(not an open role)</span>}
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-uk-heading">{r.total}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {todayCount > 0 ? <span className="font-semibold text-uk-blue">{todayCount}</span> : <span className="text-uk-muted">0</span>}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {r.new > 0 ? <span className="rounded-full bg-uk-blue/15 px-2 py-0.5 text-xs font-semibold text-uk-blue">{r.new}</span> : <span className="text-uk-muted">0</span>}
                        </td>
                        <td className="px-6 py-2.5 text-right">
                          {r.total > 0 && (
                            <Link href={applicantsHref(r.position)} className="text-sm font-medium text-uk-blue hover:underline">
                              View
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section aria-labelledby="upcoming-heading" className="rounded-2xl border border-uk-line bg-uk-card p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="upcoming-heading" className="flex items-center gap-2 font-heading text-lg font-semibold text-uk-heading">
              <CalendarDays className="h-5 w-5 text-uk-blue" /> Upcoming interviews
              <span className="rounded-full bg-uk-blue/12 px-2.5 py-0.5 text-xs font-semibold text-uk-blue">{upcoming.length}</span>
            </h2>
            <Link href="/admin/interviews" className="inline-flex items-center gap-1 text-xs font-medium text-uk-blue hover:text-uk-blue-bright">
              All interviews <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {allInterviews.dbError ? (
            <p className="mt-4 text-sm text-amber-700 dark:text-amber-300">Could not read interviews ({allInterviews.dbError}).</p>
          ) : upcoming.length === 0 ? (
            <p className="mt-4 text-sm text-uk-muted">No interviews scheduled from today on.</p>
          ) : (
            <ul className="dash-scroll mt-2 max-h-72 divide-y divide-uk-line pr-2">
              {upcoming.slice(0, UPCOMING_INTERVIEWS_SHOWN).map((i) => (
                <li key={i.applicationId} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link href={`/admin/applications/${i.applicationId}`} className="block truncate text-sm font-semibold text-uk-heading hover:text-uk-blue">
                      {i.name}
                    </Link>
                    <p className="truncate text-xs text-uk-muted">{i.position}{i.mode ? ` · ${i.mode}` : ""}</p>
                  </div>
                  <div className="shrink-0 text-right text-xs">
                    <p className="font-semibold text-uk-heading">{relativeDay(i.date, today) || formatPostedDate(i.date)}</p>
                    <p className="text-uk-muted">{i.time ? formatInterviewTime(i.time) : "No time set"}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {upcoming.length > UPCOMING_INTERVIEWS_SHOWN && (
            <Link href="/admin/interviews" className="mt-3 inline-block text-xs font-medium text-uk-blue hover:text-uk-blue-bright">
              + {upcoming.length - UPCOMING_INTERVIEWS_SHOWN} more
            </Link>
          )}
        </section>
      </div>
      )}

      {(can("blog") || isAdmin) && (
      <div className="grid gap-5 lg:grid-cols-3">
        {can("blog") && (
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
        )}

        {/* database, owner login and mail set-up: for admins */}
        {isAdmin && (
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
        )}
      </div>
      )}

      {can("home") && (
      <section aria-labelledby="home-heading" className="mt-8 rounded-2xl border border-uk-line bg-uk-card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="home-heading" className="flex items-center gap-2 font-heading text-lg font-semibold text-uk-heading">
              <House className="h-5 w-5 text-uk-blue" /> Home page
            </h2>
            <p className="mt-1 text-sm text-uk-muted">
              {HOME_SECTIONS.length} sections, {editedHome} edited. Open one to change its text.
            </p>
          </div>
          <Link href="/admin/home" className="text-xs font-medium text-uk-blue hover:text-uk-blue-bright">All sections</Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {HOME_SECTIONS.map((s, i) => {
            const shown = home.page.visible[s.key];
            return (
              <Link
                key={s.key}
                href={`/admin/home/${s.key}`}
                className={
                  shown
                    ? "inline-flex items-center gap-1.5 rounded-full border border-uk-line px-3 py-1 text-xs font-medium text-uk-body transition-colors hover:border-uk-blue/50 hover:text-uk-blue"
                    : "inline-flex items-center gap-1.5 rounded-full border border-dashed border-uk-line px-3 py-1 text-xs font-medium text-uk-muted transition-colors hover:border-uk-blue/50 hover:text-uk-blue"
                }
                title={shown ? undefined : "Hidden on the home page"}
              >
                <span className="font-semibold text-uk-muted">{i + 1}.</span>
                {s.label}
                {!shown && <EyeOff className="h-3 w-3" />}
              </Link>
            );
          })}
        </div>
      </section>
      )}
    </>
  );
}
