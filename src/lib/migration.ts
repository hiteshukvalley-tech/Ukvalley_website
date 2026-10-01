import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { defaultSettings, hasSavedSettings, insertSettingsIfMissing, SETTINGS_TAG } from "@/lib/settings";
import { builtInRecords as services, importBuiltInServices, SERVICES_TAG } from "@/lib/services-store";
import { builtInRecords as posts, importBuiltInPosts, BLOG_TAG } from "@/lib/blog-store";
import { builtInRecords as cases, importBuiltInCases, CASES_TAG } from "@/lib/cases-store";
import { builtInRecords as products, importBuiltInProducts, PRODUCTS_TAG } from "@/lib/products-store";
import { builtInRecords as solutions, importBuiltInSolutions, SOLUTIONS_TAG } from "@/lib/solutions-store";
import { builtInRecords as industries, importBuiltInIndustries, INDUSTRIES_TAG } from "@/lib/industries-store";
import { builtInRecords as hire, importBuiltInHire, HIRE_TAG } from "@/lib/hire-store";
import { builtInRecords as locations, importBuiltInLocations, LOCATIONS_TAG } from "@/lib/locations-store";
import { builtInRecords as team, importBuiltInTeam, TEAM_TAG } from "@/lib/team-store";
import { builtInRecords as careers, importBuiltInCareers, CAREERS_TAG } from "@/lib/careers-store";
import { builtInRecords as testimonials, importBuiltInTestimonials, TESTIMONIALS_TAG } from "@/lib/testimonials-store";
import { builtInRecords as faqs, importBuiltInFaqs, FAQS_TAG } from "@/lib/faqs-store";
import { builtInRecords as processSteps, importBuiltInProcessSteps, PROCESS_TAG } from "@/lib/process-store";
import { builtInRecords as techStack, importBuiltInTechCategories, TECH_STACK_TAG } from "@/lib/tech-stack-store";
import { builtInRecords as engagement, importBuiltInEngagementModels, ENGAGEMENT_TAG } from "@/lib/engagement-store";

/**
 * One row per editable section. Each section keeps its content in the
 * database once imported; until then the public site shows the built-in copy
 * (see each store's fallback), so importing changes nothing visible.
 */
export type MigrationSection = {
  key: string;
  label: string;
  adminHref: string;
  /** collection holding the section's documents (null = site settings document) */
  collection: string | null;
  tag: string;
  builtInCount: number;
  /** copies the built-in content in; returns how many items were added (0 = skipped) */
  run: () => Promise<number>;
};

export const migrationSections: MigrationSection[] = [
  { key: "settings", label: "Site settings", adminHref: "/admin/settings", collection: null, tag: SETTINGS_TAG, builtInCount: 1,
    run: async () => ((await insertSettingsIfMissing(defaultSettings)) ? 1 : 0) },
  { key: "services", label: "Services", adminHref: "/admin/services", collection: "services", tag: SERVICES_TAG, builtInCount: services.length, run: importBuiltInServices },
  { key: "blog", label: "Blog posts", adminHref: "/admin/blog", collection: "posts", tag: BLOG_TAG, builtInCount: posts.length, run: importBuiltInPosts },
  { key: "case-studies", label: "Case studies", adminHref: "/admin/case-studies", collection: "caseStudies", tag: CASES_TAG, builtInCount: cases.length, run: importBuiltInCases },
  { key: "products", label: "Products", adminHref: "/admin/products", collection: "products", tag: PRODUCTS_TAG, builtInCount: products.length, run: importBuiltInProducts },
  { key: "solutions", label: "Solutions", adminHref: "/admin/solutions", collection: "solutions", tag: SOLUTIONS_TAG, builtInCount: solutions.length, run: importBuiltInSolutions },
  { key: "industries", label: "Industries", adminHref: "/admin/industries", collection: "industries", tag: INDUSTRIES_TAG, builtInCount: industries.length, run: importBuiltInIndustries },
  { key: "hire", label: "Hire roles", adminHref: "/admin/hire", collection: "hireRoles", tag: HIRE_TAG, builtInCount: hire.length, run: importBuiltInHire },
  { key: "locations", label: "Locations", adminHref: "/admin/locations", collection: "locations", tag: LOCATIONS_TAG, builtInCount: locations.length, run: importBuiltInLocations },
  { key: "team", label: "Team", adminHref: "/admin/team", collection: "teamMembers", tag: TEAM_TAG, builtInCount: team.length, run: importBuiltInTeam },
  { key: "careers", label: "Careers", adminHref: "/admin/careers", collection: "careers", tag: CAREERS_TAG, builtInCount: careers.length, run: importBuiltInCareers },
  { key: "testimonials", label: "Testimonials", adminHref: "/admin/testimonials", collection: "testimonials", tag: TESTIMONIALS_TAG, builtInCount: testimonials.length, run: importBuiltInTestimonials },
  { key: "faqs", label: "FAQs", adminHref: "/admin/faqs", collection: "faqs", tag: FAQS_TAG, builtInCount: faqs.length, run: importBuiltInFaqs },
  { key: "process", label: "Process", adminHref: "/admin/process", collection: "processSteps", tag: PROCESS_TAG, builtInCount: processSteps.length, run: importBuiltInProcessSteps },
  { key: "tech-stack", label: "Tech stack", adminHref: "/admin/tech-stack", collection: "techCategories", tag: TECH_STACK_TAG, builtInCount: techStack.length, run: importBuiltInTechCategories },
  { key: "engagement", label: "Engagement", adminHref: "/admin/engagement", collection: "engagementModels", tag: ENGAGEMENT_TAG, builtInCount: engagement.length, run: importBuiltInEngagementModels },
];

export type SectionStatus = {
  key: string;
  label: string;
  adminHref: string;
  builtInCount: number;
  /** items currently in the database */
  dbCount: number;
  state: "migrated" | "pending";
};

/** What is in the database for each section. Throws if the database can't be read. */
export async function getMigrationStatus(): Promise<SectionStatus[]> {
  const db = getDb();
  return Promise.all(
    migrationSections.map(async (s) => {
      const dbCount =
        s.collection === null
          ? (await hasSavedSettings())
            ? 1
            : 0
          : await db.collection(s.collection).estimatedDocumentCount();
      return {
        key: s.key, label: s.label, adminHref: s.adminHref, builtInCount: s.builtInCount,
        dbCount, state: dbCount > 0 ? ("migrated" as const) : ("pending" as const),
      };
    })
  );
}

export type ImportOutcome = {
  key: string;
  label: string;
  tag: string;
  status: "imported" | "skipped" | "failed";
  imported: number;
  error?: string;
};

/**
 * Imports the given sections (or every one when `keys` is omitted), one at a
 * time. Safe to repeat: a section that already has data is skipped, never
 * overwritten or duplicated.
 */
export async function importSections(keys?: string[]): Promise<ImportOutcome[]> {
  if (!hasDatabaseUrl()) throw new Error("MONGODB_URI is not set.");
  const wanted = migrationSections.filter((s) => !keys || keys.includes(s.key));
  const status = new Map((await getMigrationStatus()).map((s) => [s.key, s]));

  const out: ImportOutcome[] = [];
  for (const s of wanted) {
    const base = { key: s.key, label: s.label, tag: s.tag };
    if ((status.get(s.key)?.dbCount ?? 0) > 0) {
      out.push({ ...base, status: "skipped", imported: 0 });
      continue;
    }
    try {
      const n = await s.run();
      out.push({ ...base, status: n > 0 ? "imported" : "skipped", imported: n });
    } catch (e) {
      out.push({ ...base, status: "failed", imported: 0, error: e instanceof Error ? e.message : "database error" });
    }
  }
  return out;
}
