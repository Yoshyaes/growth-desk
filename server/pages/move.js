"use strict";
const { esc } = require("../../lib/html");
const repo = require("../../lib/repo");
const voice = require("../../lib/voice");
const { page, inspectorRow } = require("../render");

function render(slug, moveId) {
  const q = repo.queue(slug);
  const m = q.moves.find((x) => x.id === moveId);
  if (!m) return null;

  const banned = repo.bannedWords();
  const lint = voice.lint(m.draft, banned);
  const target = m.target || {};

  const lintRows = lint.summary.map((s) => {
    const hit = s.count > 0;
    const example = hit ? (lint.hits.find((h) => h.rule === s.rule) || {}).context || "" : "";
    return `<div class="lintrow ${hit ? "hit" : ""}">
      <span class="dot"></span>
      <span>${esc(s.label)}</span>
      <span class="count">${s.count}${s.total ? " of " + s.total : ""}</span>
      <span class="ctx">${esc(example)}</span>
    </div>`;
  }).join("");

  const proof = (m.proof_refs || []).map((p) => `
    <span class="claim" style="border:none;padding:0">
      <span class="tag ${p.cited ? "verified" : "assumed"}">${p.cited ? "cited" : "no source"}</span>
      <span class="txt">${esc(p.claim)}</span>
    </span>`).join("");

  const body = `
    <div class="sechead"><span class="label">Answering</span></div>
    <div style="border-left:3px solid var(--rule);padding-left:16px">
      <p class="plain" style="margin:0">${target.url
        ? `<a href="${esc(target.url)}" target="_blank" rel="noreferrer">${esc(target.title)}</a>`
        : esc(target.title || "")}</p>
    </div>

    <div>
      <div class="sechead" style="margin-bottom:10px">
        <span class="label">Draft</span>
        <span class="badge ${esc(m.gate)}"><i></i>${esc(m.gate)}</span>
        <span class="mono" style="font-size:12px;color:var(--ink-faint);margin-left:auto" id="chars">${m.draft.length} characters</span>
      </div>
      <textarea class="editor" id="draft" data-move="${esc(m.id)}" data-product="${esc(slug)}">${esc(m.draft)}</textarea>
    </div>

    <div>
      <div class="sechead" style="margin-bottom:6px"><span class="label">Voice lint</span></div>
      <div class="lint" id="lint">${lintRows}</div>
    </div>

    ${proof ? `<div>
      <div class="sechead" style="margin-bottom:10px"><span class="label">Proof</span></div>
      <div style="display:flex;flex-direction:column;gap:10px">${proof}</div>
    </div>` : ""}

    <div style="display:flex;gap:8px;align-items:center">
      <a class="btn" href="/${esc(slug)}/today">Back</a>
      <button class="btn" type="button" data-skip="${esc(m.id)}">Skip today</button>
      <button class="btn primary" type="button" data-copy-editor="${esc(m.id)}">Copy draft</button>
      <span class="plain" style="margin-left:auto">There is no Post button. Copying is the send step.</span>
    </div>`;

  const g = m.gateDecision || {};
  let inspector = inspectorRow("Channel", m.channel, true)
    + inspectorRow("Gate", (g.state || m.gate) + ", " + (g.reason || ""))
    + (g.promoPolicy ? inspectorRow("Promo policy", g.promoPolicy) : "")
    + (g.rulesUrl ? `<div class="irow"><div class="k">Rules</div><div class="v"><a href="${esc(g.rulesUrl)}" target="_blank" rel="noreferrer">${esc(g.rulesUrl)}</a></div></div>` : "")
    + (g.cadenceCap != null ? inspectorRow("Cadence cap", g.cadenceCap + " per week", true) : "")
    + inspectorRow("Promotional copy", g.promotionalAllowed ? "allowed" : "not permitted here")
    + inspectorRow("Never auto-post", "Drafts only. Copy and paste by hand.");

  return page({ slug, page: "today", title: m.id, when: m.type, body, inspector });
}

module.exports = { render };
