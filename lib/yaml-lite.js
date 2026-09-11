"use strict";
/**
 * yaml-lite. A deliberately small YAML reader for the shapes this repo uses.
 *
 * Supports what channels.yml and markdown frontmatter actually contain.
 *   key: scalar
 *   key: [inline, list]
 *   key:
 *     - scalar
 *     - key: value
 *       key: value
 *   nested maps by indentation, comments, quoted strings, null, booleans, ints
 *
 * It does not support anchors, multi-line scalars, or flow maps. If a file
 * needs those, the file is wrong for this repo, not the parser.
 */

function stripComment(line) {
  let out = "";
  let q = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { out += c; if (c === q && line[i - 1] !== "\\") q = null; continue; }
    if (c === '"' || c === "'") { q = c; out += c; continue; }
    if (c === "#" && (i === 0 || /\s/.test(line[i - 1]))) break;
    out += c;
  }
  return out;
}

function scalar(raw) {
  const v = String(raw).trim();
  if (v === "" ) return null;
  if (v === "null" || v === "~") return null;
  if (v === "true") return true;
  if (v === "false") return false;
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  if (v.startsWith("[") && v.endsWith("]")) {
    const inner = v.slice(1, -1).trim();
    if (!inner) return [];
    return splitTop(inner).map((s) => scalar(s));
  }
  if (/^-?\d+$/.test(v)) return parseInt(v, 10);
  if (/^-?\d*\.\d+$/.test(v)) return parseFloat(v);
  return v;
}

function splitTop(s) {
  const out = [];
  let cur = "";
  let q = null;
  let depth = 0;
  for (const c of s) {
    if (q) { cur += c; if (c === q) q = null; continue; }
    if (c === '"' || c === "'") { q = c; cur += c; continue; }
    if (c === "[") depth++;
    if (c === "]") depth--;
    if (c === "," && depth === 0) { out.push(cur); cur = ""; continue; }
    cur += c;
  }
  if (cur.trim()) out.push(cur);
  return out.map((x) => x.trim());
}

function tokenize(text) {
  return String(text)
    .split("\n")
    .map((raw, n) => {
      const noComment = stripComment(raw);
      if (!noComment.trim()) return null;
      const indent = noComment.length - noComment.replace(/^\s*/, "").length;
      return { indent, text: noComment.trim(), line: n + 1 };
    })
    .filter(Boolean);
}

function parseBlock(rows, start, indent) {
  // decide list or map by the first row at this indent
  if (rows[start] && rows[start].text.startsWith("- ")) {
    return parseList(rows, start, indent);
  }
  return parseMap(rows, start, indent);
}

function parseMap(rows, start, indent) {
  const obj = {};
  let i = start;
  while (i < rows.length && rows[i].indent >= indent) {
    if (rows[i].indent > indent) { i++; continue; }
    const row = rows[i];
    const m = row.text.match(/^([^:]+):\s*(.*)$/);
    if (!m) { i++; continue; }
    const key = m[1].trim();
    const rest = m[2].trim();
    if (rest !== "") {
      obj[key] = scalar(rest);
      i++;
      continue;
    }
    // value is a nested block
    const next = rows[i + 1];
    if (!next || next.indent <= indent) { obj[key] = null; i++; continue; }
    const [value, consumed] = parseBlock(rows, i + 1, next.indent);
    obj[key] = value;
    i = consumed;
  }
  return [obj, i];
}

function parseList(rows, start, indent) {
  const arr = [];
  let i = start;
  while (i < rows.length && rows[i].indent === indent && rows[i].text.startsWith("- ")) {
    const body = rows[i].text.slice(2).trim();
    const isMapItem = /^[^:]+:/.test(body);
    if (!isMapItem) {
      arr.push(scalar(body));
      i++;
      continue;
    }
    // the item is a map. its first key sits on this line, the rest are indented deeper
    const itemRows = [{ indent: 0, text: body, line: rows[i].line }];
    let j = i + 1;
    while (j < rows.length && rows[j].indent > indent) {
      itemRows.push({ indent: rows[j].indent - (indent + 2), text: rows[j].text, line: rows[j].line });
      j++;
    }
    const [obj] = parseBlock(itemRows, 0, 0);
    arr.push(obj);
    i = j;
  }
  return [arr, i];
}

function parse(text) {
  const rows = tokenize(text);
  if (!rows.length) return {};
  const [value] = parseBlock(rows, 0, rows[0].indent);
  return value;
}

/** Split markdown frontmatter from body. */
function frontmatter(text) {
  const s = String(text);
  if (!s.startsWith("---")) return { data: {}, body: s };
  const end = s.indexOf("\n---", 3);
  if (end === -1) return { data: {}, body: s };
  const head = s.slice(s.indexOf("\n") + 1, end);
  const body = s.slice(s.indexOf("\n", end + 1) + 1);
  return { data: parse(head), body };
}

module.exports = { parse, frontmatter };
