"use client";

import { useState, type ReactNode } from "react";

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
 * becomes a sheet one tap from any draft, which is the smallest change that
 * keeps the rule true on a 390px screen.
 */
export function Inspector({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  function toggle(next: boolean) {
    setOpen(next);
    document.body.classList.toggle("sheet-open", next);
  }

  return (
    <>
      <aside className="inspector">
        <span className="label">Rules in force</span>
        {children}
      </aside>

      <button className="btn inspectorbtn" type="button" onClick={() => toggle(true)} aria-expanded={open}>
        Rules
      </button>

      <div className="sheetscrim" onClick={() => toggle(false)} aria-hidden="true" />
      <div className="sheet" role="dialog" aria-label="Rules in force" aria-modal={open}>
        <div className="grip" />
        <span className="label">Rules in force</span>
        {children}
      </div>
    </>
  );
}
