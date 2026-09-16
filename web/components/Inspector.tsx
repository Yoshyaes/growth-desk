"use client";

import type { ReactNode } from "react";

export function InspectorRow({ k, v, mono }: { k: string; v: ReactNode; mono?: boolean }) {
  return (
    <div className="irow">
      <div className="k">{k}</div>
      <div className={`v ${mono ? "mono" : ""}`}>{v}</div>
    </div>
  );
}

/**
 * The inspector is the design thesis. The constraints are always on screen.
 *
 * On desktop it is a fixed 320px column that never collapses. On a phone it
 * becomes a sheet, opened from the Rules button in the top bar, which is the
 * smallest change that keeps the rule true on a 390px screen.
 *
 * The open state lives on document.body rather than in React, because the
 * button that opens it sits in the top bar and the sheet sits at the end of
 * the shell. One class on the body is simpler than lifting state across them.
 */
export function Inspector({ children }: { children: ReactNode }) {
  const close = () => document.body.classList.remove("sheet-open");

  return (
    <>
      <aside className="inspector">
        <span className="label">Rules in force</span>
        {children}
      </aside>

      <div className="sheetscrim" onClick={close} aria-hidden="true" />
      <div className="sheet" role="dialog" aria-label="Rules in force">
        <div className="grip" onClick={close} />
        <span className="label">Rules in force</span>
        {children}
      </div>
    </>
  );
}
