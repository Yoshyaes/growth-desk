"use strict";
const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const attr = esc;
const raw = (s) => ({ __raw: String(s) });
function h(strings, ...vals) {
  let out = strings[0];
  vals.forEach((v, i) => {
    if (v && v.__raw !== undefined) out += v.__raw;
    else if (Array.isArray(v)) out += v.map((x) => (x && x.__raw !== undefined ? x.__raw : esc(x))).join("");
    else out += esc(v);
    out += strings[i + 1];
  });
  return raw(out);
}
module.exports = { esc, attr, raw, h };
