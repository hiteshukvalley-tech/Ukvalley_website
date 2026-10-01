import { MongoClient } from "mongodb";
const c = new MongoClient(process.env.MONGODB_URI); await c.connect();
const col = c.db(process.env.MONGODB_DB || undefined).collection("hireRoles");
const docs = await col.find({}, { projection: { _id: 1, order: 1, published: 1 } }).sort({ order: 1 }).toArray();
console.log(docs.map((d) => `${d.order}:${d._id}${d.published ? "" : " (draft)"}`).join("\n"));
await c.close();
