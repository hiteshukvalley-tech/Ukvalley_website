"use client";

import Link from "@/components/site/intent-link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, MapPin, Search, SearchX } from "lucide-react";
import { ApplyButton } from "@/components/site/career-apply";
import type { JobListing } from "@/components/site/careers-board";
import { formatExperience, hasWords } from "@/lib/careers-shared";
import { T, Tx, useT } from "@/components/site/texts-context";

const SHOWN = 5;
const field =
  "h-12 w-full rounded-xl border border-uk-line bg-uk-surface pl-10 pr-3 text-base text-uk-heading outline-none transition-colors placeholder:text-uk-muted focus:border-uk-blue sm:text-sm";

/**
 * The Careers hero search. Type a job title and/or location, press Search
 * (or Enter) and the matching roles appear right under the box — no page
 * reload, so a candidate never has to hunt for them further down. An empty
 * search lists every open role. "See all" hands the same words to the full
 * list below.
 */
export function HeroJobSearch({ jobs, total }: { jobs: JobListing[]; total: number }) {
  const t = useT();
  const [position, setPosition] = useState("");
  const [location, setLocation] = useState("");
  /** What was searched for; null until the visitor presses Search. */
  const [applied, setApplied] = useState<{ position: string; location: string } | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    // One-time prefill from a shared link, after hydration.
    /* eslint-disable react-hooks/set-state-in-effect */
    const fromUrl = { position: (q.get("position") ?? "").slice(0, 80), location: (q.get("location") ?? "").slice(0, 80) };
    setPosition(fromUrl.position);
    setLocation(fromUrl.location);
    if (fromUrl.position.trim() || fromUrl.location.trim()) setApplied(fromUrl);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const searching = applied !== null;
  const results = useMemo(
    () =>
      applied
        ? jobs.filter(
            (j) =>
              hasWords(`${j.role} ${j.summary} ${j.type}`, applied.position) &&
              hasWords(`${j.location} ${j.mode}`, applied.location)
          )
        : [],
    [jobs, applied]
  );
  const filtered = Boolean(applied && (applied.position.trim() || applied.location.trim()));

  function search(e: React.FormEvent) {
    e.preventDefault();
    const next = { position: position.trim(), location: location.trim() };
    setApplied(next);
    // Keep the address shareable without reloading the page.
    const params = new URLSearchParams(window.location.search);
    for (const k of ["position", "location"] as const) {
      if (next[k]) params.set(k, next[k]);
      else params.delete(k);
    }
    const qs = params.toString();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
    // Enter closes the phone keyboard so the results are visible.
    (document.activeElement as HTMLElement | null)?.blur();
  }

  function clear() {
    setPosition("");
    setLocation("");
    setApplied(null);
    window.history.replaceState(window.history.state, "", window.location.pathname);
  }
  const locations = useMemo(() => Array.from(new Set(jobs.flatMap((j) => [j.location, j.mode]))), [jobs]);

  const qs = new URLSearchParams();
  if (applied?.position.trim()) qs.set("position", applied.position.trim());
  if (applied?.location.trim()) qs.set("location", applied.location.trim());
  const allHref = `/careers${qs.toString() ? `?${qs}` : ""}#open-roles`;

  return (
    <div className="mt-8 max-w-4xl">
      <form
        action="/careers#open-roles"
        method="get"
        onSubmit={search}
        role="search"
        aria-label="Search jobs"
        className="grid grid-cols-1 gap-3 rounded-2xl border border-uk-line bg-uk-card p-3 shadow-premium sm:grid-cols-[1.3fr_1fr_auto] sm:p-4"
      >
        <label className="relative block">
          <span className="sr-only"><T>Job title or keyword</T></span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-uk-blue" aria-hidden />
          <input
            name="position"
            type="search"
            maxLength={80}
            autoComplete="off"
            list="hero-roles"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder={t("Job title or keyword")}
            className={field}
          />
          <datalist id="hero-roles">{jobs.map((j) => <option key={j.slug} value={j.role} />)}</datalist>
        </label>
        <label className="relative block">
          <span className="sr-only"><T>Location</T></span>
          <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-uk-blue" aria-hidden />
          <input
            name="location"
            type="search"
            maxLength={80}
            autoComplete="off"
            list="hero-locations"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t("Location (e.g. Pune, Remote)")}
            className={field}
          />
          <datalist id="hero-locations">{locations.map((o) => <option key={o} value={o} />)}</datalist>
        </label>
        <button
          type="submit"
          className="btn-sheen inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-uk-blue px-7 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright"
        >
          <Search className="h-4 w-4" aria-hidden /><T>Search jobs</T>
        </button>
      </form>

      <p aria-live="polite" className="mt-4 text-sm text-uk-muted">
        {searching ? (
          filtered ? (
            <>
              <span className="font-semibold text-uk-heading"><Tx>{results.length}</Tx></span> of {total} open role{total === 1 ? "" : "s"} match your search
            </>
          ) : (
            <>
              <T>Showing all</T> <span className="font-semibold text-uk-heading"><Tx>{total}</Tx></span> <Tx>{`open role${total === 1 ? "" : "s"}`}</Tx>
            </>
          )
        ) : (
          <>
            <span className="font-semibold text-uk-heading"><Tx>{total}</Tx></span> <Tx>{`open role${total === 1 ? "" : "s"}`}</Tx> <Tx>· Pune, Nagpur &amp; remote across India</Tx>
          </>
        )}
      </p>

      {searching && results.length > 0 && (
        <div className="mt-3 overflow-hidden rounded-2xl border border-uk-line bg-uk-card shadow-premium">
          <ul className="divide-y divide-uk-line">
            {results.slice(0, SHOWN).map((j) => (
              <li key={j.slug} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
                <div className="min-w-0">
                  <Link href={`/careers/${j.slug}`} className="font-heading text-base font-bold text-uk-heading transition-colors hover:text-uk-blue">
                    <Tx>{j.role}</Tx>
                  </Link>
                  <p className="mt-0.5 text-xs text-uk-gray">
                    <Tx>{j.location}</Tx> · <Tx>{j.mode}</Tx> · <Tx>{j.type}</Tx> · <Tx>{formatExperience(j.experienceMin, j.experienceMax)}</Tx>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link href={`/careers/${j.slug}`} className="text-sm font-semibold text-uk-blue hover:text-uk-blue-bright">
                    <T>View details</T>
                  </Link>
                  <ApplyButton
                    position={j.role}
                    className="inline-flex items-center gap-1.5 rounded-full bg-uk-blue px-4 py-2 text-sm font-semibold text-uk-white transition-colors hover:bg-uk-blue-bright"
                  >
                    <T>Apply</T><ArrowRight className="h-3.5 w-3.5" />
                  </ApplyButton>
                </div>
              </li>
            ))}
          </ul>
          <a
            href={allHref}
            className="flex items-center justify-center gap-1.5 border-t border-uk-line bg-uk-surface-2 px-4 py-3 text-sm font-semibold text-uk-blue transition-colors hover:text-uk-blue-bright"
          >
            {results.length > SHOWN ? `See all ${results.length} ${filtered ? "matching " : ""}roles` : "See these roles in the full list"}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      )}

      {searching && results.length === 0 && (
        <div className="mt-3 rounded-2xl border border-dashed border-uk-line bg-uk-card p-6 text-center">
          <SearchX className="mx-auto h-7 w-7 text-uk-blue" aria-hidden />
          <p className="mt-2 font-heading text-base font-bold text-uk-heading"><T>No roles match that search</T></p>
          <p className="mx-auto mt-1 max-w-md text-sm text-uk-body">
            <T>Try a broader job title or a different location — or send us an open application and we&apos;ll reach out when something fits.</T>
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={clear}
              className="rounded-full border border-uk-line px-5 py-2 text-sm font-semibold text-uk-heading transition-colors hover:border-uk-blue/50 hover:text-uk-blue"
            >
              <T>Clear search</T>
            </button>
            <ApplyButton className="inline-flex items-center gap-2 rounded-full bg-uk-blue px-5 py-2 text-sm font-semibold text-uk-white transition-colors hover:bg-uk-blue-bright">
              <T>Send an open application</T><ArrowRight className="h-4 w-4" />
            </ApplyButton>
          </div>
        </div>
      )}
    </div>
  );
}
