import { MongoClient } from "mongodb";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter(l => l.includes("=") && !l.startsWith("#")).map(l => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
const c = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
try { const t = Date.now(); await c.connect(); await c.db(env.MONGODB_DB).command({ ping: 1 }); console.log("CONNECTED", env.MONGODB_DB, Date.now() - t, "ms"); }
catch (e) { console.log("FAILED:", e.message); }
finally { await c.close(); }
