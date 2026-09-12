"use strict";
/**
 * Static checks on the Next.js source.
 *
 * The React app needs a toolchain to run, and the rules it has to obey are
 * absolute rather than behavioural. So they are asserted against the source,
 * which needs nothing installed and runs in CI on every commit.
 */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const WEB = path.join(__dirname, "..", "web");

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx?|mjs|css)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const FILES = walk(WEB);
const rel = (f) => path.relative(WEB, f);
const read = (f) => fs.readFileSync(f, "utf8");

/** Strip comments and string prose so a rule is checked against code, not commentary. */
function codeOnly(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
}

test("the web app source exists", () => {
  assert.ok(FILES.length > 15, "expected the app to be written, found " + FILES.length + " files");
});

test("NO POST BUTTON. no component renders a send, post, publish, schedule or merge control", () => {
  // button and link labels only. prose that mentions the rule is fine.
  const labels = [/>\s*Post\b/, />\s*Publish\b/, />\s*Schedule\b/, />\s*Send\b/, />\s*Merge\b/];
  const offenders = [];
  for (const f of FILES.filter((x) => /\.tsx$/.test(x))) {
    const src = read(f);
    for (const m of src.matchAll(/<(button|a|Link)\b[^>]*>([\s\S]{0,80}?)<\/(?:button|a|Link)>/g)) {
      const inner = m[2];
      if (labels.some((re) => re.test(">" + inner.trim()))) offenders.push(rel(f) + " -> " + inner.trim());
    }
  }
  assert.deepEqual(offenders, []);
});

test("NO POST ACTION. the server actions expose only updateMove and lintDraft", () => {
  const src = read(path.join(WEB, "lib", "actions.ts"));
  const exported = [...src.matchAll(/export async function (\w+)/g)].map((m) => m[1]).sort();
  assert.deepEqual(exported, ["lintDraft", "updateMove"]);
  // check the code, not the comment that explains the rule
  const code = codeOnly(src);
  for (const bad of ["postMove", "publish", "sendMove", "schedule", "submitToReddit", "fetch("]) {
    assert.ok(!code.includes(bad), "actions.ts must not contain " + bad);
  }
});

test("THE GATE RUNS ON EVERY WRITE, server side", () => {
  const src = read(path.join(WEB, "lib", "actions.ts"));
  assert.ok(src.startsWith('"use server"'), "actions must be server only");
  assert.ok(src.includes("draftThroughGate"), "updateMove must run the gate before writing");
  assert.ok(src.includes("requireSession"), "updateMove must check the session");
});

test("THE DATA LAYER IS SERVER ONLY", () => {
  const src = read(path.join(WEB, "lib", "data.ts"));
  assert.ok(src.includes('import "server-only"'), "data.ts must never reach a browser bundle");
});

test("NO CLIENT COMPONENT IMPORTS THE STORE OR THE FILESYSTEM", () => {
  for (const f of FILES.filter((x) => /\.tsx$/.test(x))) {
    const src = read(f);
    if (!src.includes('"use client"')) continue;
    for (const bad of ["@core/store", "node:fs", "from \"fs\"", "@/lib/data"]) {
      assert.ok(!src.includes(bad), rel(f) + " is a client component and imports " + bad);
    }
  }
});

test("FOUR NUMBERS. the metrics page defines exactly four tiles and no vanity metric", () => {
  const src = read(path.join(WEB, "app", "(desk)", "[product]", "metrics", "page.tsx"));
  const tiles = src.slice(src.indexOf("const TILES"), src.indexOf("] as const"));
  const keys = [...tiles.matchAll(/\["(\w+)",/g)].map((m) => m[1]);
  assert.deepEqual(keys, ["replies", "qualified_convos", "signups", "paid"]);
  for (const bad of [/impression/i, /\breach\b/i, /pageview/i]) {
    assert.ok(!bad.test(src), "metrics page references " + bad);
  }
  // every mention of "views" must be a disclaimer that they are not tracked
  const total = (src.match(/\bviews\b/gi) ?? []).length;
  const disclaimed = (src.match(/Page views are not\b/gi) ?? []).length;
  assert.ok(total > 0, "the refusal to track views should be stated, not merely implied");
  assert.equal(total, disclaimed, "every mention of views must be a disclaimer");
});

test("AUTH FAILS CLOSED. an empty allowlist lets nobody in", () => {
  const src = read(path.join(WEB, "auth.ts"));
  assert.ok(/if \(!ALLOWED\.length\) return false/.test(src), "auth must refuse when the allowlist is empty");
});

test("MIDDLEWARE protects everything except sign in and the auth endpoints", () => {
  const src = read(path.join(WEB, "middleware.ts"));
  assert.ok(src.includes("api/auth"));
  assert.ok(src.includes("signin"));
  assert.ok(src.includes("matcher"));
});

test("THE PHONE LAYOUT EXISTS. the inspector becomes a sheet, not a hidden screen", () => {
  const css = read(path.join(WEB, "app", "globals.css"));
  assert.ok(css.includes("@media (max-width: 820px)"), "no phone breakpoint");
  assert.ok(css.includes(".sheet"), "the inspector must become a sheet on a phone");
  assert.ok(css.includes(".mobiletabs"), "the nav must become a tab row");
  assert.ok(css.includes("env(safe-area-inset-bottom)"), "bottom nav must clear the home indicator");
});

test("TOKENS. the hosted stylesheet carries the canonical palette", () => {
  const css = read(path.join(WEB, "app", "globals.css"));
  const tokens = ["#ECEEF0", "#15181B", "#33406B", "#3F6B4A", "#8A6A16", "#9B3B2C", "#111417", "#8B9AD1"];
  for (const t of tokens) assert.ok(css.includes(t), "missing token " + t);
  assert.ok(css.includes("Familjen Grotesk") && css.includes("JetBrains Mono"));
});

test("ENV EXAMPLE names every variable the app reads", () => {
  const env = read(path.join(WEB, ".env.example"));
  for (const key of ["GITHUB_REPO", "GITHUB_TOKEN", "GD_STORE", "AUTH_GITHUB_ID", "AUTH_SECRET", "GD_ALLOWED_LOGIN"]) {
    assert.ok(env.includes(key), ".env.example is missing " + key);
  }
  assert.ok(!/GITHUB_TOKEN=\S/.test(env), ".env.example must not contain a real token");
});

test("NO SECRETS are committed anywhere in the web source", () => {
  const patterns = [/ghp_[A-Za-z0-9]{20,}/, /github_pat_[A-Za-z0-9_]{20,}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/];
  for (const f of FILES) {
    const src = read(f);
    for (const re of patterns) assert.ok(!re.test(src), "possible secret in " + rel(f));
  }
});
