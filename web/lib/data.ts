/**
 * The async repo layer.
 *
 * Everything the app reads or writes goes through here, and everything here
 * goes through the store, which routes config to the immutable bundle and
 * state to GitHub. No component touches a file path directly.
 */

import "server-only";
import { createStore, routed, type Store } from "@core/store";
import * as gate from "@core/gate";
import * as voice from "@core/voice";
import * as yaml from "@core/yaml-lite";
import type { Channel, FourNumbers, Move, Queue, Streak } from "@/types/core";

let cached: Store | null = null;
export function store(): Store {
  if (!cached) cached = routed(createStore(process.env));
  return cached;
}

export const PRODUCTS = ["deckle", "marskel", "echoself"] as const;
export type ProductSlug = (typeof PRODUCTS)[number];

export function isProduct(s: string): s is ProductSlug {
  return (PRODUCTS as readonly string[]).includes(s);
}

export function abbrev(slug: string) {
  return (slug[0] + slug.slice(1).replace(/[aeiou]/g, "")).slice(0, 4);
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function daysAgo(n: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function isWeekday(date: string) {
  const day = new Date(date + "T12:00:00Z").getUTCDay();
  return day >= 1 && day <= 5;
}

async function text(path: string) {
  const f = await store().readFile(path);
  return f ? f.content : "";
}

/* ---------- config, from the immutable bundle ---------- */

export async function channelConfig(slug: string) {
  const raw = await text(`products/${slug}/channels.yml`);
  const parsed = raw ? (yaml.parse(raw) as Record<string, unknown>) : {};
  return {
    denylist: (parsed.denylist as { channels?: string[]; patterns?: string[] }) ?? { channels: [], patterns: [] },
    channels: (parsed.channels as Record<string, unknown>[]) ?? []
  };
}

export async function channels(slug: string): Promise<Channel[]> {
  const cfg = await channelConfig(slug);
  return cfg.channels.map((c) => {
    const g = gate.gateFor(cfg, String(c.id));
    return { ...(c as unknown as Channel), gate: g.state, gateReason: g.reason, gateSource: g.source, draftable: g.draftable };
  });
}

export async function bannedWords() {
  return voice.parseBannedWords(await text("shared/voice-rules.md"));
}

export async function ethics(slug: string) {
  const raw = await text(`products/${slug}/ethics.md`);
  const cfg = await channelConfig(slug);
  const section = (raw.split("## Standing rules")[1] ?? "").split("\n## ")[0];
  const standing: string[] = [];
  let current: string | null = null;
  for (const line of section.split("\n")) {
    const start = line.match(/^\s*\d+\.\s*(.+)$/);
    if (start) { if (current) standing.push(current); current = start[1]; continue; }
    if (current && /^\s{2,}\S/.test(line)) { current += " " + line.trim(); continue; }
    if (current && line.trim() === "") { standing.push(current); current = null; }
  }
  if (current) standing.push(current);
  return {
    raw,
    denylist: cfg.denylist,
    standing: standing.map((s) => s.replace(/\*\*/g, "").replace(/\s+/g, " ").trim())
  };
}

export async function claims(slug: string, name: string) {
  const body = await text(`products/${slug}/${name}.md`);
  const out: Array<{ tag: string; text: string }> = [];
  for (const line of body.split("\n")) {
    const m = line.match(/^\s*-\s*\[(verified|assumed|dead|seed|stated)[^\]]*\]\s*(.+)$/i);
    if (m) out.push({ tag: m[1].toLowerCase(), text: m[2].trim() });
  }
  return out;
}

export async function docGaps(slug: string, name: string) {
  const body = await text(`products/${slug}/${name}.md`);
  const blocks = body.match(/##+ ?(Proof gaps?[^\n]*|Do not cite|Blocking note|Note on offer[^\n]*)\n[\s\S]*?(?=\n## |\n#|$)/gi) ?? [];
  return blocks.map((b) => ({
    heading: (b.match(/##+ ?([^\n]+)/) ?? [, ""])[1] as string,
    text: b.replace(/##+ ?[^\n]+\n/, "").trim().replace(/\s+/g, " ").slice(0, 700)
  }));
}

/* ---------- state, from GitHub ---------- */

export function queuePath(slug: string, date = today()) {
  return `products/${slug}/queue/${date}.json`;
}

/**
 * Read a queue and run it through the gate.
 *
 * Nothing blocked escapes this function. A blocked move's draft text is
 * dropped, not redacted, so it cannot leak through a serialised prop.
 */
export async function queue(slug: string, date = today()): Promise<Queue> {
  const raw = await text(queuePath(slug, date));
  const cfg = await channelConfig(slug);
  const empty: Queue = {
    exists: false, date, product: slug, generated_at: null,
    moves: [], dropped: [], excluded: [], short: null
  };
  if (!raw) return empty;

  let parsed: Record<string, unknown>;
  try { parsed = JSON.parse(raw); } catch { return empty; }

  const filtered = gate.applyToQueue(cfg, parsed);
  return {
    exists: true,
    date: (parsed.date as string) ?? date,
    product: slug,
    generated_at: (parsed.generated_at as string) ?? null,
    moves: filtered.moves as Move[],
    dropped: filtered.dropped,
    excluded: (parsed.excluded as Queue["excluded"]) ?? [],
    short: (parsed.short as Queue["short"]) ?? null
  };
}

export async function moveById(slug: string, id: string): Promise<Move | null> {
  const q = await queue(slug);
  return q.moves.find((m) => m.id === id) ?? null;
}

const METRIC_COLS = ["date", "product", "channel", "move_id", "move_type", "url",
  "replies", "qualified_convos", "signups", "paid", "notes"] as const;

function csvSplit(line: string) {
  const out: string[] = [];
  let cur = ""; let inQ = false;
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

export interface MetricRow {
  date: string; product: string; channel: string; move_id: string;
  move_type: string; url: string; notes: string;
  replies: number; qualified_convos: number; signups: number; paid: number;
}

export async function metrics(slug: string): Promise<MetricRow[]> {
  const raw = await text(`products/${slug}/metrics.csv`);
  return raw.split("\n").map((l) => l.trim())
    .filter((l) => l && !l.startsWith("date,product,"))
    .map((l) => {
      const parts = csvSplit(l);
      const row = Object.fromEntries(METRIC_COLS.map((c, i) => [c, parts[i] ?? ""])) as unknown as MetricRow;
      for (const k of ["replies", "qualified_convos", "signups", "paid"] as const) {
        row[k] = parseInt(String(row[k]), 10) || 0;
      }
      return row;
    });
}

/** The four numbers. Page views are not computed here and never will be. */
export async function fourNumbers(slug: string, days = 28): Promise<FourNumbers> {
  const since = daysAgo(days - 1);
  const rows = (await metrics(slug)).filter((r) => r.date >= since);
  return {
    replies: rows.reduce((a, r) => a + r.replies, 0),
    qualified_convos: rows.reduce((a, r) => a + r.qualified_convos, 0),
    signups: rows.reduce((a, r) => a + r.signups, 0),
    paid: rows.reduce((a, r) => a + r.paid, 0),
    moves: rows.length
  };
}

export async function streak(slug: string, days = 14): Promise<Streak> {
  const rows = (await metrics(slug)).filter((r) => r.date >= daysAgo(days - 1));
  const sent = new Set(rows.map((r) => r.date));
  const cells = [];
  let weekdays = 0; let hit = 0;
  for (let i = days - 1; i >= 0; i--) {
    const date = daysAgo(i);
    const weekday = isWeekday(date);
    const did = sent.has(date);
    if (weekday) { weekdays++; if (did) hit++; }
    cells.push({ date, weekday, sent: did });
  }
  return { cells, weekdays, hit, failing: weekdays > 0 && hit / weekdays < 0.5 };
}

export async function queuedCount(slug: string) {
  const q = await queue(slug);
  return q.moves.filter((m) => (m.state ?? "queued") === "queued").length;
}
