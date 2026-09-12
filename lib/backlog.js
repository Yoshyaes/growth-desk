"use strict";
/**
 * The assumption backlog.
 *
 * Every claim tagged [assumed] is a bet nobody has checked.
 *
 * An earlier version tried to match each assumption to a written test by word
 * overlap. It did not work, and worse, it failed quietly. A written test
 * restates an assumption in different words, so overlap is near zero exactly
 * when the linkage matters most. Guessing there would have produced a number
 * that looked precise and was wrong.
 *
 * So this module does not guess. It reports two lists. The assumptions on
 * file, and the test plan that has actually been written down. Linking a plan
 * to a claim is a judgement, and judgement belongs to the person reading it.
 */

/** Pull the written test plan out of an "Open assumptions" section. */
function parsePlans(markdown) {
  const src = String(markdown || "");
  const start = src.search(/##+ ?Open assumptions[^\n]*/i);
  if (start === -1) return [];
  const section = src.slice(start).split(/\n##+ /)[0];

  const raw = [];
  let current = null;
  for (const line of section.split("\n")) {
    const numbered = line.match(/^\s*\d+\.\s*(.+)$/);
    if (numbered) {
      if (current) raw.push(current);
      current = numbered[1];
      continue;
    }
    if (current && /^\s{2,}\S/.test(line)) { current += " " + line.trim(); continue; }
    if (current && !line.trim()) { raw.push(current); current = null; }
  }
  if (current) raw.push(current);

  return raw.map((entry) => {
    const flat = entry.replace(/\s+/g, " ").trim();
    // the convention in these files is "<assumption>. Test <how>."
    const split = flat.split(/\.\s+(?=Test\b)/);
    return {
      assumption: (split[0] || flat).replace(/\.$/, "").trim(),
      test: split.length > 1 ? split.slice(1).join(". ").replace(/^Test\s+/i, "").trim() : ""
    };
  }).filter((p) => p.assumption);
}

/**
 * Build the backlog for one product.
 * `entries` is [{ file, tag, text }]. `plans` comes from parsePlans.
 */
function forProduct(slug, entries, plans) {
  const assumed = (entries || []).filter((e) => e.tag === "assumed")
    .map((e) => ({ product: slug, file: e.file, claim: e.text }));
  const written = (plans || []).map((p) => ({ product: slug, ...p }));

  return {
    product: slug,
    assumed,
    plans: written,
    total: assumed.length,
    planned: written.length,
    // stated plainly. a product with assumptions and no plan is the gap.
    hasPlan: written.length > 0
  };
}

/** Group for display. Products with no written plan first. */
function order(products) {
  return [...(products || [])].sort((a, b) => {
    if (a.hasPlan !== b.hasPlan) return a.hasPlan ? 1 : -1;
    return b.total - a.total || a.product.localeCompare(b.product);
  });
}

module.exports = { parsePlans, forProduct, order };
