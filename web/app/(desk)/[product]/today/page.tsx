import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { MoveCard } from "@/components/MoveCard";
import { GateNotice } from "@/components/GateNotice";
import { Inspector, InspectorRow } from "@/components/Inspector";
import { ethics, isProduct, queue } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Today({ params }: { params: Promise<{ product: string }> }) {
  const { product } = await params;
  if (!isProduct(product)) notFound();

  const [q, eth] = await Promise.all([queue(product), ethics(product)]);
  const copied = q.moves.filter((m) => m.state === "copied").length;
  const first = q.moves[0];

  const inspector = (
    <Inspector>
      {first ? (
        <>
          <InspectorRow k="Channel" v={first.channel} mono />
          <InspectorRow k="Gate" v={`${first.gateDecision.state}, ${first.gateDecision.reason}`} />
          {first.gateDecision.cadenceCap != null
            ? <InspectorRow k="Cadence cap" v={`${first.gateDecision.cadenceCap} per week`} mono /> : null}
          {first.gateDecision.karmaRequired != null
            ? <InspectorRow k="Karma required" v={String(first.gateDecision.karmaRequired)} mono /> : null}
          {first.gateDecision.status ? <InspectorRow k="Status" v={first.gateDecision.status} /> : null}
        </>
      ) : null}
      {eth.standing.length ? (
        <div className="irow">
          <div className="k">Standing rules</div>
          {eth.standing.map((s) => <div key={s} className="v" style={{ marginTop: 6 }}>{s}</div>)}
        </div>
      ) : null}
      <InspectorRow k="Never auto-post" v="Drafts only. Copy and paste by hand." />
    </Inspector>
  );

  return (
    <Shell slug={product} page="today" title="Today" when={q.date} inspector={inspector}>
      <GateNotice queue={q} />

      {!q.exists ? (
        <div className="empty">
          <h2>Nothing queued for {product} yet.</h2>
          <p>Run daily-moves to draft today&rsquo;s five. Nothing here posts by itself.</p>
          <button className="btn primary" type="button" disabled title="Phase F">Run daily-moves</button>
        </div>
      ) : !q.moves.length ? (
        <div className="empty">
          <h2>No moves survived the gate today.</h2>
          <p>Everything generated was for a channel the gate blocks. Nothing was padded to make up the number.</p>
        </div>
      ) : (
        <>
          <p className="plain">{q.moves.length} drafted, {copied} copied</p>
          {q.moves.map((m, i) => <MoveCard key={m.id} product={product} move={m} rank={i + 1} />)}
          {q.short ? (
            <p className="plain">
              {q.short.returned} moves today, not {q.short.asked}. {q.short.reason}. Nothing was padded.
            </p>
          ) : null}
        </>
      )}
    </Shell>
  );
}
