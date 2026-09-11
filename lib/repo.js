"use strict";
/**
 * The repo layer. Every read and write in the application goes through here.
 *
 * The files under products/ are the single source of truth. There is no
 * database. The CLI, Claude Code and this application all read the same bytes.
 */

const fs = require("fs");
const path = require("path");
const yaml = require("./yaml-lite");
const gate = require("./gate");
const voice = require("./voice");

const ROOT = path.resolve(__dirname, "..");
const PRODUCTS = path.join(ROOT, "products");

const PRODUCT_FILES = ["icp", "voice", "offers", "proof", "channels", "ethics", "learnings", "metrics"];

function readIf(p, fallback) {
  try { return fs.readFileSync(p, "utf8"); } catch { return fallback; }
}

function products() {
  if (!fs.existsSync(PRODUCTS)) return [];
  return fs.readdirSync(PRODUCTS)
    .filter((d) => fs.statSync(path.join(PRODUCTS, d)).isDirectory())
    .sort();
}

function slugAbbrev(slug) {
  const s = String(slug);
  return (s[0] + s.slice(1).replace(/[aeiou]/g, "")).slice(0, 4);
}

function channelConfig(slug) {
  const raw = readIf(path.join(PRODUCTS, slug, "channels.yml"), "");
  const parsed = raw ? yaml.parse(raw) : {};
  return {
    denylist: (parsed && parsed.denylist) || { channels: [], patterns: [] },
    channels: (parsed && parsed.channels) || []
  };
}

function channels(slug) {
  const cfg = channelConfig(slug);
  return cfg.channels.map((c) => {
    const g = gate.gateFor(cfg, c.id);
    return { ...c, gate: g.state, gateReason: g.reason, gateSource: g.source, draftable: g.draftable };
  });
}

/* ---------- metrics ---------- */

const METRIC_COLS = ["date", "product", "channel", "move_id", "move_type", "url",
  "replies", "qualified_convos", "signups", "paid", "notes"];

function csvSplit(line) {
  const out = []; let cur = ""; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

function metrics(slug) {
  const raw = readIf(path.join(PRODUCTS, slug, "metrics.csv"), "");
  return raw.split("\n").map((l) => l.trim())
    .filter((l) => l && !l.startsWith("date,product,"))
    .map((l) => {
      const parts = csvSplit(l);
      const row = {};
      METRIC_COLS.forEach((c, i) => { row[c] = parts[i] === undefined ? "" : parts[i]; });
      ["replies", "qualified_convos", "signups", "paid"].forEach((k) => {
        row[k] = parseInt(row[k], 10) || 0;
      });
      return row;
    });
}

function daysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function today() { return new Date().toISOString().slice(0, 10); }

function isWeekday(dateStr) {
  const day = new Date(dateStr + "T12:00:00Z").getUTCDay();
  return day >= 1 && day <= 5;
}

/** The four numbers. Page views are not computed here and never will be. */
function fourNumbers(slug, days) {
  const since = daysAgo((days || 28) - 1);
  const rows = metrics(slug).filter((r) => r.date >= since);
  return {
    replies: rows.reduce((a, r) => a + r.replies, 0),
    qualified_convos: rows.reduce((a, r) => a + r.qualified_convos, 0),
    signups: rows.reduce((a, r) => a + r.signups, 0),
    paid: rows.reduce((a, r) => a + r.paid, 0),
    moves: rows.length
  };
}

function streak(slug, days) {
  const n = days || 14;
  const rows = metrics(slug).filter((r) => r.date >= daysAgo(n - 1));
  const sent = new Set(rows.map((r) => r.date));
  const cells = [];
  let weekdays = 0; let hit = 0;
  for (let i = n - 1; i >= 0; i--) {
    const d = daysAgo(i);
    const weekday = isWeekday(d);
    const did = sent.has(d);
    if (weekday) { weekdays++; if (did) hit++; }
    cells.push({ date: d, weekday, sent: did });
  }
  return { cells, weekdays, hit, failing: weekdays > 0 && hit / weekdays < 0.5 };
}

/* ---------- queue ---------- */

function queuePath(slug, date) {
  return path.join(PRODUCTS, slug, "queue", (date || today()) + ".json");
}

/**
 * Read today's generated queue and run it through the gate.
 * Nothing blocked ever escapes this function.
 */
function queue(slug, date) {
  const p = queuePath(slug, date);
  const raw = readIf(p, null);
  const cfg = channelConfig(slug);
  if (!raw) {
    return { exists: false, date: date || today(), product: slug, moves: [], excluded: [], dropped: [], short: null };
  }
  let parsed;
  try { parsed = JSON.parse(raw); } catch { 
    return { exists: false, error: "queue file is not valid JSON", date: date || today(), product: slug, moves: [], excluded: [], dropped: [], short: null };
  }
  const filtered = gate.applyToQueue(cfg, parsed);
  const declaredExclusions = Array.isArray(parsed.excluded) ? parsed.excluded : [];
  return {
    exists: true,
    date: parsed.date || date || today(),
    product: slug,
    generated_at: parsed.generated_at || null,
    moves: filtered.moves,
    dropped: filtered.dropped,
    excluded: declaredExclusions,
    short: parsed.short || null
  };
}

/** Update one move's state or draft. Cannot add a move. Cannot change exclusions. */
function updateMove(slug, moveId, patch, date) {
  const p = queuePath(slug, date);
  const raw = readIf(p, null);
  if (!raw) return { ok: false, error: "no queue for that date" };
  const parsed = JSON.parse(raw);
  const idx = (parsed.moves || []).findIndex((m) => m.id === moveId);
  if (idx === -1) return { ok: false, error: "unknown move id" };

  const allowed = {};
  if (typeof patch.state === "string" && ["queued", "drafted", "copied", "skipped"].includes(patch.state)) {
    allowed.state = patch.state;
  }
  if (typeof patch.draft === "string") allowed.draft = patch.draft;

  // a draft edit must still pass the gate for its channel
  const cfg = channelConfig(slug);
  const move = parsed.moves[idx];
  const check = gate.draftThroughGate(cfg, move.channel, allowed.draft ?? move.draft, {
    promotional: gate.isPromotional(move.type)
  });
  if (!check.allowed) return { ok: false, error: check.reason, gate: check.gate };

  parsed.moves[idx] = { ...move, ...allowed, updated_at: new Date().toISOString() };
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(parsed, null, 2) + "\n");
  return { ok: true, move: parsed.moves[idx] };
}

/* ---------- product docs ---------- */

function doc(slug, name) {
  const raw = readIf(path.join(PRODUCTS, slug, name + ".md"), "");
  const { data, body } = yaml.frontmatter(raw);
  return { name, data, body, raw, exists: Boolean(raw) };
}

/** Pull tagged claims out of a product doc. [verified] and [assumed]. */
function claims(slug, name) {
  const { body } = doc(slug, name);
  const out = [];
  for (const line of body.split("\n")) {
    const m = line.match(/^\s*-\s*\[(verified|assumed|dead|seed|stated)[^\]]*\]\s*(.+)$/i);
    if (m) out.push({ tag: m[1].toLowerCase(), text: m[2].trim() });
  }
  return out;
}

function bannedWords() {
  return voice.parseBannedWords(readIf(path.join(ROOT, "shared", "voice-rules.md"), ""));
}

function ethics(slug) {
  const raw = readIf(path.join(PRODUCTS, slug, "ethics.md"), "");
  const cfg = channelConfig(slug);
  const standing = [];
  const section = (raw.split("## Standing rules")[1] || "").split("\n## ")[0];
  let current = null;
  for (const line of section.split("\n")) {
    const start = line.match(/^\s*\d+\.\s*(.+)$/);
    if (start) {
      if (current) standing.push(current);
      current = start[1];
      continue;
    }
    // a wrapped continuation of the rule above
    if (current && /^\s{2,}\S/.test(line)) { current += " " + line.trim(); continue; }
    if (current && line.trim() === "") { standing.push(current); current = null; }
  }
  if (current) standing.push(current);
  const clean = standing.map((s2) => s2.replace(/\*\*/g, "").replace(/\s+/g, " ").trim());
  standing.length = 0;
  standing.push(...clean);
  return { raw, standing, denylist: cfg.denylist };
}

module.exports = {
  ROOT, PRODUCTS, PRODUCT_FILES, METRIC_COLS,
  products, slugAbbrev, channelConfig, channels,
  metrics, fourNumbers, streak, daysAgo, today, isWeekday,
  queue, queuePath, updateMove,
  doc, claims, ethics, bannedWords
};
