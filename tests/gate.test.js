"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const gate = require("../lib/gate");
const repo = require("../lib/repo");

const fixture = {
  denylist: {
    channels: ["r/GriefSupport", "r/hospice"],
    patterns: ["grief", "caregiver", "end of life"]
  },
  channels: [
    { id: "r/node", gate: "open", status: "active", cadence_cap_per_week: 2 },
    { id: "r/startups", gate: "no_first_person_promo", status: "active" },
    { id: "stackoverflow", gate: "never_post", status: "research_only" },
    { id: "r/GriefSupport", gate: "open", status: "active" },
    { id: "weird", gate: "banana", status: "active" }
  ]
};

test("open channel resolves open and allows promotional copy", () => {
  const g = gate.gateFor(fixture, "r/node");
  assert.equal(g.state, "open");
  assert.equal(g.draftable, true);
  assert.equal(g.promotionalAllowed, true);
});

test("no_first_person_promo resolves restricted", () => {
  const g = gate.gateFor(fixture, "r/startups");
  assert.equal(g.state, "restricted");
  assert.equal(g.draftable, true);
  assert.equal(g.promotionalAllowed, false);
});

test("never_post resolves blocked", () => {
  assert.equal(gate.gateFor(fixture, "stackoverflow").state, "blocked");
});

test("FAIL CLOSED. an unknown channel is blocked, not open", () => {
  const g = gate.gateFor(fixture, "r/SomeChannelNobodyConfigured");
  assert.equal(g.state, "blocked");
  assert.equal(g.source, "fail-closed");
});

test("FAIL CLOSED. an unrecognised gate value is blocked", () => {
  assert.equal(gate.gateFor(fixture, "weird").state, "blocked");
});

test("FAIL CLOSED. empty, null and undefined channels are blocked", () => {
  for (const v of ["", "   ", null, undefined]) {
    assert.equal(gate.gateFor(fixture, v).state, "blocked");
  }
});

test("FAIL CLOSED. an empty config blocks everything", () => {
  assert.equal(gate.gateFor({}, "r/node").state, "blocked");
  assert.equal(gate.gateFor(null, "r/node").state, "blocked");
});

test("the denylist beats an explicit open gate on the same channel", () => {
  const g = gate.gateFor(fixture, "r/GriefSupport");
  assert.equal(g.state, "blocked");
  assert.match(g.source, /denylist/);
});

test("pattern matching is case insensitive and matches substrings", () => {
  for (const id of ["r/CaregiverSupport", "fb-END OF LIFE-group", "GriefAndLoss", "r/caregivers"]) {
    assert.equal(gate.gateFor(fixture, id).state, "blocked", id + " should be blocked");
  }
});

test("a channel that merely looks similar is still blocked by fail-closed", () => {
  assert.equal(gate.gateFor(fixture, "r/nodejs").state, "blocked");
});

test("NO DRAFT FOR A BLOCKED CHANNEL. draftThroughGate returns empty string", () => {
  const out = gate.draftThroughGate(fixture, "r/GriefSupport", "Sorry for your loss, try our product");
  assert.equal(out.allowed, false);
  assert.equal(out.draft, "");
  assert.notEqual(out.draft, "Sorry for your loss, try our product");
});

test("NO DRAFT FOR A BLOCKED CHANNEL. no option flag can override it", () => {
  for (const opts of [{}, { promotional: false }, { promotional: true }, { force: true }, { override: true }]) {
    const out = gate.draftThroughGate(fixture, "stackoverflow", "here is my product link", opts);
    assert.equal(out.allowed, false);
    assert.equal(out.draft, "");
  }
});

test("restricted channels allow non-promotional copy and refuse promotional copy", () => {
  const ok = gate.draftThroughGate(fixture, "r/startups", "here is the answer", { promotional: false });
  assert.equal(ok.allowed, true);
  assert.equal(ok.draft, "here is the answer");

  const no = gate.draftThroughGate(fixture, "r/startups", "check out my product", { promotional: true });
  assert.equal(no.allowed, false);
  assert.equal(no.draft, "");
});

test("applyToQueue drops blocked moves entirely rather than redacting them", () => {
  const q = {
    moves: [
      { id: "a", channel: "r/node", type: "helpful_reply", draft: "fine" },
      { id: "b", channel: "r/GriefSupport", type: "helpful_reply", draft: "never" },
      { id: "c", channel: "r/startups", type: "soft_reply", draft: "promo in a restricted room" },
      { id: "d", channel: "r/unconfigured", type: "helpful_reply", draft: "unknown" }
    ]
  };
  const out = gate.applyToQueue(fixture, q);
  assert.deepEqual(out.moves.map((m) => m.id), ["a"]);
  assert.deepEqual(out.dropped.map((m) => m.id).sort(), ["b", "c", "d"]);
  const serialised = JSON.stringify(out);
  assert.ok(!serialised.includes("never"), "blocked draft text must not survive anywhere in the result");
});

test("partition separates allowed from excluded", () => {
  const p = gate.partition(fixture, ["r/node", "stackoverflow", "r/hospice"]);
  assert.deepEqual(p.allowed.map((a) => a.channel), ["r/node"]);
  assert.deepEqual(p.excluded.map((a) => a.channel), ["stackoverflow", "r/hospice"]);
});

/* ---------- the real repo, not fixtures ---------- */

test("REAL REPO. every echoself community named in ethics.md is blocked by the gate", () => {
  const cfg = repo.channelConfig("echoself");
  const named = [
    "r/GriefSupport", "r/hospice", "r/CaregiverSupport", "r/AgingParents", "r/cancer",
    "r/ALS", "r/dementia", "r/Alzheimers", "r/widowers", "r/SuicideBereavement",
    "r/TerminalIllness", "r/palliativecare"
  ];
  for (const id of named) {
    assert.equal(gate.gateFor(cfg, id).state, "blocked", id + " must be blocked");
  }
});

test("REAL REPO. the echoself substring patterns catch groups by name", () => {
  const cfg = repo.channelConfig("echoself");
  const groups = [
    "Caring for a Parent with Dementia",
    "Hospice Families Support Group",
    "fb-terminal-diagnosis-support",
    "End of Life Doulas",
    "Memorial Planning Circle",
    "Young Widows and Widowers"
  ];
  for (const g of groups) {
    assert.equal(gate.gateFor(cfg, g).state, "blocked", g + " must be blocked");
  }
});

test("REAL REPO. stackoverflow is blocked for deckle", () => {
  assert.equal(gate.gateFor(repo.channelConfig("deckle"), "stackoverflow").state, "blocked");
});

test("REAL REPO. no product has a channel whose gate value is unrecognised", () => {
  for (const slug of repo.products()) {
    for (const c of repo.channels(slug)) {
      assert.ok(["open", "restricted", "blocked"].includes(c.gate),
        slug + "/" + c.id + " resolved to " + c.gate);
    }
  }
});
