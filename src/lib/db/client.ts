import { MongoClient, type Db } from "mongodb";

/** True when a MONGODB_URI is present (does not prove the DB is reachable). */
export const hasDatabaseUrl = () => Boolean(process.env.MONGODB_URI);

// One client per server process. Cached on globalThis so Next dev hot reloads
// and serverless invocations reuse the same connection pool.
const g = globalThis as unknown as { _mongoClient?: MongoClient };

function getClient(): MongoClient {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set (see .env.example).");
  if (!g._mongoClient) {
    g._mongoClient = new MongoClient(uri, {
      // The first connection after a start is a cold TLS handshake to Atlas
      // and can take longer than 5s on a slow link; failing it showed as a
      // 503 on /media and as "could not reach the database" on login.
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      // Keep a few warm connections: a new TLS connection to Atlas costs
      // several hundred ms. On Vercel every function instance has its own
      // pool, so keep it small there to stay inside Atlas's connection limit
      // (500 on the free/shared tiers).
      minPoolSize: process.env.VERCEL ? 1 : 5,
      maxPoolSize: process.env.VERCEL ? 10 : 100,
      maxIdleTimeMS: 60 * 1000,
    });
  }
  return g._mongoClient;
}

/** Database handle. Name comes from MONGODB_DB, else from the URI path. */
export function getDb(): Db {
  return getClient().db(process.env.MONGODB_DB || undefined);
}

export type DbStatus =
  | { state: "missing" }
  | { state: "connected"; ms: number; name: string }
  | { state: "error"; message: string };

/** Runs a real `ping` so the dashboard only says "Connected" when it is. */
export async function checkDatabase(): Promise<DbStatus> {
  if (!hasDatabaseUrl()) return { state: "missing" };
  const started = Date.now();
  try {
    const db = getDb();
    await db.command({ ping: 1 });
    return { state: "connected", ms: Date.now() - started, name: db.databaseName };
  } catch (e) {
    // Drop a dead client so the next check retries from scratch.
    await g._mongoClient?.close().catch(() => {});
    g._mongoClient = undefined;
    return { state: "error", message: e instanceof Error ? e.message : "Unknown error" };
  }
}
