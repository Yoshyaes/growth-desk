"use server";

/**
 * Server actions. The only write path in the application.
 *
 * Three things happen before any byte is written.
 *   1. The session is checked.
 *   2. The move's channel is checked against the gate.
 *   3. The store refuses any path outside the writable allowlist.
 *
 * There is no action that posts, schedules, or sends. That absence is the
 * feature, and tests assert it.
 */

import { revalidatePath } from "next/cache";
import * as gate from "@core/gate";
import * as voice from "@core/voice";
import { auth } from "@/auth";
import { store, queuePath, channelConfig, bannedWords, isProduct, today } from "./data";
import type { LintResult, MoveState } from "@/types/core";

const STATES: MoveState[] = ["queued", "drafted", "copied", "skipped"];

export interface ActionResult {
  ok: boolean;
  error?: string;
  conflict?: boolean;
}

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("not signed in");
  return session;
}

/**
 * Update one move's state or draft.
 *
 * The app may move a move between states and may edit a draft.
 * It may never add a move, and it may never change the exclusions.
 */
export async function updateMove(
  slug: string,
  moveId: string,
  patch: { state?: MoveState; draft?: string }
): Promise<ActionResult> {
  await requireSession();
  if (!isProduct(slug)) return { ok: false, error: "unknown product" };

  const path = queuePath(slug, today());
  const s = store();
  const file = await s.readFile(path);
  if (!file) return { ok: false, error: "no queue for today" };

  let parsed: { moves?: Array<Record<string, unknown>> };
  try { parsed = JSON.parse(file.content); } catch { return { ok: false, error: "queue file is not valid json" }; }

  const moves = parsed.moves ?? [];
  const idx = moves.findIndex((m) => m.id === moveId);
  if (idx === -1) return { ok: false, error: "unknown move" };
  const move = moves[idx];

  const next: Record<string, unknown> = {};
  if (patch.state && STATES.includes(patch.state)) next.state = patch.state;
  if (typeof patch.draft === "string") next.draft = patch.draft;
  if (!Object.keys(next).length) return { ok: false, error: "nothing to change" };

  // the gate runs on every write, not only on generation
  const cfg = await channelConfig(slug);
  const check = gate.draftThroughGate(
    cfg,
    String(move.channel),
    String(next.draft ?? move.draft ?? ""),
    { promotional: gate.isPromotional(String(move.type)) }
  );
  if (!check.allowed) return { ok: false, error: check.reason ?? "the gate refused this write" };

  moves[idx] = { ...move, ...next, updated_at: new Date().toISOString() };

  try {
    await s.writeFile(path, JSON.stringify(parsed, null, 2) + "\n", {
      sha: file.sha,
      message: `growth desk. ${slug} ${moveId} ${next.state ?? "draft edit"}`
    });
  } catch (err) {
    const e = err as Error & { status?: number };
    if (e.status === 409) {
      return { ok: false, conflict: true, error: "that move changed underneath you. reload and reapply your edit" };
    }
    return { ok: false, error: e.message };
  }

  revalidatePath(`/${slug}/today`);
  revalidatePath(`/${slug}/move/${moveId}`);
  return { ok: true };
}

/** Advisory only. The lint never blocks a copy. */
export async function lintDraft(text: string): Promise<LintResult> {
  await requireSession();
  return voice.lint(text, await bannedWords());
}
