import type { GateState } from "@/types/core";

/**
 * The gate badge. These three colors carry information and nothing else.
 * They are never used for a button, a heading or a hover state.
 */
export function GateBadge({ state }: { state: GateState }) {
  return (
    <span className={`badge ${state}`}>
      <i aria-hidden="true" />
      {state}
    </span>
  );
}
