import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { StreakStrip } from "@/components/StreakStrip";
import { Inspector, InspectorRow } from "@/components/Inspector";
import { PRODUCTS, fourNumbers, isProduct, streak } from "@/lib/data";

export const dynamic = "force-dynamic";

/** Four numbers. Page views are not among them and never will be. */
const TILES = [
  ["replies", "Replies", 60],
  ["qualified_convos", "Qualified conversations", 12],
  ["signups", "Attributed signups", 15],
  ["paid", "Paid", 2]
] as const;

export default async function Metrics({ params }: { params: Promise<{ product: string }> }) {
  const { product } = await params;
  if (!isProduct(product)) notFound();

  const rows = await Promise.all(PRODUCTS.map(async (p) => ({ p, n: await fourNumbers(p, 28), s: await streak(p, 14) })));
  const totals = rows.reduce(
    (a, { n }) => ({
      replies: a.replies + n.replies,
      qualified_convos: a.qualified_convos + n.qualified_convos,
      signups: a.signups + n.signups,
      paid: a.paid + n.paid
    }),
    { replies: 0, qualified_convos: 0, signups: 0, paid: 0 }
  );

  const inspector = (
    <Inspector>
      <div className="irow"><div className="k">What each number counts</div></div>
      <InspectorRow k="Reply" v="a human wrote back in the thread" />
      <InspectorRow k="Qualified conversation" v="they stated the problem unprompted" />
      <InspectorRow k="Attributed signup" v="source captured at signup and matched to a move id" />
      <InspectorRow k="Paid" v="billing event, attributed by source" />
      <InspectorRow k="Not shown" v="a number with no definition is not shown" />
    </Inspector>
  );

  return (
    <Shell slug={product} page="metrics" title="Metrics" when="all products, last 28 days" inspector={inspector}>
      <div className="tiles">
        {TILES.map(([key, label, target]) => (
          <div className="tile" key={key}>
            <span className="label">{label}</span>
            <div className="big">{totals[key]}</div>
            <div className="target">target {target}</div>
          </div>
        ))}
      </div>

      <div className="tablewrap">
        <table className="data">
          <thead>
            <tr>
              <th>Product</th><th className="n">Replies</th><th className="n">Convos</th>
              <th className="n">Signups</th><th className="n">Paid</th><th className="n">Moves sent</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ p, n }) => (
              <tr key={p}>
                <td>{p}</td>
                <td className="n">{n.replies}</td>
                <td className="n">{n.qualified_convos}</td>
                <td className="n">{n.signups}</td>
                <td className="n">{n.paid}</td>
                <td className="n">{n.moves}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="plain">
        Page views are not tracked here on purpose. They do not predict revenue at this stage.
      </p>

      <div className="hairline" />

      <div>
        <div className="sechead" style={{ marginBottom: 14 }}><span className="label">Streak, last 14 days</span></div>
        {rows.map(({ p, s }) => (
          <div key={p}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderBottom: "1px solid var(--rule)" }}>
              <span className="mono" style={{ minWidth: 96, fontSize: 13 }}>{p}</span>
              <StreakStrip streak={s} />
              <span className="mono" style={{ marginLeft: "auto", fontSize: 13 }}>{s.hit} / {s.weekdays}</span>
            </div>
            {s.failing ? (
              <div className="callout" style={{ margin: "14px 0" }}>
                <span className="label">Kill criterion</span>
                <p>
                  {p} is at {s.hit} of {s.weekdays} weekdays. Under 5 of 10 at day 30 means the habit did not take.
                  Stop building features and make the call. This was written down in advance so it could not be
                  quietly ignored.
                </p>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </Shell>
  );
}
