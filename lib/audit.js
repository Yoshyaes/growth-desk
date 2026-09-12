"use strict";
/**
 * The landing audit model.
 *
 * Scoring a page is judgement, so the scores come from the landing-audit
 * skill, which writes products/<slug>/audits/YYYY-MM-DD.json. This module
 * holds the rubric, the arithmetic and the rules about which diffs may ship.
 *
 * The interesting rule is the held diff. A replacement that cites proof the
 * product does not have cannot ship, and it is shown as held rather than
 * hidden, so the missing benchmark stays visible as work rather than
 * disappearing into a backlog.
 */

const RUBRIC = Object.freeze([
  { n: 1, key: "trigger", question: "Headline names the buyer's trigger event" },
  { n: 2, key: "wedge", question: "The real wedge is visible above the fold" },
  { n: 3, key: "proof", question: "Proof is verbatim and attributed to a named source" },
  { n: 4, key: "offer", question: "The lowest-friction offer is the most prominent" },
  { n: 5, key: "objection", question: "The page answers the top objection in proof.md" },
  { n: 6, key: "voice", question: "The copy obeys the voice rules" },
  { n: 7, key: "recognition", question: "The buyer would recognise their own words" }
]);

const MAX_PER = 5;
const MAX_TOTAL = RUBRIC.length * MAX_PER;

function clampScore(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(MAX_PER, Math.round(n)));
}

/** Score one audit. Missing answers count zero, which is the honest default. */
function score(answers) {
  const a = answers || {};
  const rows = RUBRIC.map((r) => {
    const value = clampScore(a[r.key]);
    return { ...r, value, weak: value <= 2 };
  });
  const total = rows.reduce((sum, r) => sum + r.value, 0);
  return {
    rows,
    total,
    max: MAX_TOTAL,
    weakest: rows.filter((r) => r.weak).map((r) => r.key),
    // the score is reported before the diff so a weak page cannot be fixed cosmetically
    verdict: total >= 30 ? "strong" : total >= 22 ? "workable" : "weak"
  };
}

/**
 * Classify a diff item.
 *
 * A replacement that cites a claim absent from proof.md is HELD. It is
 * rendered, not hidden, with the missing evidence named.
 */
function classifyDiff(item, proofClaims) {
  const claims = (proofClaims || []).map((c) => String(c.text || c).toLowerCase());
  const cites = Array.isArray(item.cites) ? item.cites : [];
  const missing = cites.filter((c) => {
    const needle = String(c).toLowerCase();
    return !claims.some((known) => known.includes(needle) || needle.includes(known));
  });

  return {
    ...item,
    shippable: missing.length === 0,
    held: missing.length > 0,
    missingEvidence: missing,
    heldReason: missing.length
      ? "this replacement cites " + missing.join(", ") + ", which is not in proof.md"
      : null
  };
}

/** Order by revenue impact, then put held items last within their band. */
function prioritise(items) {
  const weight = { high: 0, medium: 1, low: 2 };
  return [...(items || [])].sort((a, b) => {
    const wa = weight[a.impact] ?? 3;
    const wb = weight[b.impact] ?? 3;
    if (wa !== wb) return wa - wb;
    if (a.held !== b.held) return a.held ? 1 : -1;
    return 0;
  });
}

/** Build the whole audit view from a raw file and the product's proof. */
function build(raw, proofClaims) {
  const a = raw || {};
  const scored = score(a.scores);
  const items = prioritise((a.diff || []).map((d) => classifyDiff(d, proofClaims)));
  const shippable = items.filter((i) => i.shippable);
  const held = items.filter((i) => i.held);
  return {
    exists: Boolean(raw),
    url: a.url || null,
    date: a.date || null,
    score: scored,
    items,
    shippable,
    held,
    // the app opens a pull request. it never merges, for the same reason it never posts.
    pullRequest: shippable.length
      ? { branch: "growth-desk/audit-" + (a.date || "undated"), files: shippable.length, merges: false }
      : null
  };
}

module.exports = { RUBRIC, MAX_PER, MAX_TOTAL, score, classifyDiff, prioritise, build };
