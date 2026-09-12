"use strict";
/** Filesystem backend. Used locally, and used on the host for read-only config. */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const paths = require("./paths");

function createFsStore(opts) {
  const root = (opts && opts.root) || path.resolve(__dirname, "..", "..");
  const readOnly = Boolean(opts && opts.readOnly);
  const full = (p) => path.join(root, paths.normalise(p));
  const sha = (s) => crypto.createHash("sha1").update("blob " + Buffer.byteLength(s) + "\0" + s).digest("hex");

  return {
    kind: "fs",
    readOnly,

    async readFile(p) {
      if (!paths.isSafe(p)) return null;
      try {
        const content = fs.readFileSync(full(p), "utf8");
        return { path: paths.normalise(p), content, sha: sha(content) };
      } catch { return null; }
    },

    async listDir(p) {
      if (!paths.isSafe(p)) return [];
      try { return fs.readdirSync(full(p)).sort(); } catch { return []; }
    },

    async writeFile(p, content) {
      if (readOnly) {
        const err = new Error("refused. this store is read only");
        err.code = "E_READ_ONLY";
        throw err;
      }
      paths.assertWritable(p);
      const target = full(p);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content);
      return { path: paths.normalise(p), sha: sha(content) };
    }
  };
}

module.exports = { createFsStore };
