import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { GateBadge } from "@/components/GateBadge";
import { Inspector, InspectorRow } from "@/components/Inspector";
import { channels, daysAgo, isProduct, metrics } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Channels({ params }: { params: Promise<{ product: string }> }) {
  const { product } = await params;
  if (!isProduct(product)) notFound();

  const [list, rows] = await Promise.all([channels(product), metrics(product)]);
  const since = daysAgo(6);
  const recent = rows.filter((r) => r.date >= since);

  const inspector = (
    <Inspector>
      <div className="irow"><div className="k">Gate legend</div></div>
      <InspectorRow k="open" v="promotional drafting allowed, subject to the ratio and the cap" />
      <InspectorRow k="restricted" v="helpful replies only, no link, no product name" />
      <InspectorRow k="blocked" v="no copy generated, ever. research only" />
      <InspectorRow k="Fail closed" v="a channel that is not in channels.yml is blocked, not open" />
      <InspectorRow k="Read only" v="channels.yml ships with the deployment. changing a gate takes a pull request" />
    </Inspector>
  );

  return (
    <Shell slug={product} page="channels" title="Channels" when={product} inspector={inspector}>
      <div>
        {list.map((c) => {
          const used = recent.filter((r) => r.channel === c.id).length;
          const cap = c.cadence_cap_per_week ?? 0;
          return (
            <div key={c.id}>
              <div className={`chrow is-${c.gate}`}>
                <span className="id">{c.id}</span>
                <span className="kind">{c.kind}</span>
                <GateBadge state={c.gate} />
                <span className="status">{String(c.status ?? "").replace("_", " ")}</span>
                <span className="cap">
                  <span className="seg">
                    {Array.from({ length: Math.min(cap, 10) }, (_, i) => (
                      <i key={i} className={i < used ? "used" : ""} />
                    ))}
                  </span>
                  <span className="mono" style={{ fontSize: 12, color: "var(--ink-faint)" }}>{used} / {cap}</span>
                  <span className="mono" style={{ fontSize: 12, color: "var(--ink-faint)", minWidth: 44, textAlign: "right" }}>
                    {c.karma_required ?? 0} k
                  </span>
                </span>
              </div>
              {c.gate === "blocked" ? <div className="chnote">{c.gateReason}. Research only.</div> : null}
            </div>
          );
        })}
      </div>
      <p className="plain">
        Nothing is promoted to active until it has been opened and read by a human. Subscriber counts are blank
        because none have been verified, and an unverified number is not cited.
      </p>
    </Shell>
  );
}
