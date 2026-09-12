"use client";

/**
 * Draft copy renders in mono on purpose. It signals raw text about to be
 * pasted into someone else's textarea, not designed content.
 */
export function DraftText({ text }: { text: string }) {
  return <pre className="draft">{text}</pre>;
}
