/**
 * Search results show about 155 characters of a page description; longer ones are cut mid-sentence. This keeps whole
 * sentences that fit, or else cuts at a word and adds an ellipsis.
 */
export function metaDescription(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;

  // Whole sentences that fit (at least half the room, so a tiny first sentence does not leave it nearly empty).
  const sentences = clean.match(/[^.!?]+[.!?]+(?=\s|$)/g) ?? [];
  let kept = '';
  for (const sentence of sentences) {
    const next = (kept + sentence).trim();
    if (next.length > max) break;
    kept = next + ' ';
  }
  kept = kept.trim();
  if (kept.length >= max / 2) return kept;

  // Otherwise cut at the last word that fits and add an ellipsis.
  const cut = clean.slice(0, max - 1);
  const atWord = cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:—–-]+$/, '');
  return `${atWord}…`;
}
