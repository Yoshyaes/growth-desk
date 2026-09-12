import Link from "next/link";
import type { Move } from "@/types/core";
import { GateBadge } from "./GateBadge";
import { CopyButton } from "./CopyButton";
import { SkipButton } from "./SkipButton";
import { DraftText } from "./DraftText";

const TYPE_LABEL: Record<string, string> = {
  helpful_reply: "helpful reply", soft_reply: "soft reply", original_post: "post",
  build_in_public: "build in public", direct_message: "direct message",
  asset: "asset", partnership: "partnership"
};

const METRIC_WORD: Record<string, string> = {
  replies: "replies", qualified_convos: "qualified conversations",
  signups: "signups", paid: "paid conversions"
};

/** The move card is the only elevated object in the application. */
export function MoveCard({ product, move, rank }: { product: string; move: Move; rank: number }) {
  const state = move.state ?? "queued";
  const target = move.target ?? { title: "", url: null };

  return (
    <article className={`move is-${state}`}>
      <div className="head">
        <span className="id">{move.id}</span>
        <span className="type">{TYPE_LABEL[move.type] ?? move.type}</span>
        <span className="arrow" aria-hidden="true">-&gt;</span>
        <span className="chan">{move.channel}</span>
        <GateBadge state={move.gate} />
        <span className="rank">#{rank}</span>
      </div>

      <div className="target">
        {target.url ? (
          <a href={target.url} target="_blank" rel="noreferrer">{target.title}</a>
        ) : (
          target.title
        )}
      </div>

      <DraftText text={move.draft} />

      <div className="foot">
        <span className="why">
          Expected {move.expected?.value} {METRIC_WORD[move.expected?.metric] ?? move.expected?.metric}
        </span>
        <span className="acts">
          <Link className="btn" href={`/${product}/move/${move.id}`}>Open</Link>
          <SkipButton product={product} moveId={move.id} />
          <CopyButton product={product} moveId={move.id} getText={() => move.draft} />
        </span>
      </div>
    </article>
  );
}
