"use strict";
const { esc } = require("../../lib/html");
const repo = require("../../lib/repo");
const { page, inspectorRow } = require("../render");

function segs(used, cap) {
  const n = Math.max(0, Number(cap) || 0);
  if (!n) return "";
  let out = "";
  for (let i = 0; i < Math.min(n, 10); i++) out += `<i class="${i < used ? "used" : ""}"></i>`;
  return `<span class="seg">${out}</span>`;
}

function render(slug) {
  const chans = repo.channels(slug);
  const since = repo.daysAgo(6);
  const recent = repo.metrics(slug).filter((r) => r.date >= since);

  const rows = chans.map((c) => {
    const used = recent.filter((r) => r.channel === c.id).length;
    const blocked = c.gate === "blocked";
    return `<div class="chrow is-${esc(c.gate)}">
      <span class="id">${esc(c.id)}</span>
      <span class="kind">${esc(c.kind || "")}</span>
      <span class="badge ${esc(c.gate)}"><i></i>${esc(c.gate)}</span>
      <span class="status">${esc(String(c.status || "").replace("_", " "))}</span>
      <span class="cap">
        ${segs(used, c.cadence_cap_per_week)}
        <span class="mono" style="font-size:12px;color:var(--ink-faint)">${used} / ${esc(c.cadence_cap_per_week ?? 0)}</span>
        <span class="mono" style="font-size:12px;color:var(--ink-faint);min-width:44px;text-align:right">${esc(c.karma_required ?? 0)} k</span>
      </span>
    </div>${blocked ? `<div class="chnote">${esc(c.gateReason)}. Research only.</div>` : ""}`;
  }).join("");

  const body = `
    <div>${rows}</div>
    <p class="plain">Nothing is promoted to active until it has been opened and read by a human. Subscriber counts are blank because none have been verified, and an unverified number is not cited.</p>`;

  const inspector = [
    `<div class="irow"><div class="k">Gate legend</div></div>`,
    inspectorRow("open", "promotional drafting allowed, subject to the ratio and the cap"),
    inspectorRow("restricted", "helpful replies only, no link, no product name"),
    inspectorRow("blocked", "no copy generated, ever. research only"),
    inspectorRow("Fail closed", "a channel that is not in channels.yml is blocked, not open")
  ].join("");

  return page({ slug, page: "channels", title: "Channels", when: slug, body, inspector });
}
module.exports = { render };
