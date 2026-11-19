// Puts hire roles back in the built-in order (react-developers first).
import { MongoClient } from "mongodb";
// Safety: refuses the live database (MONGODB_DB "ukvalley") unless ALLOW_PROD_WRITE=1.
if ((process.env.MONGODB_DB || "ukvalley") === "ukvalley" && process.env.ALLOW_PROD_WRITE !== "1") {
  console.error("Refusing to write to the live database (MONGODB_DB=ukvalley). Set ALLOW_PROD_WRITE=1 to override.");
  process.exit(1);
}
const order = ["react-developers", "nextjs-developers", "nodejs-developers", "flutter-developers", "react-native-developers", "python-developers", "angular-developers", "laravel-developers", "devops-engineers", "qa-engineers", "sales-executives", "ui-ux-designers"];
const c = new MongoClient(process.env.MONGODB_URI); await c.connect();
const col = c.db(process.env.MONGODB_DB || undefined).collection("hireRoles");
await col.bulkWrite(order.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { $set: { order: i } } } })));
console.log("reset", order.length, "roles");
await c.close();
