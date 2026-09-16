"use strict";
const { esc } = require("../../lib/html");
const repo = require("../../lib/repo");
const { page, inspectorRow } = require("../render");

const METRIC_WORD = {
  replies: "replies", qualified_convos: "qualified conversations",
  signups: "signups", paid: "paid conversions"
};

const TYPE_LABEL = {
  helpful_reply: "helpful reply", soft_reply: "soft reply", original_post: "post",
  build_in_public: "build in public", direct_message: "direct message",
  asset: "asset", partnership: "partnership"
};

/**
 * The card shows a preview, not the draft.
 *
 * Blank lines are collapsed so line-clamp counts real lines of text. Keeping
 * the paragraph breaks here made the clamp land on an empty line and bleed a
 * half-rendered line underneath it. The true text, breaks and all, is what
 * gets copied and what the editor shows.
 */
function preview(draft) {
  return String(draft || "").replace(/\s*\n\s*/g, " ").replace(/\s{2,}/g, " ").trim();
}

function moveCard(slug, m, rank) {
  const state = m.state || "queued";
  const target = m.target || {};
  const title = target.url
    ? `<a href="${esc(target.url)}" target="_blank" rel="noreferrer">${esc(target.title)}</a>`
    : esc(target.title || "");
  const exp = m.expected || {};
  const copied = state === "copied";
  return `<article class="move is-${esc(state)}" data-move="${esc(m.id)}">
    <div class="head">
      <span class="id">${esc(m.id)}</span>
      <span class="type">${esc(TYPE_LABEL[m.type] || m.type)}</span>
      <span class="arrow">-&gt;</span>
      <span class="chan">${esc(m.channel)}</span>
      <span class="badge ${esc(m.gate)}"><i></i>${esc(m.gate)}</span>
      <span class="rank">#${rank}</span>
    </div>
    <div class="target">${title}</div>
    <div class="draft"><span>${esc(preview(m.draft))}</span></div>
    <template data-draft>${esc(m.draft)}</template>
    <div class="foot">
      <span class="why">Expected ${esc(exp.value)} ${esc(METRIC_WORD[exp.metric] || exp.metric || "")}</span>
      <span class="acts">
        <a class="btn" href="/${esc(slug)}/move/${esc(m.id)}">Open</a>
        <button class="btn" type="button" data-skip="${esc(m.id)}">Skip</button>
        <button class="btn primary ${copied ? "copied" : ""}" type="button" data-copy="${esc(m.id)}">${copied ? "Copied" : "Copy draft"}</button>
      </span>
    </div>
  </article>`;
}

function render(slug) {
  const q = repo.queue(slug);
  const eth = repo.ethics(slug);
  const excl = [...(q.excluded || []), ...(q.dropped || []).map((d) => ({ channel: d.channel, reason: d.reason }))];
  const seen = new Set();
  const exclUnique = excl.filter((e) => (seen.has(e.channel) ? false : seen.add(e.channel)));

  const sent = q.moves.filter((m) => m.state === "copied").length;

  let body = "";

  if (exclUnique.length) {
    // the statement is always made. on a phone the examples collapse after two,
    // because this is the first thing seen every single morning and the whole
    // list costs half the screen on echoself.
    const extra = Math.max(0, exclUnique.length - 2);
    body += `<div class="gatenotice" data-gate>
      <span class="label">Ethics gate</span>
      <p>${exclUnique.length} channel${exclUnique.length === 1 ? "" : "s"} excluded from today's run.</p>
      ${exclUnique.map((e, i) =>
        `<p class="${i >= 2 ? "gate-extra" : ""}"><code>${esc(e.channel)}</code> . ${esc(e.reason)}</p>`).join("")}
      ${extra ? `<button class="gate-more" type="button" data-gate-more>and ${extra} more</button>` : ""}
    </div>`;
  }

  if (!q.exists) {
    body += `<div class="empty">
      <h2>Nothing queued for ${esc(slug)} yet.</h2>
      <p>Run daily-moves to draft today's five. Nothing here posts by itself.</p>
      <button class="btn primary" type="button" disabled title="Phase F">Run daily-moves</button>
    </div>`;
  } else if (!q.moves.length) {
    body += `<div class="empty">
      <h2>No moves survived the gate today.</h2>
      <p>Everything generated was for a channel the gate blocks. Nothing was padded to make up the number.</p>
    </div>`;
  } else {
    body += q.moves.map((m, i) => moveCard(slug, m, i + 1)).join("");
    if (q.short) {
      body += `<p class="plain">${esc(q.short.returned)} moves today, not ${esc(q.short.asked)}. ${esc(q.short.reason)}. Nothing was padded.</p>`;
    }
  }

  const first = q.moves[0];
  let inspector = "";
  if (first && first.gateDecision) {
    const g = first.gateDecision;
    inspector += inspectorRow("Channel", first.channel, true);
    inspector += inspectorRow("Gate", g.state + ", " + g.reason);
    if (g.cadenceCap != null) inspector += inspectorRow("Cadence cap", g.cadenceCap + " per week", true);
    if (g.karmaRequired != null) inspector += inspectorRow("Karma required", String(g.karmaRequired), true);
    if (g.status) inspector += inspectorRow("Status", g.status);
  }
  if (eth.standing.length) {
    inspector += `<div class="irow"><div class="k">Standing rules</div>${eth.standing
      .map((s) => `<div class="v" style="margin-top:6px">${esc(s)}</div>`).join("")}</div>`;
  }
  inspector += inspectorRow("Never auto-post", "Drafts only. Copy and paste by hand.");

  return page({
    slug, page: "today", title: "Today", when: repo.today(),
    actions: `<span class="mono" style="font-size:12px;color:var(--ink-faint)">${q.moves.length} drafted, ${sent} copied</span>`,
    body, inspector
  });
}

module.exports = { render };
