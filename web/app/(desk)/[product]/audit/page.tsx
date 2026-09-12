import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { Inspector, InspectorRow } from "@/components/Inspector";
import { isProduct } from "@/lib/data";

export default async function Audit({ params }: { params: Promise<{ product: string }> }) {
  const { product } = await params;
  if (!isProduct(product)) notFound();

  const inspector = (
    <Inspector>
      <InspectorRow k="Phase" v="E" />
      <InspectorRow k="Blocked on" v="phases A to D" />
      <InspectorRow k="Never merges" v="the app opens a pull request. a human merges it" />
    </Inspector>
  );

  return (
    <Shell slug={product} page="audit" title="Audit" when="not built yet" inspector={inspector}>
      <div className="empty">
        <h2>Audit is Phase E.</h2>
        <p>
          The rubric, the prioritized diff and the pull request flow are specified in the development plan and
          drawn in the Landing Audit mockup. Phases A to D ship first.
        </p>
        <Link className="btn" href={`/${product}/today`}>Back to today</Link>
      </div>
      <p className="plain">
        When it lands, the audit scores seven rubric questions, returns a prioritized diff, and opens a pull
        request against the product&rsquo;s own repo. It will never merge, for the same reason this app never posts.
      </p>
    </Shell>
  );
}
