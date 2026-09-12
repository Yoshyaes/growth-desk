import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { Inspector, InspectorRow } from "@/components/Inspector";
import { claims, docGaps, isProduct } from "@/lib/data";

export const dynamic = "force-dynamic";

const FILES = ["icp", "voice", "offers", "proof", "ethics", "learnings"] as const;

export default async function ProductDoc({
  params
}: { params: Promise<{ product: string; file?: string[] }> }) {
  const { product, file } = await params;
  if (!isProduct(product)) notFound();

  const name = (file?.[0] && (FILES as readonly string[]).includes(file[0]) ? file[0] : "proof") as string;
  const [list, gaps] = await Promise.all([claims(product, name), docGaps(product, name)]);

  const counts = list.reduce<Record<string, number>>((a, c) => {
    a[c.tag] = (a[c.tag] ?? 0) + 1;
    return a;
  }, {});

  const inspector = (
    <Inspector>
      <InspectorRow k="Source" v={`products/${product}/${name}.md`} mono />
      <InspectorRow k="verified" v="evidenced, citable in a draft" />
      <InspectorRow k="assumed" v="a hypothesis. belongs in the test backlog" />
      <InspectorRow k="The verbatim rule" v="if it cannot be quoted, it is not proof" />
      <InspectorRow k="Drafts may cite" v="proof.md only" />
      <InspectorRow k="Read only" v="this file ships with the deployment. editing it takes a pull request" />
    </Inspector>
  );

  return (
    <Shell slug={product} page="product" title="Product" when={`${product} / ${name}`} inspector={inspector}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {FILES.map((f) => (
          <Link key={f} className={`btn ${f === name ? "primary" : ""}`} href={`/${product}/product/${f}`}>{f}</Link>
        ))}
      </div>

      <div className="sechead">
        <span className="label">{name}.md</span>
        <span className="mono" style={{ fontSize: 12, color: "var(--ink-faint)" }}>
          {counts.verified ?? 0} verified, {counts.assumed ?? 0} assumed
        </span>
      </div>

      <div>
        {list.length ? list.map((c, i) => (
          <div className="claim" key={`${c.tag}-${i}`}>
            <span className={`tag ${c.tag}`}>{c.tag}</span>
            <span className="txt">{c.text}</span>
          </div>
        )) : <p className="plain">No tagged claims in this file.</p>}
      </div>

      {gaps.map((g) => (
        <div className="callout" key={g.heading}>
          <span className="label">{g.heading}</span>
          <p>{g.text}</p>
        </div>
      ))}
    </Shell>
  );
}
