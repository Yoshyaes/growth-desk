"use strict";
const { esc } = require("../../lib/html");
const { page, inspectorRow } = require("../render");

function render(slug) {
  const body = `<div class="empty">
    <h2>Audit is Phase E.</h2>
    <p>The rubric, the prioritized diff and the pull request flow are specified in docs/DEVELOPMENT-PLAN.md and drawn in design/mockups/Growth Desk Landing Audit.dc.html. Phases A to D ship first.</p>
    <a class="btn" href="/${esc(slug)}/today">Back to today</a>
  </div>
  <p class="plain">When it lands, the audit scores seven rubric questions, returns a prioritized diff, and opens a pull request against the product's own repo. It will never merge, for the same reason this app never posts.</p>`;
  return page({
    slug, page: "audit", title: "Audit", when: "not built yet", body,
    inspector: inspectorRow("Phase", "E") + inspectorRow("Blocked on", "phases A to D")
  });
}
module.exports = { render };
