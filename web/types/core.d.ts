/**
 * Types for the shared core.
 *
 * The core is plain JavaScript on purpose. It is the part that must be
 * provably correct, and keeping it as JS means `node --test` runs its 64
 * tests with no build step, in CI and on a laptop, forever. These
 * declarations give the app full type safety over it.
 */

export type GateState = "open" | "restricted" | "blocked";

export type MoveType =
  | "helpful_reply" | "soft_reply" | "original_post"
  | "build_in_public" | "direct_message" | "asset" | "partnership";

export type MoveState = "queued" | "drafted" | "copied" | "skipped";

export interface GateDecision {
  state: GateState;
  reason: string;
  source: string;
  channel: string | null;
  status: string | null;
  cadenceCap: number | null;
  karmaRequired: number | null;
  rulesUrl: string | null;
  promoPolicy: string | null;
  draftable: boolean;
  promotionalAllowed: boolean;
}

export interface Move {
  id: string;
  type: MoveType;
  channel: string;
  gate: GateState;
  gateDecision: GateDecision;
  target: { title: string; url: string | null };
  draft: string;
  why_today: string;
  expected: { metric: string; value: number };
  proof_refs: Array<{ claim: string; cited: boolean }>;
  state: MoveState;
}

export interface Queue {
  exists: boolean;
  date: string;
  product: string;
  generated_at: string | null;
  moves: Move[];
  dropped: Array<{ id: string; channel: string; reason: string }>;
  excluded: Array<{ channel: string; gate: string; reason: string }>;
  short: { asked: number; returned: number; reason: string } | null;
}

export interface Channel {
  id: string;
  kind: string;
  gate: GateState;
  gateReason: string;
  gateSource: string;
  draftable: boolean;
  status: string;
  cadence_cap_per_week: number | null;
  karma_required: number | null;
  rules_url: string | null;
  promo_policy: string | null;
  subscribers: number | null;
}

export interface FourNumbers {
  replies: number;
  qualified_convos: number;
  signups: number;
  paid: number;
  moves: number;
}

export interface StreakCell { date: string; weekday: boolean; sent: boolean }
export interface Streak { cells: StreakCell[]; weekdays: number; hit: number; failing: boolean }

export interface LintHit {
  rule: "em-dash" | "colon" | "semicolon" | "banned-word";
  label: string;
  index: number;
  length: number;
  found: string;
  context: string;
  fix: string | null;
  fixLabel: string;
}
export interface LintResult {
  clean: boolean;
  hits: LintHit[];
  summary: Array<{ rule: string; label: string; count: number; total?: number }>;
}

declare module "@core/gate" {
  export function gateFor(config: unknown, channelId: string | null | undefined): GateDecision;
  export function draftThroughGate(
    config: unknown, channelId: string, draft: string, opts?: { promotional?: boolean }
  ): { allowed: boolean; draft: string; gate: GateDecision; reason: string | null };
  export function applyToQueue(config: unknown, queue: unknown): { moves: Move[]; dropped: Queue["dropped"] };
  export function partition(config: unknown, ids: string[]): { allowed: unknown[]; excluded: unknown[] };
  export function isPromotional(type: string): boolean;
  export const PROMOTIONAL_TYPES: readonly string[];
  export const STATES: readonly GateState[];
}

declare module "@core/voice" {
  export function lint(text: string, banned: string[]): LintResult;
  export function parseBannedWords(markdown: string): string[];
}

declare module "@core/yaml-lite" {
  export function parse(text: string): Record<string, unknown>;
  export function frontmatter(text: string): { data: Record<string, unknown>; body: string };
}

declare module "@core/store" {
  export interface Store {
    mode: "fs" | "github";
    readFile(p: string): Promise<{ path: string; content: string; sha: string } | null>;
    listDir(p: string): Promise<string[]>;
    writeFile(p: string, content: string, options?: { sha?: string; message?: string }):
      Promise<{ path: string; sha: string }>;
    invalidate(p?: string): void;
  }
  export function createStore(env?: NodeJS.ProcessEnv): { mode: "fs" | "github"; config: Store; state: Store };
  export function routed(store: ReturnType<typeof createStore>): Store;
  export const paths: {
    isWritable(p: string): boolean;
    isConfig(p: string): boolean;
    assertWritable(p: string): void;
    normalise(p: string): string;
  };
}
