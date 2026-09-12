"use strict";
/**
 * Stamp the example queues with today's date.
 *
 * The app deliberately shows an empty state when there is no queue for today,
 * because a stale queue presented as today's work would be a lie. That makes
 * the checked-in examples date-sensitive, so this script re-dates them.
 *
 *   node scripts/seed.js            today
 *   node scripts/seed.js 2026-09-15 a specific day
 *
 * The examples include one move for a blocked channel on purpose. The gate
 * drops it. Seeing it survive would mean something is broken.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const date = process.argv[2] || new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.error("gd seed. expected a date as YYYY-MM-DD");
  process.exit(1);
}

let n = 0;
for (const slug of fs.readdirSync(path.join(ROOT, "products"))) {
  const example = path.join(ROOT, "products", slug, "queue", "example.json");
  if (!fs.existsSync(example)) continue;
  const q = JSON.parse(fs.readFileSync(example, "utf8"));
  q.date = date;
  q.generated_at = date + "T11:02:19Z";
  q.moves = (q.moves || []).map((m) => ({ ...m, state: "queued" }));
  const out = path.join(ROOT, "products", slug, "queue", date + ".json");
  fs.writeFileSync(out, JSON.stringify(q, null, 2) + "\n");
  n++;
  console.log("  seeded " + path.relative(ROOT, out));
}
console.log("\n  " + n + " queue" + (n === 1 ? "" : "s") + " seeded for " + date + "\n");
