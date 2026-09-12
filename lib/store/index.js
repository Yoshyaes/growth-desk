"use strict";
/**
 * Store selection.
 *
 * Local development uses one read/write filesystem store.
 *
 * Hosted uses two. Config comes from the deployment bundle and is read only,
 * so the running app has no write path to the ethics gate. Mutable state goes
 * to GitHub, so the repository stays the source of truth and git history is
 * the audit trail.
 */

const { createFsStore } = require("./fs");
const { createGithubStore } = require("./github");
const paths = require("./paths");

function createStore(env) {
  const e = env || process.env;
  const useGithub = String(e.GD_STORE || "").toLowerCase() === "github"
    || Boolean(e.GITHUB_REPO && e.GITHUB_TOKEN && String(e.GD_STORE || "") !== "fs");

  if (!useGithub) {
    const local = createFsStore({ root: e.GD_ROOT });
    return { mode: "fs", config: local, state: local };
  }

  const [owner, repo] = String(e.GITHUB_REPO || "").split("/");
  const state = createGithubStore({
    owner, repo,
    branch: e.GITHUB_BRANCH || "main",
    token: e.GITHUB_TOKEN,
    cacheTtlMs: e.GD_CACHE_TTL_MS ? Number(e.GD_CACHE_TTL_MS) : undefined
  });
  const config = createFsStore({ root: e.GD_ROOT, readOnly: true });
  return { mode: "github", config, state };
}

/** Route a read to the right store. Config always comes from the bundle. */
function routed(store) {
  return {
    mode: store.mode,
    async readFile(p) {
      if (paths.isConfig(p)) return store.config.readFile(p);
      return store.state.readFile(p);
    },
    async listDir(p) {
      const fromState = await store.state.listDir(p);
      if (fromState.length) return fromState;
      return store.config.listDir(p);
    },
    async writeFile(p, content, options) {
      paths.assertWritable(p);
      return store.state.writeFile(p, content, options);
    },
    invalidate(p) { if (store.state.invalidate) store.state.invalidate(p); }
  };
}

module.exports = { createStore, routed, paths };
