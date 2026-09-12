"use strict";
/**
 * GitHub backend. The repository is the database.
 *
 * Reads and writes go through the Contents API against a branch. Every write
 * is a real commit, so the audit trail is git history and `git log` answers
 * "who changed this draft and when" with no extra machinery.
 *
 * Two properties this has to get right.
 *
 *   1. Writes are conditional on the blob sha we last read. A stale sha gets
 *      a 409 from GitHub, which we surface rather than clobber. One retry on
 *      a fresh read, then we give up and say so.
 *   2. Only paths on the writable allowlist can be written at all. The gate
 *      config is not on it, so this code cannot edit the ethics gate.
 *
 * fetch is injectable so the whole thing is testable without a network.
 */

const paths = require("./paths");

const API = "https://api.github.com";

function b64encode(s) { return Buffer.from(s, "utf8").toString("base64"); }
function b64decode(s) { return Buffer.from(String(s).replace(/\n/g, ""), "base64").toString("utf8"); }

function createGithubStore(opts) {
  const o = opts || {};
  const owner = o.owner;
  const repo = o.repo;
  const branch = o.branch || "main";
  const token = o.token;
  const doFetch = o.fetch || globalThis.fetch;
  const ttlMs = o.cacheTtlMs == null ? 15000 : o.cacheTtlMs;
  const now = o.now || (() => Date.now());

  if (!owner || !repo) throw new Error("github store needs owner and repo");

  const cache = new Map(); // path -> { at, value }

  function headers(extra) {
    return Object.assign({
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      "user-agent": "growth-desk",
      authorization: token ? "Bearer " + token : undefined
    }, extra || {});
  }

  function clean(h) {
    const out = {};
    for (const k of Object.keys(h)) if (h[k] !== undefined) out[k] = h[k];
    return out;
  }

  async function api(method, path_, body) {
    const res = await doFetch(API + path_, {
      method,
      headers: clean(headers(body ? { "content-type": "application/json" } : null)),
      body: body ? JSON.stringify(body) : undefined
    });
    let json = null;
    try { json = await res.json(); } catch { json = null; }
    return { status: res.status, ok: res.ok, json };
  }

  function cacheGet(p) {
    const hit = cache.get(p);
    if (!hit) return null;
    if (now() - hit.at > ttlMs) { cache.delete(p); return null; }
    return hit.value;
  }

  function cacheSet(p, value) { cache.set(p, { at: now(), value }); }

  const store = {
    kind: "github",
    readOnly: false,
    owner, repo, branch,

    invalidate(p) { if (p) cache.delete(paths.normalise(p)); else cache.clear(); },

    async readFile(p) {
      if (!paths.isSafe(p)) return null;
      const key = paths.normalise(p);
      const cached = cacheGet(key);
      if (cached !== null) return cached;

      const r = await api("GET", `/repos/${owner}/${repo}/contents/${encodeURI(key)}?ref=${encodeURIComponent(branch)}`);
      if (r.status === 404) { cacheSet(key, null); return null; }
      if (!r.ok) throw githubError(r, "read " + key);
      if (Array.isArray(r.json)) return null; // it is a directory
      const value = { path: key, content: b64decode(r.json.content || ""), sha: r.json.sha };
      cacheSet(key, value);
      return value;
    },

    async listDir(p) {
      if (!paths.isSafe(p)) return [];
      const key = paths.normalise(p);
      const r = await api("GET", `/repos/${owner}/${repo}/contents/${encodeURI(key)}?ref=${encodeURIComponent(branch)}`);
      if (r.status === 404) return [];
      if (!r.ok) throw githubError(r, "list " + key);
      if (!Array.isArray(r.json)) return [];
      return r.json.map((e) => e.name).sort();
    },

    /**
     * Write one file. Conditional on the sha we last saw.
     * On a 409 we re-read once and retry, then surface the conflict.
     */
    async writeFile(p, content, options) {
      paths.assertWritable(p);
      const key = paths.normalise(p);
      const opt = options || {};
      const message = opt.message || ("growth desk. update " + key);

      let sha = opt.sha;
      if (sha === undefined) {
        const existing = await store.readFile(key);
        sha = existing ? existing.sha : undefined;
      }

      const attempt = async (withSha) => api("PUT", `/repos/${owner}/${repo}/contents/${encodeURI(key)}`, {
        message,
        content: b64encode(content),
        branch,
        sha: withSha,
        committer: opt.committer
      });

      let r = await attempt(sha);
      if (r.status === 409 || r.status === 422) {
        cache.delete(key);
        const fresh = await store.readFile(key);
        r = await attempt(fresh ? fresh.sha : undefined);
      }
      if (!r.ok) throw githubError(r, "write " + key);

      const value = { path: key, content, sha: r.json && r.json.content && r.json.content.sha };
      cacheSet(key, value);
      return value;
    }
  };

  return store;
}

function githubError(r, what) {
  const msg = (r.json && (r.json.message || r.json.error)) || ("status " + r.status);
  const err = new Error("github " + what + " failed. " + msg);
  err.code = "E_GITHUB";
  err.status = r.status;
  return err;
}

module.exports = { createGithubStore, b64encode, b64decode };
