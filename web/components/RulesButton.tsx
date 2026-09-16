"use client";

/**
 * Phone only. The inspector is a fixed column on desktop and a sheet here, so
 * the way in has to live in the top bar rather than beside the sheet itself.
 */
export function RulesButton() {
  return (
    <button
      className="btn inspectorbtn"
      type="button"
      onClick={() => document.body.classList.add("sheet-open")}
    >
      Rules
    </button>
  );
}
