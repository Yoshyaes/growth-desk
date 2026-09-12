import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { DraftEditor } from "@/components/DraftEditor";
import { GateBadge } from "@/components/GateBadge";
import { Inspector, InspectorRow } from "@/components/Inspector";
import { bannedWords, isProduct, moveById } from "@/lib/data";
import * as voice from "@core/voice";

export const dynamic = "force-dynamic";

export default async function MovePage({ params }: { params: Promise<{ product: string; id: string }> }) {
  const { product, id } = await params;
  if (!isProduct(product)) notFound();

  // moveById reads through the gate, so a blocked move is simply not found.
  // there is no code path that renders one.
  const move = await moveById(product, id);
  if (!move) notFound();

  const lint = voice.lint(move.draft, await bannedWords());
  const g = move.gateDecision;

  const inspector = (
    <Inspector>
      <InspectorRow k="Channel" v={move.channel} mono />
      <InspectorRow k="Gate" v={`${g.state}, ${g.reason}`} />
      {g.promoPolicy ? <InspectorRow k="Promo policy" v={g.promoPolicy} /> : null}
      {g.rulesUrl ? (
        <InspectorRow k="Rules" v={<a href={g.rulesUrl} target="_blank" rel="noreferrer">{g.rulesUrl}</a>} />
      ) : null}
      {g.cadenceCap != null ? <InspectorRow k="Cadence cap" v={`${g.cadenceCap} per week`} mono /> : null}
      <InspectorRow k="Promotional copy" v={g.promotionalAllowed ? "allowed" : "not permitted here"} />
      <InspectorRow k="Never auto-post" v="Drafts only. Copy and paste by hand." />
    </Inspector>
  );

  return (
    <Shell slug={product} page="today" title={move.id} when={move.type} inspector={inspector}>
      <div className="sechead"><span className="label">Answering</span><GateBadge state={move.gate} /></div>
      <div style={{ borderLeft: "3px solid var(--rule)", paddingLeft: 16 }}>
        <p className="plain" style={{ margin: 0 }}>
          {move.target?.url
            ? <a href={move.target.url} target="_blank" rel="noreferrer">{move.target.title}</a>
            : move.target?.title}
        </p>
        {move.why_today ? <p className="plain" style={{ marginTop: 8, color: "var(--ink-faint)" }}>{move.why_today}</p> : null}
      </div>

      <DraftEditor product={product} move={move} initialLint={lint} />

      {move.proof_refs?.length ? (
        <div>
          <div className="sechead" style={{ marginBottom: 10 }}><span className="label">Proof</span></div>
          {move.proof_refs.map((p) => (
            <div key={p.claim} className="claim">
              <span className={`tag ${p.cited ? "verified" : "assumed"}`}>{p.cited ? "cited" : "no source"}</span>
              <span className="txt">{p.claim}</span>
            </div>
          ))}
        </div>
      ) : null}

      <Link className="btn" href={`/${product}/today`}>Back to today</Link>
    </Shell>
  );
}
