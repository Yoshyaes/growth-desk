"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { structure } = require("../lib/structure");
const repo = require("../lib/repo");
const fs = require("node:fs");
const path = require("node:path");

const has = (text, rule) => structure(text).hits.some((h) => h.rule === rule);

/* ---------- the flip. the loudest tell ---------- */

test("THE FLIP. not-X-it's-Y is caught across two sentences", () => {
  assert.ok(has("The timeout is almost never the render. It's the cold start.", "antithesis-flip"));
  assert.ok(has("It's not ignoring flexbox. It's WebKit from 2012.", "antithesis-flip"));
  assert.ok(has("That's not loneliness. That's evolution.", "antithesis-flip"));
});

test("THE FLIP. the same move with a comma is still caught", () => {
  assert.ok(has("This isn't a rendering problem, it's a packaging one.", "antithesis-flip"));
});

test("THE FLIP. a plain negation is not the flip", () => {
  assert.equal(has("Almost always the cold start, not the render itself.", "antithesis-flip"), false);
  assert.equal(has("Lead with the birthday, not the diagnosis.", "antithesis-flip"), false);
});

/* ---------- announced and numbered lists ---------- */

test("LISTS. announcing a count before delivering it is caught", () => {
  assert.ok(has("Three things that usually fix it.", "announced-list"));
  assert.ok(has("Two real options and the tradeoff is maintenance.", "announced-list"));
});

test("LISTS. a numbered list inside a reply is caught", () => {
  assert.ok(has("Here goes.\n1. Move Chromium\n2. Reuse the browser", "numbered-list"));
});

test("LISTS. a number in prose is not a numbered list", () => {
  assert.equal(has("Past about 50MB unzipped you're paying an init penalty.", "numbered-list"), false);
});

/* ---------- rhythm ---------- */

test("RHYTHM. copy with no contractions is flagged", () => {
  assert.ok(has("The build is slow. It is the cache that does it. We will fix it.", "no-contractions"));
});

test("RHYTHM. contractions clear the check", () => {
  assert.equal(has("The build's slow. It's the cache. We'll fix it.", "no-contractions"), false);
});

test("RHYTHM. evenly sized sentences are flagged", () => {
  const even = "The queue holds five drafted moves today. "
    + "Each of them carries a channel and a gate. "
    + "The gate decides whether copy is drafted. "
    + "The reviewer reads them before anything ships.";
  assert.ok(has(even, "uniform-rhythm"));
});

test("RHYTHM. real variation is not flagged, whatever the deviation says", () => {
  // holds a two word sentence and a seventeen word one. varied by any reading.
  const varied = "Depends how weird your documents get. WeasyPrint if they're simple. "
    + "Runs in-process, no browser to babysit, and the CSS support is narrower than you'd expect going in. "
    + "Quality's great. I build one called Deckle so take that with salt.";
  assert.equal(has(varied, "uniform-rhythm"), false);
});

/* ---------- the rest ---------- */

test("OTHER TELLS. triplets, diagnosing, ranges and empty intensity", () => {
  assert.ok(has("It covers speed, quality and price.", "triplet"));
  assert.ok(has("What you're describing is a cold start problem.", "diagnostic-opener"));
  assert.ok(has("Everything from invoices to certificates.", "from-to-range"));
  assert.ok(has("The results were remarkable.", "vague-intensity"));
  assert.ok(has("Not only does it render, but also it caches.", "not-only"));
});

test("OTHER TELLS. one bridge phrase is voice, two is a habit", () => {
  assert.equal(has("Here's the thing. The cache is cold.", "repeat-bridge"), false);
  assert.ok(has("Here's the thing. The cache is cold. Look, the thing is it stays cold.", "repeat-bridge"));
});

/* ---------- the real drafts ---------- */

test("REAL DRAFTS. every checked-in example draft passes the structural lint", () => {
  const failures = [];
  for (const slug of repo.products()) {
    const file = path.join(repo.PRODUCTS, slug, "queue", "example.json");
    if (!fs.existsSync(file)) continue;
    const q = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const m of q.moves || []) {
      // the deliberately blocked seed is never drafted, so it is not held to this
      if (m.channel === "stackoverflow") continue;
      const r = structure(m.draft);
      if (!r.clean) failures.push(m.id + " " + r.hits.map((h) => h.rule).join(", "));
    }
  }
  assert.deepEqual(failures, []);
});

test("REAL DRAFTS. the voice guide documents every rule the lint enforces", () => {
  const guide = fs.readFileSync(path.join(repo.ROOT, "shared", "voice-rules.md"), "utf8").toLowerCase();
  for (const phrase of ["contractions are mandatory", "not-x-it's-y", "announce a count",
                        "numbered list", "vary sentence length", "triplet"]) {
    assert.ok(guide.includes(phrase), "voice-rules.md does not mention " + phrase);
  }
});
