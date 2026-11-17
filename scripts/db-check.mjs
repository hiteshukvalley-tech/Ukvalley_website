import { MongoClient } from "mongodb";
import { existsSync, readFileSync } from "node:fs";
// .env.local when it has values, else .env (like scripts/qa/lib.mjs)
const envText = [".env.local", ".env"].map((f) => (existsSync(f) ? readFileSync(f, "utf8") : "")).find((t) => /^MONGODB_URI=/m.test(t)) ?? "";
const env = Object.fromEntries(envText.split(/\r?\n/).filter(l => l.includes("=") && !l.startsWith("#")).map(l => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
const c = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
try { const t = Date.now(); await c.connect(); await c.db(env.MONGODB_DB).command({ ping: 1 }); console.log("CONNECTED", env.MONGODB_DB, Date.now() - t, "ms"); }
catch (e) { console.log("FAILED:", e.message); }
finally { await c.close(); }
