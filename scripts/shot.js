#!/usr/bin/env node
"use strict";
/**
 * Phone screenshots via DevTools Protocol.
 *
 * Chrome headless clamps its viewport to 500px wide here, so --window-size
 * produces a 390px image of a 500px layout, which looks like an overflow bug
 * and is not one. Emulation.setDeviceMetricsOverride sets the real viewport.
 *
 *   node shot.js <url> <out.png> [width] [height] [scale]
 */

const fs = require("fs");
const { spawn } = require("child_process");

const [url, out, w = "390", h = "844", scale = "2"] = process.argv.slice(2);
const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT = 9333 + Math.floor(Math.random() * 400);

const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
  "--remote-debugging-port=" + PORT, "about:blank"
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function targets() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json`);
      const list = await res.json();
      const page = list.find((t) => t.type === "page");
      if (page) return page;
    } catch {}
    await sleep(200);
  }
  throw new Error("chrome did not come up");
}

(async () => {
  const page = await targets();
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();

  const send = (method, params) => new Promise((resolve) => {
    const msg = { id: ++id, method, params: params || {} };
    pending.set(msg.id, resolve);
    ws.send(JSON.stringify(msg));
  });

  await new Promise((r) => ws.addEventListener("open", r));
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  });

  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: Number(w), height: Number(h),
    deviceScaleFactor: Number(scale), mobile: true
  });
  await send("Page.navigate", { url });
  await sleep(1400);

  const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  fs.writeFileSync(out, Buffer.from(shot.data, "base64"));

  const check = await send("Runtime.evaluate", {
    expression: "document.documentElement.clientWidth + ' x ' + document.documentElement.scrollWidth",
    returnByValue: true
  });
  console.log("  viewport x scrollWidth =", check.result.value, "->", out);

  ws.close();
  chrome.kill();
  process.exit(0);
})().catch((e) => { console.error(e.message); chrome.kill(); process.exit(1); });
