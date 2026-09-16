"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const voice = require("../lib/voice");
const repo = require("../lib/repo");

const BANNED = repo.bannedWords();

test("the banned list parses out of shared/voice-rules.md", () => {
  assert.ok(BANNED.length > 60, "expected a long list, got " + BANNED.length);
  assert.ok(BANNED.includes("however"));
  assert.ok(BANNED.includes("delve into"));
});

test("em dashes and en dashes are caught", () => {
  const r = voice.lint("one — two – three", BANNED);
  assert.equal(r.hits.filter((h) => h.rule === "em-dash").length, 2);
});

test("a bare colon is caught", () => {
  const r = voice.lint("Here is the thing: it works.", BANNED);
  assert.equal(r.hits.filter((h) => h.rule === "colon").length, 1);
});

test("colons inside urls, code spans and clock times are not caught", () => {
  const r = voice.lint("see https://a.dev/x:y and `key: value` at 10:30", BANNED);
  assert.equal(r.hits.filter((h) => h.rule === "colon").length, 0);
});

test("semicolons are caught", () => {
  const r = voice.lint("this; that", BANNED);
  assert.equal(r.hits.filter((h) => h.rule === "semicolon").length, 1);
});

test("banned words are caught case insensitively", () => {
  const r = voice.lint("However this is Crucial. Moreover, we must ensure it.", BANNED);
  const found = r.hits.filter((h) => h.rule === "banned-word").map((h) => h.found.toLowerCase()).sort();
  assert.deepEqual(found, ["crucial", "ensure", "however", "moreover"]);
});

test("a banned word inside a longer word is not a hit", () => {
  const r = voice.lint("The powerhouse ensured nothing. Diverse divers.", BANNED);
  const found = r.hits.filter((h) => h.rule === "banned-word").map((h) => h.found.toLowerCase());
  assert.ok(!found.includes("power"), "power inside powerhouse must not match");
  assert.ok(!found.includes("dive"), "dive inside divers must not match");
});

test("clean copy reports clean", () => {
  const r = voice.lint("Almost always the cold start, not the render itself.", BANNED);
  assert.equal(r.clean, true, JSON.stringify(r.hits));
});

test("the old fixture is caught, because it was the flip", () => {
  // this exact sentence used to be the clean-copy fixture, and it is the
  // not-X-it's-Y move that reads as machine-written.
  const r = voice.lint("The timeout is almost never the render. It is the cold start.", BANNED);
  assert.equal(r.clean, false);
  assert.ok(r.hits.some((h) => h.rule === "antithesis-flip"));
});

test("hits carry an index, context and a fix label", () => {
  const r = voice.lint("Do this: now", BANNED);
  const h = r.hits[0];
  assert.equal(typeof h.index, "number");
  assert.ok(h.context.length > 0);
  assert.ok(h.fixLabel.length > 0);
});

test("REAL REPO. every checked-in product doc obeys the formatting rules", () => {
  const failures = [];
  for (const slug of repo.products()) {
    for (const name of ["icp", "voice", "offers", "proof", "ethics", "learnings"]) {
      const d = repo.doc(slug, name);
      if (!d.exists) continue;
      const r = voice.lint(d.body, []);
      const structural = r.hits.filter((h) => h.rule === "em-dash" || h.rule === "semicolon");
      for (const h of structural) failures.push(slug + "/" + name + ".md " + h.rule + " " + h.context);
    }
  }
  assert.deepEqual(failures, []);
});
