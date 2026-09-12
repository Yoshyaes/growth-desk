"use client";

import { useState, useTransition } from "react";
import { updateMove } from "@/lib/actions";

/**
 * The only send affordance in this application.
 *
 * There is no Post button and no Schedule button. Copying is the send step,
 * and a human does the rest by hand. That is the whole ban-avoidance strategy
 * and it is enforced by there being nothing else to click.
 */
export function CopyButton({
  product, moveId, getText, className = "btn primary"
}: {
  product: string;
  moveId: string;
  getText: () => string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function copy() {
    const text = getText();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
    } catch {
      setError("could not reach the clipboard. select the draft and copy it by hand");
      return;
    }

    setCopied(true);
    setError(null);
    start(async () => {
      const r = await updateMove(product, moveId, { state: "copied", draft: text });
      if (!r.ok) setError(r.error ?? "could not record that");
    });
  }

  return (
    <>
      <button
        type="button"
        className={`${className} ${copied ? "copied" : ""}`}
        onClick={copy}
        disabled={pending}
      >
        {copied ? "Copied" : "Copy draft"}
      </button>
      {error ? <span className="savestate failed">{error}</span> : null}
    </>
  );
}
