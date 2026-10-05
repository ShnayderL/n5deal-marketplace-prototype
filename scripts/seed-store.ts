import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { createSeedDatabase } from "../src/lib/seed-data";

const force = process.argv.includes("--force");
const target = path.join(process.cwd(), "data", "store.json");

mkdirSync(path.dirname(target), { recursive: true });
const db = createSeedDatabase();
writeFileSync(target, JSON.stringify(db, null, 2));
console.log(`${force ? "Reset" : "Seeded"} demo store at ${target}`);
console.log({
  users: db.users.length,
  assets: db.assets.length,
  messages: db.messages.length,
  password: "demo1234",
});
