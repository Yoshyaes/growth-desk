"use strict";
/**
 * The structural lint.
 *
 * The word list was never the hard part. Fred's own TAG notes say it plainly.
 * Structural tells are more diagnostically important than the banned word list
 * alone, and every draft this repo generated passed the word lint while still
 * reading as machine-written.
 *
 * These are the moves that give it away. Sourced from Fred's TAG brand voice,
 * his banned-words reference, and the Reddit comment rules for the Yoshyaes
 * account, not invented here.
 *
 * Pure. No IO. Advisory, like the word lint. It never blocks a copy.
 */

/** Split into sentences without breaking on decimals, urls or abbreviations. */
function sentences(text) {
  return String(text || "")
    .replace(/https?:\/\/\S+/g, " URL ")
    .replace(/\b(\d)\.(\d)/g, "$1DOT$2")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.replace(/DOT/g, ".").trim())
    .filter(Boolean);
}

function words(s) {
  return String(s).trim().split(/\s+/).filter(Boolean);
}

function context(text, index, width) {
  const w = width || 34;
  const start = Math.max(0, index - 10);
  const end = Math.min(text.length, index + w);
  return (start > 0 ? "..." : "") + text.slice(start, end).replace(/\s+/g, " ") + (end < text.length ? "..." : "");
}

const PATTERNS = [
  {
    rule: "antithesis-flip",
    label: "The not-X-it's-Y flip",
    why: "The single loudest tell. Splitting it into two sentences does not hide it.",
    re: /\b(?:it'?s|that'?s|this is|they'?re)?\s*(?:not|isn'?t|aren'?t|never)\b[^.!?]{4,70}[.,]\s*(?:it'?s|that'?s|they'?re|it is)\b/gi
  },
  {
    rule: "announced-list",
    label: "Announcing the count before the list",
    why: "Three things that fix it, two real options, four reasons. Nobody talks like this.",
    re: /\b(?:two|three|four|five|a couple of|a few)\s+(?:real\s+|main\s+|key\s+|common\s+)?(?:things|options|reasons|ways|fixes|steps|problems|causes)\b[^.!?]{0,40}[.:]/gi
  },
  {
    rule: "numbered-list",
    label: "A numbered list inside a reply",
    why: "Fine in docs. In a comment it reads as generated. Use prose or line breaks.",
    re: /(^|\n)\s*\d\.\s+\S/g
  },
  {
    rule: "diagnostic-opener",
    label: "Diagnosing before answering",
    why: "What you're describing is, it sounds like, the issue here is. Just answer.",
    re: /\b(?:what you'?re (?:describing|seeing|hitting) is|it sounds like|the (?:issue|problem) here is|this is a classic)\b/gi
  },
  {
    rule: "triplet",
    label: "The X, Y and Z triplet",
    why: "Perfect three-part lists in a sentence are a rhythm humans rarely hit twice.",
    re: /\b\w+(?:\s\w+){0,2},\s\w+(?:\s\w+){0,2},?\s+and\s+\w+(?:\s\w+){0,2}\b/g
  },
  {
    rule: "not-only",
    label: "Not only X but also Y",
    re: /\bnot only\b[^.!?]{0,60}\bbut (?:also )?\b/gi
  },
  {
    rule: "from-to-range",
    label: "The from X to Y range",
    re: /\bfrom \w+(?:\s\w+){0,3} to \w+(?:\s\w+){0,3}\b/gi
  },
  {
    rule: "prose-colon-list",
    label: "A colon dragging a list into prose",
    why: "Already banned by the formatting rules. Flagged again because it hides in drafts.",
    re: /:\s*(?:\n|\s)*(?:[-*]|\d\.)\s/g
  },
  {
    rule: "vague-intensity",
    label: "Intensity with nothing behind it",
    why: "Bold, remarkable, fascinating. Say the number instead.",
    re: /\b(?:bold|fascinating|remarkable|incredible|powerful|compelling|striking|impressive)\b/gi
  },
  {
    rule: "tidy-close",
    label: "The tidy closing line",
    why: "And that makes all the difference. Stop one sentence earlier.",
    re: /(?:^|\n)[^.!?\n]{0,50}\b(?:and that(?:'s| is)?|which is (?:exactly )?why|that'?s the whole)\b[^.!?\n]{0,60}[.!]\s*$/gi
  }
];

/** Bridges are fine once. As a habit they are a tell. */
const BRIDGES = /\b(?:here'?s the thing|look,|honestly,|real talk|the thing is|thing is,)\b/gi;

function structure(text) {
  const src = String(text == null ? "" : text);
  const hits = [];

  for (const p of PATTERNS) {
    const re = new RegExp(p.re.source, p.re.flags);
    let m;
    while ((m = re.exec(src)) !== null) {
      hits.push({
        rule: p.rule, label: p.label, why: p.why || null,
        index: m.index, found: m[0].trim().slice(0, 60), context: context(src, m.index)
      });
      if (m.index === re.lastIndex) re.lastIndex++;
    }
  }

  const sents = sentences(src);

  // a repeated bridge phrase, not the first one
  const bridges = [...src.matchAll(BRIDGES)];
  if (bridges.length > 1) {
    for (const b of bridges.slice(1)) {
      hits.push({
        rule: "repeat-bridge", label: "The same bridge phrase twice",
        why: "One is voice. Two is a habit, and habits read as generated.",
        index: b.index, found: b[0], context: context(src, b.index)
      });
    }
  }

  // contractions. their absence is the most reliable single signal
  if (sents.length >= 3) {
    const contractions = (src.match(/\b\w+'(?:s|t|re|ve|ll|d|m)\b/gi) || []).length;
    if (contractions === 0) {
      hits.push({
        rule: "no-contractions", label: "Not one contraction",
        why: "Contractions are mandatory in your voice. Their absence is the loudest tell there is.",
        index: 0, found: "", context: sents[0].slice(0, 44)
      });
    }
  }

  // uniform sentence length. real writing varies hard
  if (sents.length >= 4) {
    const lens = sents.map((s) => words(s).length);
    const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
    const sd = Math.sqrt(lens.reduce((a, b) => a + (b - mean) ** 2, 0) / lens.length);
    const shortest = Math.min(...lens);
    const range = Math.max(...lens) - shortest;
    // a short sentence is what actually breaks a rhythm, so its presence
    // clears this check outright. spread and range alone flagged real writing
    // that held a one word sentence next to a twelve word one.
    if (sd < 4 && range < 12 && shortest > 4 && mean > 6) {
      hits.push({
        rule: "uniform-rhythm", label: "Every sentence the same length",
        why: "Lengths sit within " + range + " words of each other. Break one in half.",
        index: 0, found: "", context: lens.join(", ") + " words"
      });
    } else if (shortest > 6 && sents.length >= 5) {
      hits.push({
        rule: "no-short-sentence", label: "No short sentence anywhere",
        why: "Shortest is " + shortest + " words. A three word sentence resets the rhythm.",
        index: 0, found: "", context: lens.join(", ") + " words"
      });
    }
  }

  hits.sort((a, b) => a.index - b.index);

  return {
    clean: hits.length === 0,
    hits,
    sentences: sents.length,
    summary: [
      { rule: "antithesis-flip", label: "Not-X-it's-Y", count: hits.filter((h) => h.rule === "antithesis-flip").length },
      { rule: "announced-list", label: "Announced lists", count: hits.filter((h) => h.rule === "announced-list" || h.rule === "numbered-list").length },
      { rule: "rhythm", label: "Rhythm", count: hits.filter((h) => ["uniform-rhythm", "no-short-sentence", "no-contractions"].includes(h.rule)).length },
      { rule: "other", label: "Other tells", count: hits.filter((h) => !["antithesis-flip", "announced-list", "numbered-list", "uniform-rhythm", "no-short-sentence", "no-contractions"].includes(h.rule)).length }
    ]
  };
}

module.exports = { structure, sentences, PATTERNS };
