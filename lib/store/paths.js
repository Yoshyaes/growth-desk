"use strict";
/**
 * What the running application is allowed to write.
 *
 * This is a security boundary, not a convenience. The ethics gate, the ICP,
 * the voice rules and the channel configuration are READ ONLY at runtime.
 * They ship with the deployment and change only through a pull request.
 *
 * The consequence is the property the PRD asked for. A hosted Growth Desk
 * cannot edit its own ethics gate, even if the code tried to, even if
 * someone got a session. Changing the denylist requires a commit and a
 * redeploy, which is exactly the friction it should have.
 */

const WRITABLE = [
  /^products\/[a-z0-9-]+\/queue\/\d{4}-\d{2}-\d{2}\.json$/,
  /^products\/[a-z0-9-]+\/metrics\.csv$/,
  /^products\/[a-z0-9-]+\/logs\/\d{4}-\d{2}-\d{2}\.md$/
];

const CONFIG = [
  /^products\/[a-z0-9-]+\/(icp|voice|offers|proof|ethics|learnings)\.md$/,
  /^products\/[a-z0-9-]+\/channels\.yml$/,
  /^shared\/[a-z-]+\.md$/
];

function normalise(p) {
  return String(p == null ? "" : p).replace(/^\.?\//, "").replace(/\\/g, "/");
}

/** Reject traversal, absolute paths and anything outside the repo shape. */
function isSafe(p) {
  const n = normalise(p);
  if (!n) return false;
  if (n.startsWith("/")) return false;
  if (n.includes("..")) return false;
  if (n.includes("\0")) return false;
  return true;
}

function isWritable(p) {
  const n = normalise(p);
  return isSafe(n) && WRITABLE.some((re) => re.test(n));
}

function isConfig(p) {
  const n = normalise(p);
  return isSafe(n) && CONFIG.some((re) => re.test(n));
}

function assertWritable(p) {
  if (!isWritable(p)) {
    const err = new Error("refused. " + normalise(p) + " is not a writable path");
    err.code = "E_NOT_WRITABLE";
    throw err;
  }
}

module.exports = { WRITABLE, CONFIG, normalise, isSafe, isWritable, isConfig, assertWritable };
