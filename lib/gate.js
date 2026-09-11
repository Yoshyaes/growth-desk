"use strict";
/**
 * THE ETHICS GATE.
 *
 * This is the most important file in the application. Every draft that reaches
 * a screen passes through it first. Read docs/DEVELOPMENT-PLAN.md before
 * changing anything here.
 *
 * Two properties must hold, and the test suite exists to prove them.
 *
 *   1. FAIL CLOSED. An unknown channel is blocked, never open. A missing
 *      config is blocked. A malformed gate value is blocked.
 *   2. NO DRAFT FOR A BLOCKED CHANNEL. There is no argument, no flag and no
 *      code path that produces draft text for a blocked channel.
 *
 * Pure functions only. No file IO in this module, so it can be tested against
 * fixtures as easily as against the real repo.
 */

const STATES = Object.freeze(["open", "restricted", "blocked"]);

/** Gate resolution for one channel. Returns a decision, never throws. */
function gateFor(config, channelId) {
  const deny = (config && config.denylist) || {};
  const id = String(channelId == null ? "" : channelId);
  const lower = id.toLowerCase();

  if (!id.trim()) {
    return decision("blocked", "no channel given", "fail-closed");
  }

  // 1. pattern match wins over everything, including an explicit open entry.
  const patterns = Array.isArray(deny.patterns) ? deny.patterns : [];
  for (const p of patterns) {
    const pat = String(p).toLowerCase();
    if (pat && lower.includes(pat)) {
      return decision("blocked", 'matches the denylist pattern "' + p + '"', "denylist.patterns");
    }
  }

  // 2. explicit denylist by id, case insensitive.
  const denied = Array.isArray(deny.channels) ? deny.channels : [];
  for (const c of denied) {
    if (String(c).toLowerCase() === lower) {
      return decision("blocked", "named in the ethics denylist", "denylist.channels");
    }
  }

  // 3. the channel's own declared gate.
  const channels = Array.isArray(config && config.channels) ? config.channels : [];
  const entry = channels.find((c) => c && String(c.id).toLowerCase() === lower);
  if (!entry) {
    return decision("blocked", "channel is not in channels.yml", "fail-closed");
  }
  const raw = entry.gate;
  if (raw === "open") return decision("open", "gate is open", "channels.yml", entry);
  if (raw === "no_first_person_promo") {
    return decision("restricted", "helpful replies only, no link and no product name", "channels.yml", entry);
  }
  if (raw === "restricted") {
    return decision("restricted", "helpful replies only, no link and no product name", "channels.yml", entry);
  }
  if (raw === "never_post") {
    return decision("blocked", "gate is never_post", "channels.yml", entry);
  }
  return decision("blocked", 'unrecognised gate value "' + String(raw) + '"', "fail-closed", entry);
}

function decision(state, reason, source, entry) {
  return Object.freeze({
    state,
    reason,
    source,
    channel: entry ? entry.id : null,
    status: entry ? entry.status || null : null,
    cadenceCap: entry ? entry.cadence_cap_per_week ?? null : null,
    karmaRequired: entry ? entry.karma_required ?? null : null,
    rulesUrl: entry ? entry.rules_url || null : null,
    promoPolicy: entry ? entry.promo_policy || null : null,
    draftable: state !== "blocked",
    promotionalAllowed: state === "open"
  });
}

/**
 * The only sanctioned way to let draft text through.
 * Returns the draft when the gate permits it, and an empty string when it
 * does not. It never returns partial or redacted copy, because a redacted
 * blocked draft is still a blocked draft.
 */
function draftThroughGate(config, channelId, draft, opts) {
  const g = gateFor(config, channelId);
  const promotional = Boolean(opts && opts.promotional);
  if (g.state === "blocked") {
    return { allowed: false, draft: "", gate: g, reason: g.reason };
  }
  if (g.state === "restricted" && promotional) {
    return {
      allowed: false,
      draft: "",
      gate: g,
      reason: "promotional copy is not permitted in a restricted channel"
    };
  }
  return { allowed: true, draft: String(draft == null ? "" : draft), gate: g, reason: null };
}

/** Split a channel list into what today may use and what it may not. */
function partition(config, channelIds) {
  const allowed = [];
  const excluded = [];
  for (const id of channelIds || []) {
    const g = gateFor(config, id);
    if (g.state === "blocked") excluded.push({ channel: id, gate: g.state, reason: g.reason });
    else allowed.push({ channel: id, gate: g.state, decision: g });
  }
  return { allowed, excluded };
}

/** Filter a generated queue. Blocked moves are dropped, never rendered. */
function applyToQueue(config, queue) {
  const moves = Array.isArray(queue && queue.moves) ? queue.moves : [];
  const kept = [];
  const dropped = [];
  for (const m of moves) {
    const out = draftThroughGate(config, m.channel, m.draft, {
      promotional: isPromotional(m.type)
    });
    if (out.allowed) kept.push({ ...m, gate: out.gate.state, gateDecision: out.gate });
    else dropped.push({ id: m.id, channel: m.channel, reason: out.reason });
  }
  return { moves: kept, dropped };
}

const PROMOTIONAL_TYPES = Object.freeze(["soft_reply", "original_post", "build_in_public"]);
function isPromotional(type) {
  return PROMOTIONAL_TYPES.includes(String(type));
}

module.exports = {
  STATES,
  gateFor,
  draftThroughGate,
  partition,
  applyToQueue,
  isPromotional,
  PROMOTIONAL_TYPES
};
