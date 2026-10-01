// Puts hire roles back in the built-in order (react-developers first).
import { MongoClient } from "mongodb";
const order = ["react-developers", "nextjs-developers", "nodejs-developers", "flutter-developers", "react-native-developers", "python-developers", "angular-developers", "laravel-developers", "devops-engineers", "qa-engineers", "sales-executives", "ui-ux-designers"];
const c = new MongoClient(process.env.MONGODB_URI); await c.connect();
const col = c.db(process.env.MONGODB_DB || undefined).collection("hireRoles");
await col.bulkWrite(order.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { $set: { order: i } } } })));
console.log("reset", order.length, "roles");
await c.close();
