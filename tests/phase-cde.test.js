"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const audit = require("../lib/audit");
const backlog = require("../lib/backlog");
const review = require("../lib/review");
const repo = require("../lib/repo");
const fs = require("node:fs");
const path = require("node:path");

/* ---------- audit ---------- */

test("AUDIT. the rubric has seven questions out of five each", () => {
  assert.equal(audit.RUBRIC.length, 7);
  assert.equal(audit.MAX_TOTAL, 35);
});

test("AUDIT. a missing answer scores zero rather than being skipped", () => {
  const s = audit.score({ trigger: 2 });
  assert.equal(s.total, 2);
  assert.equal(s.rows.length, 7);
  assert.equal(s.rows.find((r) => r.key === "proof").value, 0);
});

test("AUDIT. scores clamp and round instead of accepting nonsense", () => {
  const s = audit.score({ trigger: 99, wedge: -4, proof: 2.6, offer: "x" });
  assert.equal(s.rows.find((r) => r.key === "trigger").value, 5);
  assert.equal(s.rows.find((r) => r.key === "wedge").value, 0);
  assert.equal(s.rows.find((r) => r.key === "proof").value, 3);
  assert.equal(s.rows.find((r) => r.key === "offer").value, 0);
});

test("AUDIT. weak questions are flagged so the low scores are read first", () => {
  const s = audit.score({ trigger: 2, wedge: 3, proof: 1, offer: 4, objection: 3, voice: 5, recognition: 4 });
  assert.equal(s.total, 22);
  assert.deepEqual(s.weakest.sort(), ["proof", "trigger"]);
  assert.equal(s.verdict, "workable");
});

test("AUDIT. HELD DIFF. a replacement citing absent proof cannot ship", () => {
  const proof = [{ text: "Free tier. 1,000 PDFs a month with all features." }];
  const item = audit.classifyDiff({
    impact: "high",
    current: "Faster setup and lower maintenance than Puppeteer",
    replacement: "Cold start 190ms against Puppeteer's 2.4s on Lambda",
    cites: ["cold start 190ms"]
  }, proof);
  assert.equal(item.shippable, false);
  assert.equal(item.held, true);
  assert.deepEqual(item.missingEvidence, ["cold start 190ms"]);
  assert.match(item.heldReason, /not in proof\.md/);
});

test("AUDIT. a replacement citing real proof ships", () => {
  const proof = [{ text: "Free tier. 1,000 PDFs a month with all features." }];
  const item = audit.classifyDiff({ impact: "high", cites: ["free tier"] }, proof);
  assert.equal(item.shippable, true);
  assert.equal(item.held, false);
});

test("AUDIT. a replacement citing nothing ships", () => {
  assert.equal(audit.classifyDiff({ impact: "low" }, []).shippable, true);
});

test("AUDIT. ordering is by impact, and held items sink within their band", () => {
  const items = [
    { id: "a", impact: "low", held: false },
    { id: "b", impact: "high", held: true },
    { id: "c", impact: "high", held: false },
    { id: "d", impact: "medium", held: false }
  ];
  assert.deepEqual(audit.prioritise(items).map((i) => i.id), ["c", "b", "d", "a"]);
});

test("AUDIT. NEVER MERGES. the pull request model has no merge affordance", () => {
  const built = audit.build({
    url: "https://getdeckle.dev", date: "2026-09-12",
    scores: { trigger: 2, wedge: 3, proof: 1, offer: 4, objection: 3, voice: 5, recognition: 4 },
    diff: [
      { impact: "high", cites: ["cold start 190ms"] },
      { impact: "medium", cites: [] }
    ]
  }, [{ text: "Free tier. 1,000 PDFs a month." }]);

  assert.equal(built.score.total, 22);
  assert.equal(built.held.length, 1);
  assert.equal(built.shippable.length, 1);
  assert.equal(built.pullRequest.merges, false);
  assert.ok(!JSON.stringify(built).toLowerCase().includes('"merge"'));
});

test("AUDIT. no audit file yields a built view that says so", () => {
  const built = audit.build(null, []);
  assert.equal(built.exists, false);
  assert.equal(built.pullRequest, null);
});

/* ---------- backlog ---------- */

test("BACKLOG. the written plan parses out of an Open assumptions section", () => {
  const md = [
    "## Open assumptions worth testing first",
    "",
    "1. The trigger is the unaffordable fractional exec quote. Test with a direct",
    "   message to ten founders who posted about hiring a fractional exec.",
    "",
    "2. The Lex free tool is the lowest-friction entry point.",
    "   Test by shipping it and measuring signup rate.",
    "",
    "## Something else"
  ].join("\n");
  const plans = backlog.parsePlans(md);
  assert.equal(plans.length, 2);
  assert.equal(plans[0].assumption, "The trigger is the unaffordable fractional exec quote");
  assert.match(plans[0].test, /^with a direct message to ten founders/);
  assert.ok(!plans[1].test.includes("Something else"), "must not run past the section");
});

test("BACKLOG. a file with no Open assumptions section yields no plans", () => {
  assert.deepEqual(backlog.parsePlans("# nothing here"), []);
});

test("BACKLOG. an entry with no Test sentence still records the assumption", () => {
  const plans = backlog.parsePlans("## Open assumptions\n\n1. We think they are technical.\n");
  assert.equal(plans.length, 1);
  assert.equal(plans[0].assumption, "We think they are technical");
  assert.equal(plans[0].test, "");
});

test("BACKLOG. NO GUESSING. a plan is never auto-linked to a claim", () => {
  const entries = [
    { file: "icp", tag: "assumed", text: "An investor told them to hire a fractional CMO." },
    { file: "icp", tag: "verified", text: "This one is evidenced." }
  ];
  const plans = [{ assumption: "The trigger is the unaffordable fractional exec quote", test: "dm ten founders" }];
  const out = backlog.forProduct("marskel", entries, plans);
  assert.equal(out.total, 1, "verified claims are not backlog items");
  assert.equal(out.planned, 1);
  // the two lists stay separate. nothing claims the plan covers the claim.
  assert.equal(out.assumed[0].test, undefined);
  assert.equal(JSON.stringify(out).includes("hasTest"), false);
});

test("BACKLOG. products with no written plan sort first", () => {
  const ordered = backlog.order([
    { product: "marskel", total: 9, hasPlan: true },
    { product: "deckle", total: 13, hasPlan: false }
  ]);
  assert.equal(ordered[0].product, "deckle");
});

test("BACKLOG. REAL REPO. the gap is real and reported honestly", () => {
  const results = [];
  for (const slug of repo.products()) {
    const entries = [];
    for (const file of ["icp", "proof", "offers", "learnings"]) {
      for (const c of repo.claims(slug, file)) entries.push({ file, ...c });
    }
    const md = fs.readFileSync(path.join(repo.PRODUCTS, slug, "icp.md"), "utf8");
    results.push(backlog.forProduct(slug, entries, backlog.parsePlans(md)));
  }
  const totalAssumed = results.reduce((a, r) => a + r.total, 0);
  assert.ok(totalAssumed > 25, "expected a real backlog, found " + totalAssumed);
  assert.ok(results.some((r) => !r.hasPlan), "at least one product has no written plan, which is the finding");
});

test("CLAIMS. a claim wrapped across lines is read whole, not truncated", () => {
  const all = repo.claims("deckle", "icp");
  const wrapped = all.find((c) => c.text.startsWith("They already have a working PDF path"));
  assert.ok(wrapped, "expected the wrapped claim to be found");
  assert.match(wrapped.text, /fragile\.$/, "the claim was truncated at the line break");
  for (const slug of repo.products()) {
    for (const file of ["icp", "proof"]) {
      for (const c of repo.claims(slug, file)) {
        assert.ok(!/\b(or|and|the|a|to|of|with|no)$/i.test(c.text.trim()),
          slug + "/" + file + " has a claim ending mid sentence. " + JSON.stringify(c.text.slice(-48)));
      }
    }
  }
});

/* ---------- weekly review ---------- */

const streakOf = (hit, weekdays) => ({ hit, weekdays, failing: weekdays > 0 && hit / weekdays < 0.5 });
const nums = (o) => Object.assign({ replies: 0, qualified_convos: 0, signups: 0, paid: 0, moves: 0 }, o);

test("REVIEW. a broken habit outranks a bad number in the headline", () => {
  const r = review.build([
    { slug: "deckle", seven: nums({ moves: 12, replies: 30 }), twentyEight: nums({ qualified_convos: 8 }), streak: streakOf(9, 10), rows: [] },
    { slug: "echoself", seven: nums({ moves: 2 }), twentyEight: nums({ qualified_convos: 0 }), streak: streakOf(2, 10), rows: [] }
  ]);
  assert.equal(r.worstKind, "habit");
  assert.match(r.headline, /^echoself sent 2 moves in 10 weekdays/);
  assert.equal(r.systemFailing, true);
  assert.match(r.verdict, /The streak is the product/);
});

test("REVIEW. zero moves reads as nothing, not as a number", () => {
  const r = review.build([
    { slug: "echoself", seven: nums(), twentyEight: nums(), streak: streakOf(0, 10), rows: [] }
  ]);
  assert.match(r.headline, /sent nothing in 10 weekdays/);
});

test("REVIEW. with the habit holding, it leads on the weakest conversion", () => {
  const r = review.build([
    { slug: "deckle", seven: nums({ moves: 10 }), twentyEight: nums({ qualified_convos: 9 }), streak: streakOf(9, 10), rows: [] },
    { slug: "marskel", seven: nums({ moves: 8 }), twentyEight: nums({ qualified_convos: 1 }), streak: streakOf(8, 10), rows: [] }
  ]);
  assert.equal(r.worstKind, "conversion");
  assert.match(r.headline, /^marskel produced 1 qualified conversations/);
  assert.equal(r.systemFailing, false);
});

test("REVIEW. the best move is chosen by conversations, never by replies alone", () => {
  const best = review.pickBestMove([{
    slug: "deckle",
    rows: [
      { move_id: "dk-1", channel: "r/node", move_type: "helpful_reply", replies: 40, qualified_convos: 0, signups: 0, paid: 0 },
      { move_id: "dk-2", channel: "linkedin", move_type: "direct_message", replies: 2, qualified_convos: 3, signups: 1, paid: 0 }
    ]
  }]);
  assert.equal(best.move_id, "dk-2", "reach must not beat conversations");
});

test("REVIEW. no results means no best move, rather than a fake winner", () => {
  const best = review.pickBestMove([{ slug: "x", rows: [{ move_id: "a", replies: 0, qualified_convos: 0, signups: 0, paid: 0 }] }]);
  assert.equal(best, null);
});

test("REVIEW. the worst channel needs at least three spent moves and no conversations", () => {
  const rows = [
    { channel: "r/django", replies: 1, qualified_convos: 0, signups: 0, paid: 0 },
    { channel: "r/django", replies: 0, qualified_convos: 0, signups: 0, paid: 0 },
    { channel: "r/django", replies: 0, qualified_convos: 0, signups: 0, paid: 0 },
    { channel: "r/node", replies: 9, qualified_convos: 0, signups: 0, paid: 0 }
  ];
  const worst = review.pickWorstChannel([{ slug: "deckle", rows }]);
  assert.equal(worst.channel, "r/django");
  assert.equal(worst.moves, 3);
});

test("REVIEW. NO VANITY METRICS anywhere in the output", () => {
  const r = review.build([
    { slug: "deckle", seven: nums({ moves: 5 }), twentyEight: nums({ qualified_convos: 2 }), streak: streakOf(8, 10), rows: [] }
  ]);
  const s = JSON.stringify(r).toLowerCase();
  for (const bad of ["views", "impression", "reach"]) {
    assert.ok(!s.includes(bad), "review output mentions " + bad);
  }
});
