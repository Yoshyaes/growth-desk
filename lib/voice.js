"use strict";
/**
 * The voice lint.
 *
 * Enforces shared/voice-rules.md on any draft before it can be copied out.
 * Pure. The banned list is passed in so this module can be tested without IO.
 *
 * Three hard formatting rules and one word list.
 *   no em dashes or en dashes
 *   no colons, except inside a URL, a code span, or a clock time
 *   no semicolons
 */

const EM_DASH = /[—–]/g;
const SEMICOLON = /;/g;

/** Ranges that a colon is allowed to live inside. */
function protectedRanges(text) {
  const ranges = [];
  const push = (re) => {
    let m;
    const r = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
    while ((m = r.exec(text)) !== null) {
      ranges.push([m.index, m.index + m[0].length]);
      if (m.index === r.lastIndex) r.lastIndex++;
    }
  };
  push(/`[^`]*`/g);                 // code spans
  push(/https?:\/\/\S+/gi);         // urls
  push(/\b[a-z][a-z0-9+.-]*:\/\/\S+/gi);
  push(/\b\d{1,2}:\d{2}\b/g);       // clock times
  return ranges;
}

function inRanges(i, ranges) {
  return ranges.some(([a, b]) => i >= a && i < b);
}

function context(text, index, width) {
  const w = width || 28;
  const start = Math.max(0, index - w);
  const end = Math.min(text.length, index + w);
  return (start > 0 ? "..." : "") + text.slice(start, end).replace(/\n/g, " ") + (end < text.length ? "..." : "");
}

const { structure } = require("./structure");

function lint(text, bannedWords) {
  const src = String(text == null ? "" : text);
  const hits = [];

  let m;
  const em = new RegExp(EM_DASH.source, "g");
  while ((m = em.exec(src)) !== null) {
    hits.push({
      rule: "em-dash",
      label: "No em dashes",
      index: m.index,
      length: m[0].length,
      found: m[0],
      context: context(src, m.index),
      fix: ". ",
      fixLabel: "replace with a period"
    });
  }

  const ranges = protectedRanges(src);
  for (let i = 0; i < src.length; i++) {
    if (src[i] !== ":") continue;
    if (inRanges(i, ranges)) continue;
    hits.push({
      rule: "colon",
      label: "No colons",
      index: i,
      length: 1,
      found: ":",
      context: context(src, i),
      fix: ".",
      fixLabel: "replace with a period"
    });
  }

  const semi = new RegExp(SEMICOLON.source, "g");
  while ((m = semi.exec(src)) !== null) {
    if (inRanges(m.index, ranges)) continue;
    hits.push({
      rule: "semicolon",
      label: "No semicolons",
      index: m.index,
      length: 1,
      found: ";",
      context: context(src, m.index),
      fix: ".",
      fixLabel: "split into two sentences"
    });
  }

  const banned = Array.isArray(bannedWords) ? bannedWords : [];
  for (const word of banned) {
    const w = String(word).trim();
    if (!w) continue;
    const re = new RegExp("(^|[^a-z0-9-])(" + escapeRe(w) + ")(?![a-z0-9-])", "gi");
    let mm;
    while ((mm = re.exec(src)) !== null) {
      const at = mm.index + mm[1].length;
      if (inRanges(at, ranges)) continue;
      hits.push({
        rule: "banned-word",
        label: "Banned word",
        index: at,
        length: mm[2].length,
        found: mm[2],
        context: context(src, at),
        fix: null,
        fixLabel: "rewrite without it"
      });
    }
  }

  // structural tells, which matter more than the word list. advisory, like
  // everything else here. it never blocks a copy.
  const st = structure(src);
  for (const h of st.hits) {
    hits.push({
      rule: h.rule, label: h.label, index: h.index, length: 0,
      found: h.found, context: h.why || h.context,
      fix: null, fixLabel: h.why || "rewrite the shape, not the words",
      structural: true
    });
  }

  hits.sort((a, b) => a.index - b.index);

  return {
    clean: hits.length === 0,
    structure: st,
    hits,
    summary: [
      { rule: "em-dash", label: "No em dashes", count: hits.filter((h) => h.rule === "em-dash").length },
      { rule: "colon", label: "No colons", count: hits.filter((h) => h.rule === "colon").length },
      { rule: "semicolon", label: "No semicolons", count: hits.filter((h) => h.rule === "semicolon").length },
      {
        rule: "banned-word",
        label: "Banned words",
        count: hits.filter((h) => h.rule === "banned-word").length,
        total: banned.length
      },
      {
        rule: "structure",
        label: "AI tells",
        count: st.hits.length,
        total: null
      }
    ]
  };
}

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Pull the banned list out of shared/voice-rules.md. */
function parseBannedWords(markdown) {
  const src = String(markdown || "");
  const start = src.indexOf("## Banned words");
  if (start === -1) return [];
  const after = src.slice(start);
  const bodyStart = after.indexOf("\n", after.indexOf("Never use any of these"));
  const end = after.indexOf("\n## ", 1);
  const body = after.slice(bodyStart, end === -1 ? undefined : end);
  return body
    .split(",")
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s && !s.startsWith("#") && !/^Also banned/i.test(s) && s.length < 60);
}

module.exports = { lint, parseBannedWords, escapeRe };
