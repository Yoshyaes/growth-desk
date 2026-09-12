"use strict";
const { esc } = require("../../lib/html");
const repo = require("../../lib/repo");
const backlog = require("../../lib/backlog");
const review = require("../../lib/review");
const fs = require("fs");
const path = require("path");
const { page, inspectorRow } = require("../render");

function gather() {
  return repo.products().map((slug) => ({
    slug,
    seven: repo.fourNumbers(slug, 7),
    twentyEight: repo.fourNumbers(slug, 28),
    streak: repo.streak(slug, 14),
    rows: repo.metrics(slug).filter((r) => r.date >= repo.daysAgo(6))
  }));
}

function backlogAll() {
  const per = repo.products().map((slug) => {
    const entries = [];
    for (const file of ["icp", "proof", "offers", "learnings"]) {
      for (const c of repo.claims(slug, file)) entries.push({ file, ...c });
    }
    const icp = fs.readFileSync(path.join(repo.PRODUCTS, slug, "icp.md"), "utf8");
    return backlog.forProduct(slug, entries, backlog.parsePlans(icp));
  });
  return {
    products: backlog.order(per),
    total: per.reduce((a, p) => a + p.total, 0),
    planned: per.reduce((a, p) => a + p.planned, 0),
    withoutPlan: per.filter((p) => !p.hasPlan).map((p) => p.product)
  };
}

function render(slug) {
  const r = review.build(gather());
  const b = backlogAll();

  const body = [
    '<div style="max-width:62ch">',
    '<span class="label">Week to ' + esc(repo.today()) + '</span>',
    '<h2 style="font-size:26px;font-weight:700;letter-spacing:-0.02em;line-height:1.2;margin:10px 0 0;text-wrap:balance">' + esc(r.headline) + '</h2>',
    '</div>',

    '<div class="' + (r.systemFailing ? "callout" : "") + '" ' + (r.systemFailing ? "" : 'style="border-left:3px solid var(--rule);padding-left:18px"') + '>',
    '<span class="label" style="display:block;margin-bottom:8px">Verdict</span>',
    '<p style="margin:0;font-size:14.5px;line-height:1.6;' + (r.systemFailing ? "" : "color:var(--ink-muted)") + '">' + esc(r.verdict) + '</p>',
    '</div>',

    '<div class="tablewrap"><table class="data"><thead><tr>',
    '<th>Product</th><th class="n">Moves, 7d</th><th class="n">Replies, 7d</th>',
    '<th class="n">Convos, 28d</th><th class="n">Paid, 28d</th><th class="n">Streak</th>',
    '</tr></thead><tbody>',
    r.products.map((p) =>
      '<tr><td>' + esc(p.slug) + '</td>' +
      '<td class="n">' + p.seven.moves + '</td>' +
      '<td class="n">' + p.seven.replies + '</td>' +
      '<td class="n">' + p.twentyEight.qualified_convos + '</td>' +
      '<td class="n">' + p.twentyEight.paid + '</td>' +
      '<td class="n"' + (p.streak && p.streak.failing ? ' style="color:var(--blocked-fg)"' : "") + '>' +
      (p.streak ? p.streak.hit + " / " + p.streak.weekdays : "") + '</td></tr>').join(""),
    '</tbody></table></div>',

    '<div><span class="label" style="display:block;margin-bottom:10px">Best move of the week</span>',
    r.bestMove
      ? '<p class="plain" style="max-width:62ch"><span class="mono">' + esc(r.bestMove.move_id) + '</span> on ' +
        esc(r.bestMove.channel) + ' for ' + esc(r.bestMove.product) + '. ' + r.bestMove.qualified_convos +
        ' qualified conversations, ' + r.bestMove.signups + ' signups, ' + r.bestMove.replies + ' replies.</p>'
      : '<p class="plain" style="max-width:62ch">Nothing produced a reply, a conversation or a signup this week. That is the finding, and it is not softened by picking a move that merely got seen.</p>',
    '</div>',

    '<div><span class="label" style="display:block;margin-bottom:10px">Channel to burn</span>',
    r.worstChannel
      ? '<p class="plain" style="max-width:62ch"><span class="mono">' + esc(r.worstChannel.channel) + '</span> on ' +
        esc(r.worstChannel.product) + '. ' + r.worstChannel.moves + ' moves spent, ' + r.worstChannel.replies +
        ' replies, no conversations. Change the approach or mark it burned in channels.yml.</p>'
      : '<p class="plain" style="max-width:62ch">No channel has three spent moves and nothing to show yet. Ask again once there is more history.</p>',
    '</div>',

    '<div class="hairline"></div>',

    '<div><div class="sechead" style="margin-bottom:10px">',
    '<span class="label">The assumption backlog</span>',
    '<span class="mono" style="font-size:12px;color:var(--ink-faint);margin-left:auto">' + b.total + ' assumed, ' + b.planned + ' planned</span>',
    '</div>',
    b.withoutPlan.length
      ? '<div class="callout" style="margin-bottom:18px"><span class="label">No written test plan</span>' +
        '<p>' + esc(b.withoutPlan.join(" and ")) + ' ' + (b.withoutPlan.length === 1 ? "has" : "have") +
        ' assumptions on file and no written plan for checking any of them. An assumption nobody has said how to test sits there being quietly believed.</p></div>'
      : "",
    b.products.map((p) => [
      '<div style="margin-bottom:26px">',
      '<div class="sechead" style="margin-bottom:8px">',
      '<span class="mono" style="font-size:13px;font-weight:600">' + esc(p.product) + '</span>',
      '<span class="mono" style="font-size:12px;color:var(--ink-faint);margin-left:auto">' + p.total + ' assumed, ' + p.planned + ' planned</span>',
      '</div>',
      p.plans.map((plan) =>
        '<div class="claim"><span class="tag verified">planned</span><span class="txt">' + esc(plan.assumption) +
        (plan.test ? '<span style="display:block;color:var(--ink-faint);margin-top:3px">Test ' + esc(plan.test) + '</span>' : "") +
        '</span></div>').join(""),
      p.assumed.slice(0, 6).map((a) =>
        '<div class="claim"><span class="tag assumed">assumed</span><span class="txt">' + esc(a.claim) +
        '<span class="mono" style="color:var(--ink-faint);font-size:11px;margin-left:8px">' + esc(a.file) + '.md</span></span></div>').join(""),
      p.assumed.length > 6 ? '<p class="plain" style="margin-top:8px">' + (p.assumed.length - 6) + ' more in ' + esc(p.product) + ' icp.md.</p>' : "",
      '</div>'
    ].join("")).join(""),
    '<p class="plain" style="max-width:62ch;color:var(--ink-faint)">Plans and assumptions are listed separately rather than matched to each other. A written test restates an assumption in different words, so any automatic linkage would look precise and be wrong.</p>',
    '</div>'
  ].join("\n");

  const inspector = [
    inspectorRow("The rule", "lead with the worst number. no burying"),
    inspectorRow("Habit beats numbers", "a broken streak outranks a bad conversion rate, because the habit produces the numbers"),
    inspectorRow("Best move", "ranked by conversations, then signups, then replies. reach is only a tiebreaker"),
    inspectorRow("Worst channel", "three or more moves spent and no conversations back"),
    inspectorRow("Not shown", "page views, impressions, reach")
  ].join("");

  return page({ slug, page: "review", title: "Weekly review", when: "last 7 days", body, inspector });
}
module.exports = { render };
