"use strict";
/**
 * Growth Desk local server.
 *
 * Binds to 127.0.0.1 only. There is no auth because there is no remote
 * surface. There is no database because the files under products/ are the
 * database. There is no build step.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const repo = require("../lib/repo");
const voice = require("../lib/voice");

const pages = {
  today: require("./pages/today"),
  move: require("./pages/move"),
  metrics: require("./pages/metrics"),
  channels: require("./pages/channels"),
  product: require("./pages/product"),
  audit: require("./pages/audit")
};

const PUBLIC = path.join(repo.ROOT, "public");
const PORT = Number(process.env.PORT || 4780);
const MIME = { ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8" };

function send(res, code, type, body) {
  res.writeHead(code, { "content-type": type, "cache-control": "no-store" });
  res.end(body);
}
const html = (res, code, body) => send(res, code, "text/html; charset=utf-8", body);
const json = (res, code, obj) => send(res, code, "application/json; charset=utf-8", JSON.stringify(obj));

function notFound(res, what) {
  html(res, 404, `<!doctype html><meta charset="utf-8">
  <style>body{font-family:system-ui;padding:60px;max-width:52ch;line-height:1.6}</style>
  <h1>Not here</h1><p>${what || "No such page."}</p><p><a href="/">Back to the desk</a></p>`);
}

function readBody(req) {
  return new Promise((resolve) => {
    let b = "";
    req.on("data", (c) => { b += c; if (b.length > 1e6) req.destroy(); });
    req.on("end", () => { try { resolve(JSON.parse(b || "{}")); } catch { resolve({}); } });
  });
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const parts = parsed.pathname.split("/").filter(Boolean);

  // static
  if (parts.length === 1 && /\.(css|js)$/.test(parts[0])) {
    const f = path.join(PUBLIC, path.basename(parts[0]));
    if (fs.existsSync(f)) return send(res, 200, MIME[path.extname(f)] || "text/plain", fs.readFileSync(f));
    return notFound(res);
  }

  const known = repo.products();
  if (!parts.length) {
    res.writeHead(302, { location: "/" + (known[0] || "deckle") + "/today" });
    return res.end();
  }

  // POST api
  if (req.method === "POST" && parts[0] === "api") {
    const body = await readBody(req);
    if (parts[1] === "move" && parts[2] && parts[3]) {
      const [, , slug, id] = parts;
      if (!known.includes(slug)) return json(res, 404, { ok: false, error: "unknown product" });
      const out = repo.updateMove(slug, id, body);
      return json(res, out.ok ? 200 : 400, out);
    }
    if (parts[1] === "lint") {
      return json(res, 200, voice.lint(body.text || "", repo.bannedWords()));
    }
    return json(res, 404, { ok: false, error: "no such endpoint" });
  }

  const slug = parts[0];
  if (!known.includes(slug)) return notFound(res, "No product called " + slug + ".");
  const view = parts[1] || "today";

  try {
    if (view === "today") return html(res, 200, pages.today.render(slug));
    if (view === "metrics") return html(res, 200, pages.metrics.render(slug));
    if (view === "channels") return html(res, 200, pages.channels.render(slug));
    if (view === "product") return html(res, 200, pages.product.render(slug, parts[2]));
    if (view === "audit") return html(res, 200, pages.audit.render(slug));
    if (view === "move" && parts[2]) {
      const out = pages.move.render(slug, parts[2]);
      if (!out) return notFound(res, "That move is not in today's queue, or the gate removed it.");
      return html(res, 200, out);
    }
  } catch (err) {
    return html(res, 500, `<!doctype html><meta charset="utf-8">
      <style>body{font-family:ui-monospace,Menlo,monospace;padding:40px;white-space:pre-wrap}</style>
      <h1>Server error</h1>${String(err && err.stack || err)}`);
  }
  return notFound(res);
});

if (require.main === module) {
  server.listen(PORT, "127.0.0.1", () => {
    process.stdout.write("\n  growth desk  http://127.0.0.1:" + PORT + "\n");
    process.stdout.write("  products     " + repo.products().join(", ") + "\n");
    process.stdout.write("  reminder     this app drafts. it never sends.\n\n");
  });
}

module.exports = { server };
