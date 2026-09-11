"use strict";
const { esc } = require("../../lib/html");
const repo = require("../../lib/repo");
const { page, inspectorRow } = require("../render");

const TARGETS = { replies: 60, qualified_convos: 12, signups: 15, paid: 2 };
const TILES = [
  ["replies", "Replies"], ["qualified_convos", "Qualified conversations"],
  ["signups", "Attributed signups"], ["paid", "Paid"]
];

function render(slug) {
  const all = repo.products();
  const totals = { replies: 0, qualified_convos: 0, signups: 0, paid: 0, moves: 0 };
  const rows = all.map((p) => {
    const n = repo.fourNumbers(p, 28);
    Object.keys(totals).forEach((k) => { totals[k] += n[k]; });
    return { p, n };
  });

  const tiles = TILES.map(([k, label]) => `
    <div class="tile">
      <span class="label">${esc(label)}</span>
      <div class="big">${totals[k]}</div>
      <div class="target">target ${TARGETS[k]}</div>
    </div>`).join("");

  const table = `<table class="data">
    <thead><tr>
      <th>Product</th><th class="n">Replies</th><th class="n">Convos</th>
      <th class="n">Signups</th><th class="n">Paid</th><th class="n">Moves sent</th>
    </tr></thead>
    <tbody>${rows.map(({ p, n }) => `<tr>
      <td>${esc(p)}</td><td class="n">${n.replies}</td><td class="n">${n.qualified_convos}</td>
      <td class="n">${n.signups}</td><td class="n">${n.paid}</td><td class="n">${n.moves}</td>
    </tr>`).join("")}</tbody>
  </table>`;

  const body = `
    <div class="tiles">${tiles}</div>
    ${table}
    <p class="plain">Page views are not tracked here on purpose. They do not predict revenue at this stage.</p>
    <div class="hairline"></div>
    <div>
      <div class="sechead" style="margin-bottom:14px"><span class="label">Streak, last 14 days</span></div>
      ${all.map((p) => {
        const s = repo.streak(p, 14);
        return `<div style="display:flex;align-items:center;gap:14px;padding:10px 0;border-bottom:1px solid var(--rule)">
          <span class="mono" style="min-width:96px;font-size:13px">${esc(p)}</span>
          <span class="streakstrip" style="margin:0">${s.cells.map((c) => c.weekday
            ? `<span class="cell ${c.sent ? "sent" : ""}" title="${esc(c.date)}"></span>`
            : `<span class="cell weekend"><i></i></span>`).join("")}</span>
          <span class="mono" style="margin-left:auto;font-size:13px">${s.hit} / ${s.weekdays}</span>
        </div>${s.failing ? `<div class="callout" style="margin:14px 0">
          <span class="label">Kill criterion</span>
          <p>${esc(p)} is at ${s.hit} of ${s.weekdays} weekdays. Under 5 of 10 at day 30 means the habit did not take. Stop building features and make the call. This was written down in advance so it could not be quietly ignored.</p>
        </div>` : ""}`;
      }).join("")}
    </div>`;

  const inspector = [
    `<div class="irow"><div class="k">What each number counts</div></div>`,
    inspectorRow("Reply", "a human wrote back in the thread"),
    inspectorRow("Qualified conversation", "they stated the problem unprompted"),
    inspectorRow("Attributed signup", "source captured at signup and matched to a move id"),
    inspectorRow("Paid", "billing event, attributed by source"),
    inspectorRow("Not shown", "a number with no definition is not shown")
  ].join("");

  return page({ slug, page: "metrics", title: "Metrics", when: "all products, last 28 days", body, inspector });
}
module.exports = { render };
