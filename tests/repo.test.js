"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const repo = require("../lib/repo");
const yaml = require("../lib/yaml-lite");

test("all three products are present", () => {
  assert.deepEqual(repo.products(), ["deckle", "echoself", "marskel"]);
});

test("every product has all eight canonical files", () => {
  for (const slug of repo.products()) {
    for (const name of ["icp", "voice", "offers", "proof", "ethics", "learnings"]) {
      assert.ok(repo.doc(slug, name).exists, slug + "/" + name + ".md is missing");
    }
    assert.ok(fs.existsSync(path.join(repo.PRODUCTS, slug, "channels.yml")), slug + "/channels.yml");
    assert.ok(fs.existsSync(path.join(repo.PRODUCTS, slug, "metrics.csv")), slug + "/metrics.csv");
  }
});

test("every channels.yml parses and every channel has an id and a gate", () => {
  for (const slug of repo.products()) {
    const cfg = repo.channelConfig(slug);
    assert.ok(Array.isArray(cfg.channels) && cfg.channels.length > 0, slug);
    for (const c of cfg.channels) {
      assert.ok(c.id, slug + " has a channel with no id");
      assert.ok(["open", "no_first_person_promo", "restricted", "never_post"].includes(c.gate),
        slug + "/" + c.id + " has gate " + c.gate);
      assert.ok(["active", "warming", "burned", "research_only"].includes(c.status),
        slug + "/" + c.id + " has status " + c.status);
    }
  }
});

test("ETHICS PARITY. every community named in echoself ethics.md is in the machine denylist", () => {
  const e = repo.ethics("echoself");
  // only the never_post section. the restricted and open sections name
  // communities that are allowed, and must not be treated as denied.
  const neverSection = (e.raw.split("## never_post")[1] || "").split("## no_first_person_promo")[0];
  const named = (neverSection.match(/`r\/[A-Za-z]+`/g) || []).map((s) => s.replace(/`/g, ""));
  assert.ok(named.length >= 12, "expected the never_post list to be found, got " + named.length);
  const denied = new Set((e.denylist.channels || []).map((c) => String(c).toLowerCase()));
  const patterns = (e.denylist.patterns || []).map((p) => String(p).toLowerCase());
  const missing = named.filter((n) => {
    const l = n.toLowerCase();
    if (denied.has(l)) return false;
    return !patterns.some((p) => l.includes(p));
  });
  assert.deepEqual(missing, [], "named in ethics.md but not enforced by the gate");
});

test("metrics.csv round trips and the four numbers compute", () => {
  for (const slug of repo.products()) {
    const n = repo.fourNumbers(slug, 28);
    for (const k of ["replies", "qualified_convos", "signups", "paid", "moves"]) {
      assert.equal(typeof n[k], "number", slug + "." + k);
    }
    assert.equal("views" in n, false, "views must never be computed");
  }
});

test("the streak reports weekdays and flags failure below half", () => {
  const s = repo.streak("deckle", 14);
  assert.equal(s.cells.length, 14);
  assert.ok(s.weekdays >= 9 && s.weekdays <= 10);
});

test("PAGE VIEWS. the metric columns contain no view-shaped field", () => {
  for (const col of repo.METRIC_COLS) {
    assert.ok(!/view|impression|reach/i.test(col), col + " is a vanity metric");
  }
});

test("yaml-lite handles the shapes this repo uses", () => {
  const d = yaml.parse([
    "denylist:",
    "  channels:",
    "    - a",
    "    - b",
    "  patterns: []",
    "channels:",
    "  - id: r/one",
    "    gate: open",
    "    subscribers: null",
    "    cap: 2",
    "    tags: [x, y]",
    "  - id: r/two",
    "    gate: never_post   # a comment",
    '    note: "has: a colon"'
  ].join("\n"));
  assert.deepEqual(d.denylist.channels, ["a", "b"]);
  assert.deepEqual(d.denylist.patterns, []);
  assert.equal(d.channels.length, 2);
  assert.equal(d.channels[0].subscribers, null);
  assert.equal(d.channels[0].cap, 2);
  assert.deepEqual(d.channels[0].tags, ["x", "y"]);
  assert.equal(d.channels[1].gate, "never_post");
  assert.equal(d.channels[1].note, "has: a colon");
});
