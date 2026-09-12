"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { lintDraft, updateMove } from "@/lib/actions";
import type { LintResult, Move } from "@/types/core";
import { CopyButton } from "./CopyButton";
import { SkipButton } from "./SkipButton";

/**
 * The draft editor.
 *
 * Two behaviors worth knowing about.
 *
 *   1. Autosave is debounced to 800ms because every save is a real git commit.
 *      The save state is shown, never guessed at.
 *   2. The lint is advisory. It never blocks a copy. A rule you cannot
 *      override becomes a rule you route around, and the point is to notice
 *      the colon, not to be stopped by it.
 */
export function DraftEditor({
  product, move, initialLint
}: { product: string; move: Move; initialLint: LintResult }) {
  const [text, setText] = useState(move.draft);
  const [lint, setLint] = useState(initialLint);
  const [save, setSave] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [conflict, setConflict] = useState<string | null>(null);
  const [, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((value: string) => {
    start(async () => {
      setSave("saving");
      const [lintResult, saved] = await Promise.all([
        lintDraft(value),
        updateMove(product, move.id, { draft: value })
      ]);
      setLint(lintResult);
      if (saved.ok) { setSave("saved"); setConflict(null); }
      else if (saved.conflict) { setSave("failed"); setConflict(saved.error ?? null); }
      else { setSave("failed"); }
    });
  }, [product, move.id]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function onChange(value: string) {
    setText(value);
    setSave("idle");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => run(value), 800);
  }

  const saveLabel = { idle: "", saving: "saving", saved: "saved", failed: "not saved" }[save];

  return (
    <>
      {conflict ? <div className="conflict">{conflict}</div> : null}

      <div>
        <div className="sechead" style={{ marginBottom: 10 }}>
          <span className="label">Draft</span>
          <span className="mono" style={{ fontSize: 12, color: "var(--ink-faint)", marginLeft: "auto" }}>
            {text.length} characters
          </span>
          <span className={`savestate ${save}`}>{saveLabel}</span>
        </div>
        <textarea
          id="draft"
          className="editor"
          value={text}
          spellCheck
          onChange={(e) => onChange(e.target.value)}
          aria-label={`Draft for ${move.id}`}
        />
      </div>

      <div>
        <div className="sechead" style={{ marginBottom: 6 }}>
          <span className="label">Voice lint</span>
          <span className="plain" style={{ marginLeft: "auto" }}>advisory, never blocking</span>
        </div>
        <div className="lint">
          {lint.summary.map((s) => {
            const first = lint.hits.find((h) => h.rule === s.rule);
            return (
              <div key={s.rule} className={`lintrow ${s.count ? "hit" : ""}`}>
                <span className="dot" />
                <span>{s.label}</span>
                <span className="count">{s.count}{s.total ? ` of ${s.total}` : ""}</span>
                <span className="ctx">{first?.context ?? ""}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="stickyactions">
        <CopyButton product={product} moveId={move.id} getText={() => text} />
        <SkipButton product={product} moveId={move.id} label="Skip today" />
        <span className="plain">There is no Post button. Copying is the send step.</span>
      </div>
    </>
  );
}
