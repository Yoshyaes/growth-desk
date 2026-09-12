import type { Queue } from "@/types/core";

/**
 * Exclusions are stated, never silently hidden. A tool that quietly drops a
 * channel teaches you nothing. This one names what it refused and why.
 */
export function GateNotice({ queue }: { queue: Queue }) {
  const seen = new Set<string>();
  const items = [
    ...queue.excluded.map((e) => ({ channel: e.channel, reason: e.reason })),
    ...queue.dropped.map((d) => ({ channel: d.channel, reason: d.reason }))
  ].filter((e) => (seen.has(e.channel) ? false : seen.add(e.channel)));

  if (!items.length) return null;

  return (
    <section className="gatenotice" aria-label="Ethics gate">
      <span className="label">Ethics gate</span>
      <p>
        {items.length} channel{items.length === 1 ? "" : "s"} excluded from today&rsquo;s run.
      </p>
      {items.map((e) => (
        <p key={e.channel}>
          <code>{e.channel}</code> . {e.reason}
        </p>
      ))}
    </section>
  );
}
