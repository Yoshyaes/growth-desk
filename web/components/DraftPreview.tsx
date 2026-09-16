/**
 * The card shows a preview, not the draft.
 *
 * Blank lines are collapsed so the line clamp counts real lines of text.
 * Keeping the paragraph breaks made the clamp land on an empty line and bleed
 * a half-rendered line underneath it. The clamp sits on the inner span rather
 * than the padded box, for the same reason, since clamping the padded element
 * lets the next line show through in the padding.
 *
 * The true text, breaks and all, is what gets copied and what the editor shows.
 */
export function preview(draft: string) {
  return String(draft ?? "").replace(/\s*\n\s*/g, " ").replace(/\s{2,}/g, " ").trim();
}

export function DraftPreview({ text }: { text: string }) {
  return (
    <div className="draft">
      <span>{preview(text)}</span>
    </div>
  );
}
