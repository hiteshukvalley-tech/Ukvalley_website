import { unstable_cache } from "next/cache";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { team as builtInTeam, type TeamMember } from "@/lib/site-data";
import { slugifyName, type TeamInput, type TeamRecord } from "@/lib/team-validation";

export const TEAM_TAG = "team";
const COLLECTION = "teamMembers";

/** Mongo document: the generated slug is the _id. */
type TeamDoc = Omit<TeamRecord, "slug"> & { _id: string; updatedAt?: Date };

const col = () => getDb().collection<TeamDoc>(COLLECTION);

function toRecord({ _id, updatedAt, ...rest }: TeamDoc): TeamRecord {
  void updatedAt;
  return { ...rest, slug: _id };
}

/** Strips the admin-only fields, leaving what the public pages use. */
function toPublic({ slug, published, order, ...member }: TeamRecord): TeamMember {
  void slug;
  void published;
  void order;
  return member;
}

/** Built-in members with generated ids, in the record shape the admin uses. */
export const builtInRecords: TeamRecord[] = (() => {
  const used = new Set<string>();
  return builtInTeam.map((m, order) => {
    const base = slugifyName(m.name);
    let slug = base;
    for (let i = 2; used.has(slug); i++) slug = `${base}-${i}`;
    used.add(slug);
    return { ...m, slug, published: true, order };
  });
})();

async function readPublished(): Promise<TeamMember[]> {
  const docs = await col().find({ published: true }).sort({ order: 1 }).toArray();
  return docs.map((d) => toPublic(toRecord(d)));
}

// Throws on DB errors so a failure is never cached; callers fall back.
const cachedPublished = unstable_cache(readPublished, ["team-published-v1"], {
  tags: [TEAM_TAG],
  revalidate: 60,
});

const cachedHasAny = unstable_cache(
  async () => (await col().estimatedDocumentCount()) > 0,
  ["team-has-any-v1"],
  { tags: [TEAM_TAG], revalidate: 60 }
);

/**
 * Team members for the public site, in the order set in the admin. Uses the
 * built-in list until the admin has imported/created some, and whenever the
 * database can't be read. All-draft shows the defaults, since the About and
 * Team pages need at least one person.
 */
export async function getTeam(): Promise<TeamMember[]> {
  if (!hasDatabaseUrl()) return builtInTeam;
  try {
    if (!(await cachedHasAny())) return builtInTeam;
    const published = await cachedPublished();
    return published.length ? published : builtInTeam;
  } catch {
    return builtInTeam;
  }
}

/** Uncached list for the admin (drafts included), in display order. */
export async function listTeamForAdmin(): Promise<{ items: TeamRecord[]; dbError?: string }> {
  if (!hasDatabaseUrl()) return { items: [], dbError: "MONGODB_URI is not set." };
  try {
    const docs = await col().find({}).sort({ order: 1, _id: 1 }).toArray();
    return { items: docs.map(toRecord) };
  } catch (e) {
    return { items: [], dbError: e instanceof Error ? e.message : "Could not read team members." };
  }
}

export async function getTeamMemberForAdmin(slug: string): Promise<TeamRecord | null> {
  if (!hasDatabaseUrl()) return null;
  try {
    const doc = await col().findOne({ _id: slug });
    return doc ? toRecord(doc) : null;
  } catch {
    return null;
  }
}

/** Copies the built-in team into the database. Only when it is empty. */
export async function importBuiltInTeam(): Promise<number> {
  if ((await col().estimatedDocumentCount()) > 0) return 0;
  const now = new Date();
  await col().insertMany(builtInRecords.map(({ slug, ...rest }) => ({ _id: slug, ...rest, updatedAt: now })));
  return builtInRecords.length;
}

/** Adds a member at the end of the list; the id is made from the name. */
export async function createTeamMember(value: TeamInput): Promise<void> {
  const last = await col().find({}, { projection: { order: 1 } }).sort({ order: -1 }).limit(1).toArray();
  const order = (last[0]?.order ?? -1) + 1;
  const base = slugifyName(value.name);
  // Two people can share a name, so retry with -2, -3 … on a duplicate id.
  for (let i = 1; i <= 20; i++) {
    const id = i === 1 ? base : `${base}-${i}`;
    try {
      await col().insertOne({ _id: id, ...value, order, updatedAt: new Date() });
      return;
    } catch (e) {
      if ((e as { code?: number }).code !== 11000) throw e;
    }
  }
  throw new Error("Could not generate a unique id for this name.");
}

/** Returns false when the member no longer exists. */
export async function updateTeamMember(slug: string, value: TeamInput): Promise<boolean> {
  const res = await col().updateOne({ _id: slug }, { $set: { ...value, updatedAt: new Date() } });
  return res.matchedCount > 0;
}

export async function setTeamPublished(slug: string, published: boolean) {
  await col().updateOne({ _id: slug }, { $set: { published, updatedAt: new Date() } });
}

export async function deleteTeamMember(slug: string) {
  await col().deleteOne({ _id: slug });
}

/**
 * Saves a drag-and-drop order. `slugs` must be exactly the current set of
 * members in their new order; anything else is rejected so a stale page can't
 * scramble the list. Returns false when the list is out of date.
 */
export async function reorderTeam(slugs: string[]): Promise<boolean> {
  const docs = await col().find({}, { projection: { _id: 1 } }).toArray();
  const existing = new Set(docs.map((d) => d._id));
  if (
    slugs.length !== existing.size ||
    new Set(slugs).size !== slugs.length ||
    !slugs.every((id) => existing.has(id))
  ) {
    return false;
  }
  await col().bulkWrite(
    slugs.map((id, order) => ({ updateOne: { filter: { _id: id }, update: { $set: { order } } } }))
  );
  return true;
}
