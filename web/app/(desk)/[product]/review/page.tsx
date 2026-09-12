import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { Inspector, InspectorRow } from "@/components/Inspector";
import { backlogAll, isProduct, weeklyReview } from "@/lib/data";

export const dynamic = "force-dynamic";

/**
 * The Friday brief.
 *
 * Mostly typography. No tiles, no charts. It leads with the worst number,
 * which is a rule rather than a layout preference, and the ordering is
 * computed in lib/review.js rather than chosen here.
 */
export default async function Review({ params }: { params: Promise<{ product: string }> }) {
  const { product } = await params;
  if (!isProduct(product)) notFound();

  const [r, backlog] = await Promise.all([weeklyReview(), backlogAll()]);

  const inspector = (
    <Inspector>
      <InspectorRow k="The rule" v="lead with the worst number. no burying" />
      <InspectorRow k="Habit beats numbers" v="a broken streak outranks a bad conversion rate, because the habit produces the numbers" />
      <InspectorRow k="Best move" v="ranked by conversations, then signups, then replies. reach is only a tiebreaker" />
      <InspectorRow k="Worst channel" v="three or more moves spent and no conversations back" />
      <InspectorRow k="Not shown" v="page views, impressions, reach" />
    </Inspector>
  );

  return (
    <Shell slug={product} page="review" title="Weekly review" when="last 7 days" inspector={inspector}>
      <div style={{ maxWidth: "62ch" }}>
        <span className="label">Week to {new Date().toISOString().slice(0, 10)}</span>
        <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2, margin: "10px 0 0", textWrap: "balance" }}>
          {r.headline}
        </h2>
      </div>

      <div className={r.systemFailing ? "callout" : ""} style={r.systemFailing ? undefined : { borderLeft: "3px solid var(--rule)", paddingLeft: 18 }}>
        {r.systemFailing ? <span className="label">Verdict</span> : <span className="label" style={{ display: "block", marginBottom: 8 }}>Verdict</span>}
        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: r.systemFailing ? undefined : "var(--ink-muted)" }}>{r.verdict}</p>
      </div>

      <div className="tablewrap">
        <table className="data">
          <thead>
            <tr>
              <th>Product</th>
              <th className="n">Moves, 7d</th>
              <th className="n">Replies, 7d</th>
              <th className="n">Convos, 28d</th>
              <th className="n">Paid, 28d</th>
              <th className="n">Streak</th>
            </tr>
          </thead>
          <tbody>
            {r.products.map((p) => (
              <tr key={p.slug}>
                <td>{p.slug}</td>
                <td className="n">{p.seven.moves}</td>
                <td className="n">{p.seven.replies}</td>
                <td className="n">{p.twentyEight.qualified_convos}</td>
                <td className="n">{p.twentyEight.paid}</td>
                <td className="n" style={p.streak?.failing ? { color: "var(--blocked-fg)" } : undefined}>
                  {p.streak ? `${p.streak.hit} / ${p.streak.weekdays}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <span className="label" style={{ display: "block", marginBottom: 10 }}>Best move of the week</span>
        {r.bestMove ? (
          <p className="plain" style={{ maxWidth: "62ch" }}>
            <span className="mono">{r.bestMove.move_id}</span> on {r.bestMove.channel} for {r.bestMove.product}.
            {" "}{r.bestMove.qualified_convos} qualified conversation{r.bestMove.qualified_convos === 1 ? "" : "s"},
            {" "}{r.bestMove.signups} signup{r.bestMove.signups === 1 ? "" : "s"},
            {" "}{r.bestMove.replies} repl{r.bestMove.replies === 1 ? "y" : "ies"}.
          </p>
        ) : (
          <p className="plain" style={{ maxWidth: "62ch" }}>
            Nothing produced a reply, a conversation or a signup this week. That is the finding, and it is not
            softened by picking a move that merely got seen.
          </p>
        )}
      </div>

      <div>
        <span className="label" style={{ display: "block", marginBottom: 10 }}>Channel to burn</span>
        {r.worstChannel ? (
          <p className="plain" style={{ maxWidth: "62ch" }}>
            <span className="mono">{r.worstChannel.channel}</span> on {r.worstChannel.product}.
            {" "}{r.worstChannel.moves} moves spent, {r.worstChannel.replies} repl
            {r.worstChannel.replies === 1 ? "y" : "ies"}, no conversations. Change the approach or mark it burned
            in channels.yml.
          </p>
        ) : (
          <p className="plain" style={{ maxWidth: "62ch" }}>
            No channel has three spent moves and nothing to show yet. Ask again once there is more history.
          </p>
        )}
      </div>

      <div className="hairline" />

      <div>
        <div className="sechead" style={{ marginBottom: 10 }}>
          <span className="label">The assumption backlog</span>
          <span className="mono" style={{ fontSize: 12, color: "var(--ink-faint)", marginLeft: "auto" }}>
            {backlog.total} assumed, {backlog.planned} planned
          </span>
        </div>

        {backlog.withoutPlan.length ? (
          <div className="callout" style={{ marginBottom: 18 }}>
            <span className="label">No written test plan</span>
            <p>
              {backlog.withoutPlan.join(" and ")} {backlog.withoutPlan.length === 1 ? "has" : "have"} assumptions
              on file and no written plan for checking any of them. An assumption nobody has said how to test
              sits there being quietly believed.
            </p>
          </div>
        ) : null}

        {backlog.products.map((p) => (
          <div key={p.product} style={{ marginBottom: 26 }}>
            <div className="sechead" style={{ marginBottom: 8 }}>
              <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{p.product}</span>
              <span className="mono" style={{ fontSize: 12, color: "var(--ink-faint)", marginLeft: "auto" }}>
                {p.total} assumed, {p.planned} planned
              </span>
            </div>

            {p.plans.length ? (
              <div style={{ marginBottom: 12 }}>
                {p.plans.map((plan) => (
                  <div className="claim" key={plan.assumption}>
                    <span className="tag verified">planned</span>
                    <span className="txt">
                      {plan.assumption}
                      {plan.test ? (
                        <span style={{ display: "block", color: "var(--ink-faint)", marginTop: 3 }}>
                          Test {plan.test}
                        </span>
                      ) : null}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {p.assumed.slice(0, 6).map((a, n) => (
              <div className="claim" key={`${p.product}-${n}`}>
                <span className="tag assumed">assumed</span>
                <span className="txt">
                  {a.claim}
                  <span className="mono" style={{ color: "var(--ink-faint)", fontSize: 11, marginLeft: 8 }}>
                    {a.file}.md
                  </span>
                </span>
              </div>
            ))}
            {p.assumed.length > 6 ? (
              <p className="plain" style={{ marginTop: 8 }}>
                {p.assumed.length - 6} more in{" "}
                <Link href={`/${p.product}/product/icp`}>{p.product} icp.md</Link>.
              </p>
            ) : null}
          </div>
        ))}

        <p className="plain" style={{ maxWidth: "62ch", color: "var(--ink-faint)" }}>
          Plans and assumptions are listed separately rather than matched to each other. A written test restates
          an assumption in different words, so any automatic linkage would look precise and be wrong.
        </p>
      </div>
    </Shell>
  );
}
