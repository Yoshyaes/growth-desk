"use strict";
const { h, raw, esc } = require("../lib/html");
const repo = require("../lib/repo");

const NAV = [
  ["today", "Today"], ["metrics", "Metrics"], ["channels", "Channels"],
  ["product", "Product"], ["audit", "Audit"]
];

function streakStrip(slug) {
  const s = repo.streak(slug, 14);
  const cells = s.cells.map((c) =>
    c.weekday
      ? `<div class="cell ${c.sent ? "sent" : ""}" title="${esc(c.date)}"></div>`
      : `<div class="cell weekend" title="${esc(c.date)}"><i></i></div>`
  ).join("");
  return { html: raw(cells), hit: s.hit, weekdays: s.weekdays, failing: s.failing };
}

function rail(slug, page) {
  const strip = streakStrip(slug);
  const prods = repo.products().map((p) => {
    const q = repo.queue(p);
    const waiting = q.moves.filter((m) => (m.state || "queued") === "queued").length;
    return `<a class="prod ${p === slug ? "on" : ""}" href="/${esc(p)}/${esc(page)}">
      <span>${esc(p)}</span>
      <span class="ab">${esc(repo.slugAbbrev(p))}</span>
      <span class="n">${waiting}</span>
    </a>`;
  }).join("");

  return h`<div class="rail">
    <div class="wordmark">growth desk</div>
    <div>${raw(prods)}</div>
    <div class="railrule"></div>
    <nav class="nav">${raw(NAV.map(([k, t]) =>
      `<a class="${k === page ? "on" : ""}" href="/${esc(slug)}/${k}">${t}</a>`).join(""))}</nav>
    <div class="railfoot">
      <div class="railrule" style="margin:0 0 16px"></div>
      <div class="label">Weekdays sent</div>
      <div class="streakstrip">${strip.html}</div>
      <div class="mono" style="font-size:13px">${strip.hit} / ${strip.weekdays}</div>
      ${raw(strip.failing ? `<div class="chnote" style="margin-top:10px">Under half. See the kill criterion.</div>` : "")}
    </div>
  </div>`;
}

function inspectorRow(k, v, mono) {
  return `<div class="irow"><div class="k">${esc(k)}</div><div class="v ${mono ? "mono" : ""}">${esc(v)}</div></div>`;
}

function globalRules() {
  return [
    inspectorRow("Never auto-post", "Drafts only. Copy and paste by hand."),
    inspectorRow("Voice", "No em dashes, no colons, no semicolons"),
    inspectorRow("Ratio", "90 / 10 value to promotion"),
    inspectorRow("Not tracked", "Page views, impressions, reach")
  ].join("");
}

function page({ slug, page: pg, title, when, actions, body, inspector }) {
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} . ${esc(slug)} . growth desk</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap">
<link rel="stylesheet" href="/app.css">
<script>try{var t=localStorage.getItem('gd-theme');if(t)document.documentElement.dataset.theme=t;else if(matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.dataset.theme='dark';}catch(e){}</script>
</head>
<body>
<div class="app">
  ${rail(slug, pg).__raw}
  <div class="main">
    <div class="topbar">
      <h1>${esc(title)}</h1>
      <div class="when mono">${esc(when || "")}</div>
      <div class="right">
        ${actions || ""}
        <button class="btn" id="theme" type="button">Theme</button>
      </div>
    </div>
    <div class="scroll"><div class="content">${body}</div></div>
  </div>
  <div class="inspector">
    <span class="label">Rules in force</span>
    ${inspector || globalRules()}
  </div>
</div>
<script src="/app.js"></script>
</body>
</html>`;
}

module.exports = { page, inspectorRow, globalRules, NAV };
