"use strict";
const { esc } = require("../../lib/html");
const repo = require("../../lib/repo");
const { page, inspectorRow } = require("../render");

const FILES = ["icp", "voice", "offers", "proof", "ethics", "learnings"];

function render(slug, file) {
  const name = FILES.includes(file) ? file : "proof";
  const claims = repo.claims(slug, name);
  const d = repo.doc(slug, name);

  const tabs = FILES.map((f) =>
    `<a class="btn ${f === name ? "primary" : ""}" href="/${esc(slug)}/product/${f}">${f}</a>`).join("");

  const counts = claims.reduce((a, c) => { a[c.tag] = (a[c.tag] || 0) + 1; return a; }, {});

  const claimRows = claims.length
    ? claims.map((c) => `<div class="claim">
        <span class="tag ${esc(c.tag)}">${esc(c.tag)}</span>
        <span class="txt">${esc(c.text)}</span>
      </div>`).join("")
    : `<p class="plain">No tagged claims in this file.</p>`;

  // surface the gap blocks verbatim
  const gapMatch = d.body.match(/(^|\n)(##+ ?(Proof gaps?[^\n]*|Do not cite|Blocking note|Note on offer[^\n]*))\n([\s\S]*?)(?=\n## |\n#|$)/gi) || [];
  const gaps = gapMatch.map((block) => {
    const [, heading] = block.match(/##+ ?([^\n]+)/) || [];
    const text = block.replace(/##+ ?[^\n]+\n/, "").trim();
    return `<div class="callout">
      <span class="label">${esc(heading)}</span>
      <p>${esc(text.replace(/\s+/g, " ").slice(0, 700))}</p>
    </div>`;
  }).join("");

  const body = `
    <div style="display:flex;gap:8px;flex-wrap:wrap">${tabs}</div>
    <div class="sechead">
      <span class="label">${esc(name)}.md</span>
      <span class="mono" style="font-size:12px;color:var(--ink-faint)">
        ${(counts.verified || 0)} verified, ${(counts.assumed || 0)} assumed
      </span>
    </div>
    <div>${claimRows}</div>
    ${gaps}`;

  const inspector = [
    inspectorRow("Source", "products/" + slug + "/" + name + ".md", true),
    inspectorRow("verified", "evidenced, citable in a draft"),
    inspectorRow("assumed", "a hypothesis. belongs in the test backlog"),
    inspectorRow("The verbatim rule", "if it cannot be quoted, it is not proof"),
    inspectorRow("Drafts may cite", "proof.md only")
  ].join("");

  return page({ slug, page: "product", title: "Product", when: slug + " / " + name, body, inspector });
}
module.exports = { render, FILES };
