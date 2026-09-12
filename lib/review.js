"use strict";
/**
 * The weekly review.
 *
 * One rule shapes the whole module. It leads with the worst number. A review
 * that opens with the good news is a review nobody acts on, so `headline`
 * is computed from the weakest signal, never chosen.
 */

const METRICS = Object.freeze(["replies", "qualified_convos", "signups", "paid"]);

const LABEL = Object.freeze({
  replies: "replies",
  qualified_convos: "qualified conversations",
  signups: "attributed signups",
  paid: "paid conversions"
});

/**
 * Build the review.
 * `products` is [{ slug, seven, twentyEight, streak, rows }].
 */
function build(products) {
  const list = products || [];

  // the worst thing in the week, in priority order.
  // a broken habit outranks a bad number, because the habit produces the numbers.
  const habitFailures = list.filter((p) => p.streak && p.streak.failing)
    .sort((a, b) => (a.streak.hit / Math.max(1, a.streak.weekdays)) - (b.streak.hit / Math.max(1, b.streak.weekdays)));

  const silent = list.filter((p) => p.seven && p.seven.moves === 0);

  let headline;
  let worstKind;
  if (habitFailures.length) {
    const p = habitFailures[0];
    worstKind = "habit";
    headline = `${p.slug} sent ${p.streak.hit === 0 ? "nothing" : p.streak.hit + " move" + (p.streak.hit === 1 ? "" : "s")} in ${p.streak.weekdays} weekdays.`;
  } else if (silent.length) {
    worstKind = "silence";
    headline = `${silent.map((p) => p.slug).join(" and ")} sent nothing this week.`;
  } else {
    const worstConv = [...list].sort((a, b) => a.twentyEight.qualified_convos - b.twentyEight.qualified_convos)[0];
    worstKind = "conversion";
    headline = worstConv
      ? `${worstConv.slug} produced ${worstConv.twentyEight.qualified_convos} qualified conversations in 28 days.`
      : "Nothing to report. No products configured.";
  }

  const bestMove = pickBestMove(list);
  const worstChannel = pickWorstChannel(list);

  return {
    headline,
    worstKind,
    products: list.map((p) => ({
      slug: p.slug,
      seven: p.seven,
      twentyEight: p.twentyEight,
      streak: p.streak ? { hit: p.streak.hit, weekdays: p.streak.weekdays, failing: p.streak.failing } : null
    })),
    bestMove,
    worstChannel,
    systemFailing: habitFailures.length > 0,
    // stated plainly rather than softened. the plan asked for this in advance.
    verdict: habitFailures.length
      ? "The system is failing regardless of how the other numbers look. The streak is the product."
      : silent.length
        ? "One product went silent. Decide whether it is paused or dropped, and say which."
        : "The habit held this week."
  };
}

/**
 * The best move is the one that produced conversations, not the one with reach.
 *
 * Ranked lexicographically rather than by a weighted sum, on purpose. A sum
 * lets a pile of replies outrank a real conversation once the pile is big
 * enough, which is the exact failure this whole system exists to avoid.
 * Reach is a tiebreaker and nothing more.
 */
function pickBestMove(products) {
  let best = null;
  for (const p of products || []) {
    for (const r of p.rows || []) {
      const rank = [r.paid || 0, r.qualified_convos || 0, r.signups || 0, r.replies || 0];
      if (rank.every((v) => v === 0)) continue;
      if (!best || compare(rank, best.rank) > 0) {
        best = { rank, product: p.slug, move_id: r.move_id, channel: r.channel, type: r.move_type, ...pick(r) };
      }
    }
  }
  return best;
}

function compare(a, b) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

/** The worst channel is one with moves spent and nothing back. */
function pickWorstChannel(products) {
  const byChannel = new Map();
  for (const p of products || []) {
    for (const r of p.rows || []) {
      const key = p.slug + " / " + r.channel;
      const acc = byChannel.get(key) || { key, product: p.slug, channel: r.channel, moves: 0, replies: 0, convos: 0 };
      acc.moves++;
      acc.replies += r.replies;
      acc.convos += r.qualified_convos;
      byChannel.set(key, acc);
    }
  }
  const candidates = [...byChannel.values()].filter((c) => c.moves >= 3 && c.convos === 0);
  candidates.sort((a, b) => b.moves - a.moves || a.replies - b.replies);
  return candidates[0] || null;
}

function pick(r) {
  return { replies: r.replies, qualified_convos: r.qualified_convos, signups: r.signups, paid: r.paid };
}

module.exports = { build, METRICS, LABEL, pickBestMove, pickWorstChannel };
