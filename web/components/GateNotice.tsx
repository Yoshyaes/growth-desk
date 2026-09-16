"use client";

import { useState } from "react";
import type { Queue } from "@/types/core";

/**
 * Exclusions are stated, never silently hidden. A tool that quietly drops a
 * channel teaches you nothing.
 *
 * On a phone the examples collapse after two. This is the first thing seen
 * every single morning, and on Echoself the full list costs half the screen
 * before a single move is visible. The statement survives. The specifics are
 * one tap away.
 */
export function GateNotice({ queue }: { queue: Queue }) {
  const [open, setOpen] = useState(false);

  const seen = new Set<string>();
  const items = [
    ...queue.excluded.map((e) => ({ channel: e.channel, reason: e.reason })),
    ...queue.dropped.map((d) => ({ channel: d.channel, reason: d.reason }))
  ].filter((e) => (seen.has(e.channel) ? false : seen.add(e.channel)));

  if (!items.length) return null;
  const extra = Math.max(0, items.length - 2);

  return (
    <section className={`gatenotice ${open ? "is-open" : ""}`} aria-label="Ethics gate">
      <span className="label">Ethics gate</span>
      <p>
        {items.length} channel{items.length === 1 ? "" : "s"} excluded from today&rsquo;s run.
      </p>
      {items.map((e, i) => (
        <p key={e.channel} className={i >= 2 ? "gate-extra" : ""}>
          <code>{e.channel}</code> . {e.reason}
        </p>
      ))}
      {extra && !open ? (
        <button className="gate-more" type="button" onClick={() => setOpen(true)}>
          and {extra} more
        </button>
      ) : null}
    </section>
  );
}
