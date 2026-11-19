// Puts blog posts back in newest-first order (the order the site had before drag-and-drop).
import { MongoClient } from "mongodb";
// Safety: refuses the live database (MONGODB_DB "ukvalley") unless ALLOW_PROD_WRITE=1.
if ((process.env.MONGODB_DB || "ukvalley") === "ukvalley" && process.env.ALLOW_PROD_WRITE !== "1") {
  console.error("Refusing to write to the live database (MONGODB_DB=ukvalley). Set ALLOW_PROD_WRITE=1 to override.");
  process.exit(1);
}
const c = new MongoClient(process.env.MONGODB_URI); await c.connect();
const col = c.db(process.env.MONGODB_DB || undefined).collection("posts");
const docs = await col.find({}, { projection: { _id: 1 } }).sort({ date: -1, _id: 1 }).toArray();
await col.bulkWrite(docs.map((d, order) => ({ updateOne: { filter: { _id: d._id }, update: { $set: { order } } } })));
console.log("reset", docs.length, "posts; first:", docs[0]._id);
await c.close();
