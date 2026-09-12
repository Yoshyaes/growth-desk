import Link from "next/link";
import type { ReactNode } from "react";
import { PRODUCTS, abbrev, queuedCount, streak } from "@/lib/data";
import { StreakStrip } from "./StreakStrip";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  ["today", "Today"], ["review", "Review"], ["metrics", "Metrics"],
  ["channels", "Channels"], ["product", "Product"], ["audit", "Audit"]
] as const;

export async function Shell({
  slug, page, title, when, children, inspector
}: {
  slug: string; page: string; title: string; when?: string;
  children: ReactNode; inspector: ReactNode;
}) {
  const counts = await Promise.all(PRODUCTS.map(async (p) => [p, await queuedCount(p)] as const));
  const s = await streak(slug, 14);

  const products = counts.map(([p, n]) => (
    <Link key={p} className={`prod ${p === slug ? "on" : ""}`} href={`/${p}/${page}`}>
      <span>{p}</span>
      <span className="ab">{abbrev(p)}</span>
      <span className="n">{n}</span>
    </Link>
  ));

  return (
    <div className="app">
      <div className="mobilebar">
        {products}
        <span className="spacer" />
        <ThemeToggle />
      </div>

      <div className="rail">
        <div className="wordmark">growth desk</div>
        <div>{products}</div>
        <div className="railrule" />
        <nav className="nav">
          {NAV.map(([k, t]) => (
            <Link key={k} className={k === page ? "on" : ""} href={`/${slug}/${k}`}>{t}</Link>
          ))}
        </nav>
        <div className="railfoot">
          <div className="railrule" style={{ margin: "0 0 16px" }} />
          <div className="label">Weekdays sent</div>
          <div style={{ margin: "10px 0" }}><StreakStrip streak={s} /></div>
          <div className="mono" style={{ fontSize: 13 }}>{s.hit} / {s.weekdays}</div>
          {s.failing ? <div className="chnote" style={{ marginTop: 10 }}>Under half. See the kill criterion.</div> : null}
        </div>
      </div>

      <div className="main">
        <div className="topbar">
          <h1>{title}</h1>
          <div className="when mono">{when ?? ""}</div>
          <div className="right">
            <span className="desktoponly"><ThemeToggle /></span>
          </div>
        </div>
        <div className="scroll">
          <div className="content">{children}</div>
        </div>
      </div>

      {inspector}

      <nav className="mobiletabs">
        {NAV.map(([k, t]) => (
          <Link key={k} className={k === page ? "on" : ""} href={`/${slug}/${k}`}>{t}</Link>
        ))}
      </nav>
    </div>
  );
}
