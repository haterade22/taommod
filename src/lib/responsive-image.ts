/**
 * `srcset` for pictures that have smaller copies (made by scripts/make-responsive-images.mjs and listed in
 * src/data/responsive-images.json). Returns undefined for any other picture, so callers can always pass the result.
 */
import manifest from '../data/responsive-images.json';

type Entry = { width: number; variants: number[] };
const entries = manifest as Record<string, Entry>;

export function srcsetFor(src: string | undefined): string | undefined {
  if (!src) return undefined;
  const entry = entries[src];
  if (!entry) return undefined;
  const base = src.replace(/\.webp$/, '');
  return [...entry.variants.map((w) => `${base}-${w}w.webp ${w}w`), `${src} ${entry.width}w`].join(', ');
}
