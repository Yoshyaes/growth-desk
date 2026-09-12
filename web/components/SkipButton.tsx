"use client";

import { useState, useTransition } from "react";
import { updateMove } from "@/lib/actions";

export function SkipButton({ product, moveId, label = "Skip" }: { product: string; moveId: string; label?: string }) {
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      className="btn"
      disabled={pending || done}
      onClick={() =>
        start(async () => {
          const r = await updateMove(product, moveId, { state: "skipped" });
          if (r.ok) setDone(true);
        })
      }
    >
      {done ? "Skipped" : label}
    </button>
  );
}
