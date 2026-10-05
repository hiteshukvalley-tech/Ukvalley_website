"use client";

import Link from "@/components/site/intent-link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Award, Briefcase, Building2, CalendarDays, Laptop, MapPin, RotateCcw, Search, SearchX, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ApplyButton } from "@/components/site/career-apply";
import { T, Tx, useT } from "@/components/site/texts-context";
import {
  NEW_ROLE_DAYS, daysSincePosted, formatExperience, formatPostedDate, hasWords, matchesExperience, postedLabel, todayInIndia,
  type JobMode,
} from "@/lib/careers-shared";

/** What a listing card needs — a slimmed-down Career. */
export type JobListing = {
  slug: string;
  role: string;
  summary: string;
  location: string;
  type: string;
  mode: JobMode;
  experienceMin: number;
  experienceMax?: number;
  postedAt: string;
};

type Filters = { position: string; location: string; experience: string };
const EMPTY: Filters = { position: "", location: "", experience: "" };
const KEYS = Object.keys(EMPTY) as (keyof Filters)[];

export function ModeBadge({ mode }: { mode: JobMode }) {
  const Icon = mode === "Remote" ? Laptop : mode === "Hybrid" ? Users : Building2;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-uk-blue/25 bg-uk-blue/10 px-2.5 py-0.5 text-[0.7rem] font-semibold text-uk-blue">
      <Icon className="h-3 w-3" aria-hidden />
      <Tx>{mode}</Tx>
    </span>
  );
}

/**
 * Open-roles list with separate position / location / experience search
 * boxes. Filters live in the URL (?position=&location=&experience=) so a
 * search can be shared or bookmarked, and survive Back from a job page.
 */
export function CareersBoard({ jobs }: { jobs: JobListing[] }) {
  const t = useT();
  const [filters, setFilters] = useState<Filters>(EMPTY);
  // Relative dates ("3 days ago") need the visitor's clock, so they appear
  // after hydration; the server renders the absolute date.
  const [today, setToday] = useState<string>();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = { ...EMPTY };
    for (const k of KEYS) fromUrl[k] = (params.get(k) ?? "").slice(0, 80);
    // One-time sync from the URL and the clock after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilters(fromUrl);
    setToday(todayInIndia());
  }, []);

  function apply(next: Filters) {
    setFilters(next);
    const params = new URLSearchParams(window.location.search);
    for (const k of KEYS) {
      if (next[k].trim()) params.set(k, next[k].trim());
      else params.delete(k);
    }
    const qs = params.toString();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`);
  }
  const update = (key: keyof Filters, value: string) => apply({ ...filters, [key]: value });
  const clearAll = () => apply(EMPTY);

  const results = useMemo(
    () =>
      jobs.filter(
        (j) =>
          hasWords(`${j.role} ${j.summary} ${j.type}`, filters.position) &&
          hasWords(`${j.location} ${j.mode}`, filters.location) &&
          matchesExperience(filters.experience, j.experienceMin, j.experienceMax)
      ),
    [jobs, filters]
  );

  const filtering = KEYS.some((k) => filters[k].trim());
  const locationSuggestions = useMemo(
    () => Array.from(new Set(jobs.flatMap((j) => [j.location, j.mode]))),
    [jobs]
  );

  return (
    <div className="mt-10 flex flex-col gap-6">
      <form
        role="search"
        aria-label="Search open roles"
        onSubmit={(e) => {
          e.preventDefault();
          // Enter closes the phone keyboard so the results are visible.
          (document.activeElement as HTMLElement | null)?.blur();
        }}
        className="rounded-2xl border border-uk-line bg-uk-card p-4 shadow-premium sm:p-5"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <SearchField
            id="job-position"
            label="Position"
            icon={Search}
            placeholder={t("e.g. React, Flutter, Designer")}
            value={filters.position}
            onChange={(v) => update("position", v)}
            list="job-position-list"
            options={jobs.map((j) => j.role)}
          />
          <SearchField
            id="job-location"
            label="Location"
            icon={MapPin}
            placeholder={t("e.g. Pune, Remote, Hybrid")}
            value={filters.location}
            onChange={(v) => update("location", v)}
            list="job-location-list"
            options={locationSuggestions}
          />
          <SearchField
            id="job-experience"
            label="Experience (years)"
            icon={Award}
            placeholder={t("Your years, e.g. 3 or 0 for fresher")}
            value={filters.experience}
            onChange={(v) => update("experience", v)}
            inputMode="numeric"
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-uk-line pt-3">
          <p aria-live="polite" className="text-sm text-uk-muted">
            {filtering ? (
              <>
                <span className="font-semibold text-uk-heading"><Tx>{results.length}</Tx></span> <T>of</T> {jobs.length}{" "}
                {jobs.length === 1 ? <T>open role matches your search</T> : <T>open roles match your search</T>}
              </>
            ) : (
              <>
                <span className="font-semibold text-uk-heading"><Tx>{jobs.length}</Tx></span> <Tx>{`open role${jobs.length === 1 ? "" : "s"}`}</Tx>
              </>
            )}
          </p>
          {filtering && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-uk-blue transition-colors hover:bg-uk-blue/10"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              <T>Clear search</T>
            </button>
          )}
        </div>
      </form>

      {results.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {results.map((j) => (
            <JobCard key={j.slug} job={j} today={today} />
          ))}
        </ul>
      ) : (
        jobs.length > 0 && (
          <div className="rounded-2xl border border-dashed border-uk-line bg-uk-card p-8 text-center">
            <SearchX className="mx-auto h-8 w-8 text-uk-blue" aria-hidden />
            <p className="mt-3 font-heading text-lg font-bold text-uk-heading"><T>No roles match that search</T></p>
            <p className="mx-auto mt-1 max-w-md text-sm text-uk-body">
              <T>Try a broader position or location, or clear the experience box. You can also send us an open application —
              we hire for people, not just open roles.</T>
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-2 rounded-full border border-uk-line px-5 py-2.5 text-sm font-semibold text-uk-heading transition-colors hover:border-uk-blue/50 hover:text-uk-blue"
              >
                <RotateCcw className="h-4 w-4" aria-hidden /> <T>Clear search</T>
              </button>
              <ApplyButton className="inline-flex items-center gap-2 rounded-full bg-uk-blue px-5 py-2.5 text-sm font-semibold text-uk-white transition-colors hover:bg-uk-blue-bright">
                <T>Send an open application</T> <ArrowRight className="h-4 w-4" />
              </ApplyButton>
            </div>
          </div>
        )
      )}
    </div>
  );
}

function SearchField({
  id, label, icon: Icon, placeholder, value, onChange, list, options, inputMode,
}: {
  id: string;
  label: string;
  icon: typeof Search;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  list?: string;
  options?: string[];
  inputMode?: "numeric";
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-[0.14em] text-uk-muted">
        <Tx>{label}</Tx>
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-uk-blue" aria-hidden />
        <Input
          id={id}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={80}
          autoComplete="off"
          enterKeyHint="search"
          inputMode={inputMode}
          list={list}
          // text-base on phones: iOS zooms into fields under 16px.
          className="h-11 pl-9 pr-3 text-base sm:text-sm"
        />
        {list && options && (
          <datalist id={list}>
            {options.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        )}
      </div>
    </div>
  );
}

function JobCard({ job: j, today }: { job: JobListing; today?: string }) {
  const isNew = today !== undefined && daysSincePosted(j.postedAt, today) <= NEW_ROLE_DAYS;
  return (
    <li className="group relative flex flex-col gap-4 rounded-2xl border border-uk-line bg-uk-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-uk-blue/40 hover:shadow-premium-lg sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <ModeBadge mode={j.mode} />
          {isNew && (
            <span className="rounded-full bg-uk-yellow px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-[#151122]">
              <T>New</T>
            </span>
          )}
        </div>
        <h3 className="font-heading text-lg font-bold text-uk-heading">
          {/* The link's ::after covers the whole card, so a click anywhere opens the job. */}
          <Link href={`/careers/${j.slug}`} className="transition-colors after:absolute after:inset-0 after:rounded-2xl group-hover:text-uk-blue">
            <Tx>{j.role}</Tx>
          </Link>
        </h3>
        <p className="text-sm text-uk-gray"><Tx>{j.summary}</Tx></p>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-uk-gray" aria-label="Job details">
          <li className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-uk-blue" aria-hidden />
            <span className="sr-only"><T>Location:</T> </span>
            <Tx>{j.location}</Tx>
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 text-uk-blue" aria-hidden />
            <span className="sr-only"><T>Employment type:</T> </span>
            <Tx>{j.type}</Tx>
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5 text-uk-blue" aria-hidden />
            <span className="sr-only"><T>Experience:</T> </span>
            <Tx>{formatExperience(j.experienceMin, j.experienceMax)}</Tx>
          </li>
          <li className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-uk-blue" aria-hidden />
            <time dateTime={j.postedAt} title={formatPostedDate(j.postedAt)}>
              <Tx>{today ? postedLabel(j.postedAt, today) : `Posted ${formatPostedDate(j.postedAt)}`}</Tx>
            </time>
          </li>
        </ul>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-3 sm:flex-col sm:items-end">
        {/* relative z-10: sits above the card-wide link so it opens the form instead */}
        <ApplyButton
          position={j.role}
          className="relative z-10 inline-flex w-fit items-center gap-2 rounded-full border border-uk-line bg-white px-5 py-2.5 text-sm font-semibold text-uk-heading transition-colors group-hover:border-uk-blue/50 group-hover:text-uk-blue-bright dark:bg-uk-card"
        >
          <T>Apply</T>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </ApplyButton>
        <span className="text-xs font-semibold text-uk-blue" aria-hidden>
          <T>View details & hiring process →</T>
        </span>
      </div>
    </li>
  );
}
