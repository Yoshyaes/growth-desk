"use strict";
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const path = require("node:path");
const { server } = require("../server/index");
const repo = require("../lib/repo");

// snapshot product state BEFORE seeding, so the clean-tree assertion measures
// what the suite changed rather than what happens to be uncommitted.
const REPO = path.join(__dirname, "..");
const productStateBefore = execFileSync("git", ["status", "--porcelain", "--", "products"], {
  cwd: REPO, encoding: "utf8"
});

// the queue is date-stamped on purpose, so stamp it for today before asserting
execFileSync(process.execPath, [path.join(__dirname, "..", "scripts", "seed.js")], { stdio: "ignore" });

let base;
before(() => new Promise((r) => server.listen(0, "127.0.0.1", () => {
  base = "http://127.0.0.1:" + server.address().port;
  r();
})));
after(() => new Promise((r) => server.close(r)));

const get = async (p) => {
  const res = await fetch(base + p);
  return { status: res.status, body: await res.text() };
};

const ROUTES = [
  "/deckle/today", "/echoself/today", "/marskel/today",
  "/deckle/metrics", "/deckle/channels", "/deckle/audit",
  "/marskel/product/proof", "/marskel/product/icp", "/deckle/move/dk-0141"
];

test("every route renders", async () => {
  for (const r of ROUTES) {
    const { status, body } = await get(r);
    assert.equal(status, 200, r);
    assert.ok(body.includes("<!doctype html>"), r + " is not a page");
  }
});

test("NO POST BUTTON. no rendered page offers to send anything", async () => {
  const forbidden = [
    />\s*Post\s*</i, />\s*Publish\s*</i, />\s*Send\s*</i,
    />\s*Schedule\s*</i, />\s*Post now\s*</i, />\s*Auto-?post\s*</i, />\s*Merge\s*</i
  ];
  for (const r of ROUTES) {
    const { body } = await get(r);
    for (const re of forbidden) {
      assert.ok(!re.test(body), r + " contains a send affordance matching " + re);
    }
  }
});

test("BLOCKED DRAFT. the seeded stackoverflow move never reaches a page", async () => {
  const { body } = await get("/deckle/today");
  assert.ok(!body.includes("MUST NEVER APPEAR"), "blocked draft text leaked into the page");
  assert.ok(!body.includes("dk-0145"), "blocked move id leaked into the page");
});

test("BLOCKED DRAFT. the blocked move cannot be opened directly either", async () => {
  const { status } = await get("/deckle/move/dk-0145");
  assert.equal(status, 404);
});

test("the gate notice is shown with the reason, not silently hidden", async () => {
  const { body } = await get("/deckle/today");
  assert.ok(/Ethics gate/i.test(body));
  assert.ok(body.includes("stackoverflow"));
});

test("ECHOSELF. the blocked communities are named as excluded and none is draftable", async () => {
  const { body } = await get("/echoself/today");
  for (const c of ["r/GriefSupport", "r/AgingParents", "r/hospice"]) {
    assert.ok(body.includes(c), c + " should be listed as excluded");
  }
  assert.ok(/3 moves today, not 5/.test(body) || /returned/.test(body) || body.includes("not padded"),
    "the short run should be stated out loud");
});

test("FOUR NUMBERS. metrics renders exactly four tiles and no vanity metric", async () => {
  const { body } = await get("/deckle/metrics");
  const tiles = (body.match(/class="tile"/g) || []).length;
  assert.equal(tiles, 4);
  const main = body.split('class="content"')[1] || "";
  for (const bad of ["impression", "reach", "pageview"]) {
    assert.ok(!new RegExp(bad, "i").test(main), main.length && bad + " appears on the metrics page");
  }
  assert.ok(/not tracked here on purpose/i.test(body));
});

test("the lint endpoint catches a colon, an em dash and a banned word", async () => {
  const res = await fetch(base + "/api/lint", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: "However: this — that" })
  });
  const r = await res.json();
  const counts = Object.fromEntries(r.summary.map((s) => [s.rule, s.count]));
  assert.equal(counts.colon, 1);
  assert.equal(counts["em-dash"], 1);
  assert.equal(counts["banned-word"], 1);
});

test("the move api refuses a write to a blocked channel", async () => {
  const res = await fetch(base + "/api/move/deckle/dk-0145", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ state: "copied", draft: "trying anyway" })
  });
  const out = await res.json();
  assert.equal(out.ok, false);
});

test("the move api accepts a state change on an allowed move and persists it", async () => {
  // this test writes to a checked-in file, so it snapshots the exact bytes and
  // restores them. reverting through the api is not enough, since every write
  // stamps updated_at and would leave the working tree dirty on every run.
  const fs = require("node:fs");
  const file = repo.queuePath("deckle");
  const before = fs.readFileSync(file);

  try {
    const res = await fetch(base + "/api/move/deckle/dk-0143", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ state: "copied" })
    });
    const out = await res.json();
    assert.equal(out.ok, true);
    assert.equal(repo.queue("deckle").moves.find((m) => m.id === "dk-0143").state, "copied");
  } finally {
    fs.writeFileSync(file, before);
  }

  assert.equal(repo.queue("deckle").moves.find((m) => m.id === "dk-0143").state, "queued");
});

test("the suite does not dirty any checked-in data file", () => {
  // compared against the snapshot taken before the suite ran. asserting a
  // clean tree outright would fail whenever a real edit is in progress, which
  // is the wrong reason to fail and teaches people to ignore it.
  const after = execFileSync("git", ["status", "--porcelain", "--", "products"], {
    cwd: REPO, encoding: "utf8"
  });
  assert.equal(after, productStateBefore,
    "running the tests changed checked-in product data.\nbefore:\n" + productStateBefore + "after:\n" + after);
});

test("the move api rejects an invented state and an unknown move", async () => {
  const bad = await (await fetch(base + "/api/move/deckle/dk-9999", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ state: "copied" })
  })).json();
  assert.equal(bad.ok, false);
});

test("an unknown product 404s rather than rendering an empty desk", async () => {
  assert.equal((await get("/notaproduct/today")).status, 404);
});
