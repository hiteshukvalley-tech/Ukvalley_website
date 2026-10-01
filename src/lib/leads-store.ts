import { randomUUID } from "node:crypto";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import type { EnquiryInput, LeadSource } from "@/lib/contact-validation";

const COLLECTION = "leads";

export const LEAD_STATUSES = ["new", "contacted", "closed"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const leadStatusLabel: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  closed: "Closed",
};

export const isLeadStatus = (v: unknown): v is LeadStatus =>
  typeof v === "string" && (LEAD_STATUSES as readonly string[]).includes(v);

export type Lead = EnquiryInput & {
  id: string;
  status: LeadStatus;
  /** internal note, never shown to the visitor */
  note: string;
  createdAt: Date;
  updatedAt?: Date;
};

type LeadDoc = Omit<Lead, "id"> & { _id: string };

const col = () => getDb().collection<LeadDoc>(COLLECTION);

function toLead({ _id, ...rest }: LeadDoc): Lead {
  return { ...rest, id: _id };
}

const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT = 5;

/**
 * Saves a public enquiry. Returns "duplicate" when the same email just sent
 * the same message (a double click or refresh), and "limited" when one email
 * has sent too many in the last hour.
 */
export async function createLead(input: EnquiryInput): Promise<"created" | "duplicate" | "limited"> {
  const now = Date.now();
  const recent = await col()
    .find({ email: input.email, createdAt: { $gte: new Date(now - RATE_WINDOW_MS) } })
    .project<{ message: string; createdAt: Date }>({ message: 1, createdAt: 1 })
    .toArray();

  if (recent.some((r) => r.message === input.message && now - r.createdAt.getTime() < DUPLICATE_WINDOW_MS)) {
    return "duplicate";
  }
  if (recent.length >= RATE_LIMIT) return "limited";

  await col().insertOne({
    _id: randomUUID(),
    ...input,
    status: "new",
    note: "",
    createdAt: new Date(now),
  });
  return "created";
}

export type LeadCounts = Record<LeadStatus | "all", number>;

export type LeadListQuery = {
  status?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Admin list: newest first, optionally filtered by status and search text. */
export async function listLeads(query: LeadListQuery = {}): Promise<{
  items: Lead[];
  total: number;
  counts: LeadCounts;
  dbError?: string;
}> {
  const empty: LeadCounts = { all: 0, new: 0, contacted: 0, closed: 0 };
  if (!hasDatabaseUrl()) return { items: [], total: 0, counts: empty, dbError: "MONGODB_URI is not set." };

  const pageSize = query.pageSize ?? 25;
  const page = Math.max(1, query.page ?? 1);
  const filter: Record<string, unknown> = {};
  if (isLeadStatus(query.status)) filter.status = query.status;
  const needle = query.q?.trim();
  if (needle) {
    const rx = { $regex: escapeRegex(needle.slice(0, 100)), $options: "i" };
    filter.$or = [{ name: rx }, { email: rx }, { company: rx }, { phone: rx }, { message: rx }];
  }

  try {
    const [docs, total, grouped] = await Promise.all([
      col().find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).toArray(),
      col().countDocuments(filter),
      col().aggregate<{ _id: LeadStatus; n: number }>([{ $group: { _id: "$status", n: { $sum: 1 } } }]).toArray(),
    ]);
    const counts = { ...empty };
    for (const g of grouped) {
      if (isLeadStatus(g._id)) counts[g._id] = g.n;
      counts.all += g.n;
    }
    return { items: docs.map(toLead), total, counts };
  } catch (e) {
    return { items: [], total: 0, counts: empty, dbError: e instanceof Error ? e.message : "Could not read leads." };
  }
}

/** Every lead, newest first, for the CSV export. */
export async function listAllLeads(): Promise<Lead[]> {
  if (!hasDatabaseUrl()) return [];
  const docs = await col().find({}).sort({ createdAt: -1 }).limit(10000).toArray();
  return docs.map(toLead);
}

export async function getLead(id: string): Promise<Lead | null> {
  if (!hasDatabaseUrl()) return null;
  try {
    const doc = await col().findOne({ _id: id });
    return doc ? toLead(doc) : null;
  } catch {
    return null;
  }
}

/** Number of leads still marked "new", or null when it can't be read. */
export async function countNewLeads(): Promise<number | null> {
  if (!hasDatabaseUrl()) return null;
  try {
    return await col().countDocuments({ status: "new" });
  } catch {
    return null;
  }
}

/** Returns false when the lead no longer exists. */
export async function updateLead(id: string, patch: { status: LeadStatus; note: string }): Promise<boolean> {
  const res = await col().updateOne({ _id: id }, { $set: { ...patch, updatedAt: new Date() } });
  return res.matchedCount > 0;
}

export async function deleteLead(id: string) {
  await col().deleteOne({ _id: id });
}

export type { LeadSource };
