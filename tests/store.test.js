"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const paths = require("../lib/store/paths");
const { createGithubStore, b64encode } = require("../lib/store/github");
const { createFsStore } = require("../lib/store/fs");
const { createStore, routed } = require("../lib/store");

/* ---------- the write allowlist is a security boundary ---------- */

test("WRITE BOUNDARY. queue, metrics and logs are writable", () => {
  assert.ok(paths.isWritable("products/deckle/queue/2026-09-12.json"));
  assert.ok(paths.isWritable("products/echoself/metrics.csv"));
  assert.ok(paths.isWritable("products/marskel/logs/2026-09-12.md"));
});

test("WRITE BOUNDARY. the ethics gate and every config file are NOT writable", () => {
  const forbidden = [
    "products/echoself/ethics.md",
    "products/echoself/channels.yml",
    "products/marskel/icp.md",
    "products/deckle/proof.md",
    "products/deckle/voice.md",
    "shared/voice-rules.md",
    "CLAUDE.md",
    "lib/gate.js",
    "docs/PRD.md"
  ];
  for (const p of forbidden) {
    assert.equal(paths.isWritable(p), false, p + " must not be writable at runtime");
    assert.throws(() => paths.assertWritable(p), /not a writable path/, p);
  }
});

test("WRITE BOUNDARY. traversal and absolute paths are refused", () => {
  for (const p of [
    "../../etc/passwd",
    "products/deckle/../../../etc/passwd",
    "/etc/passwd",
    "products/deckle/queue/../../ethics.md",
    "products/deckle/queue/2026-09-12.json/../../../ethics.md"
  ]) {
    assert.equal(paths.isWritable(p), false, p);
  }
});

test("WRITE BOUNDARY. a queue path must be a real date, not an arbitrary name", () => {
  assert.equal(paths.isWritable("products/deckle/queue/anything.json"), false);
  assert.equal(paths.isWritable("products/deckle/queue/2026-09-12.json"), true);
});

/* ---------- the fs backend ---------- */

test("the read only fs store refuses every write", async () => {
  const s = createFsStore({ readOnly: true });
  await assert.rejects(() => s.writeFile("products/deckle/metrics.csv", "x"), /read only/);
});

test("the fs store reads a real repo file", async () => {
  const s = createFsStore({});
  const f = await s.readFile("products/echoself/ethics.md");
  assert.ok(f && f.content.includes("never_post"));
  assert.ok(f.sha.length === 40);
});

/* ---------- the github backend, against a mock ---------- */

function mockGithub(files) {
  const state = new Map(Object.entries(files || {}));
  const calls = [];
  let shaSeq = 1000;
  const shaFor = (c) => "sha" + require("crypto").createHash("md5").update(c).digest("hex").slice(0, 8);

  async function fetchImpl(url, init) {
    const method = (init && init.method) || "GET";
    const path = url.replace("https://api.github.com", "").split("?")[0];
    calls.push({ method, path, body: init && init.body ? JSON.parse(init.body) : null });
    const m = path.match(/^\/repos\/[^/]+\/[^/]+\/contents\/(.*)$/);
    const key = m ? decodeURI(m[1]) : null;

    if (method === "GET") {
      if (state.has(key)) {
        const content = state.get(key);
        return json(200, { content: b64encode(content), sha: shaFor(content), path: key });
      }
      // directory listing
      const kids = [...state.keys()].filter((k) => k.startsWith(key + "/"));
      if (kids.length) return json(200, kids.map((k) => ({ name: k.slice(key.length + 1) })));
      return json(404, { message: "Not Found" });
    }

    if (method === "PUT") {
      const body = JSON.parse(init.body);
      const existing = state.has(key) ? shaFor(state.get(key)) : undefined;
      if (existing !== body.sha) {
        return json(409, { message: "is at " + existing + " but expected " + body.sha });
      }
      const content = Buffer.from(body.content, "base64").toString("utf8");
      state.set(key, content);
      shaSeq++;
      return json(200, { content: { sha: shaFor(content) }, commit: { sha: "commit" + shaSeq } });
    }
    return json(405, { message: "no" });
  }

  function json(status, body) {
    return { status, ok: status >= 200 && status < 300, json: async () => body };
  }

  return { fetchImpl, state, calls };
}

test("GITHUB. reads a file and decodes it", async () => {
  const mock = mockGithub({ "products/deckle/metrics.csv": "date,product\n" });
  const s = createGithubStore({ owner: "Yoshyaes", repo: "growth-desk", token: "t", fetch: mock.fetchImpl, cacheTtlMs: 0 });
  const f = await s.readFile("products/deckle/metrics.csv");
  assert.equal(f.content, "date,product\n");
  assert.ok(f.sha);
});

test("GITHUB. a missing file reads as null, not an error", async () => {
  const mock = mockGithub({});
  const s = createGithubStore({ owner: "o", repo: "r", fetch: mock.fetchImpl, cacheTtlMs: 0 });
  assert.equal(await s.readFile("products/deckle/queue/2026-09-12.json"), null);
});

test("GITHUB. a write commits and the value reads back", async () => {
  const mock = mockGithub({ "products/deckle/metrics.csv": "old" });
  const s = createGithubStore({ owner: "o", repo: "r", fetch: mock.fetchImpl, cacheTtlMs: 0 });
  await s.writeFile("products/deckle/metrics.csv", "new");
  assert.equal(mock.state.get("products/deckle/metrics.csv"), "new");
  const put = mock.calls.find((c) => c.method === "PUT");
  assert.ok(put.body.message.length > 0, "every write carries a commit message");
  assert.equal(put.body.branch, "main");
});

test("GITHUB. a stale sha gets one retry on a fresh read, then succeeds", async () => {
  const mock = mockGithub({ "products/deckle/metrics.csv": "current" });
  const s = createGithubStore({ owner: "o", repo: "r", fetch: mock.fetchImpl, cacheTtlMs: 0 });
  await s.writeFile("products/deckle/metrics.csv", "mine", { sha: "a-stale-sha" });
  assert.equal(mock.state.get("products/deckle/metrics.csv"), "mine");
  assert.equal(mock.calls.filter((c) => c.method === "PUT").length, 2, "one failed put, then one retry");
});

test("GITHUB. the store cannot write the ethics gate", async () => {
  const mock = mockGithub({ "products/echoself/ethics.md": "original" });
  const s = createGithubStore({ owner: "o", repo: "r", fetch: mock.fetchImpl });
  await assert.rejects(() => s.writeFile("products/echoself/ethics.md", "tampered"), /not a writable path/);
  assert.equal(mock.state.get("products/echoself/ethics.md"), "original");
  assert.equal(mock.calls.filter((c) => c.method === "PUT").length, 0, "no request should even be sent");
});

test("GITHUB. reads are cached within the ttl and refreshed after it", async () => {
  const mock = mockGithub({ "products/deckle/metrics.csv": "a" });
  let clock = 0;
  const s = createGithubStore({ owner: "o", repo: "r", fetch: mock.fetchImpl, cacheTtlMs: 1000, now: () => clock });
  await s.readFile("products/deckle/metrics.csv");
  await s.readFile("products/deckle/metrics.csv");
  assert.equal(mock.calls.filter((c) => c.method === "GET").length, 1, "second read should hit the cache");
  clock = 2000;
  await s.readFile("products/deckle/metrics.csv");
  assert.equal(mock.calls.filter((c) => c.method === "GET").length, 2, "after the ttl it should refetch");
});

/* ---------- routing ---------- */

test("ROUTING. hosted mode reads config from the bundle and state from github", async () => {
  const mock = mockGithub({ "products/deckle/metrics.csv": "from-github" });
  const base = createStore({ GD_STORE: "github", GITHUB_REPO: "Yoshyaes/growth-desk", GITHUB_TOKEN: "t" });
  base.state = createGithubStore({ owner: "Yoshyaes", repo: "growth-desk", token: "t", fetch: mock.fetchImpl, cacheTtlMs: 0 });
  const r = routed(base);

  const ethics = await r.readFile("products/echoself/ethics.md");
  assert.ok(ethics.content.includes("never_post"), "config must come from the read only bundle");
  assert.equal(mock.calls.length, 0, "config reads must not touch the github api");

  const metrics = await r.readFile("products/deckle/metrics.csv");
  assert.equal(metrics.content, "from-github");
});

test("ROUTING. a write to a config path is refused before it reaches any backend", async () => {
  const mock = mockGithub({});
  const base = createStore({ GD_STORE: "github", GITHUB_REPO: "o/r", GITHUB_TOKEN: "t" });
  base.state = createGithubStore({ owner: "o", repo: "r", fetch: mock.fetchImpl });
  const r = routed(base);
  await assert.rejects(() => r.writeFile("products/echoself/channels.yml", "gate: open"), /not a writable path/);
  assert.equal(mock.calls.length, 0);
});

test("local mode uses one read write filesystem store", () => {
  const s = createStore({});
  assert.equal(s.mode, "fs");
  assert.equal(s.config, s.state);
});
