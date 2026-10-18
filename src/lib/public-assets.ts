import { existsSync } from 'node:fs';
import path from 'node:path';

// Builds run from the project root.
const publicDirectory = path.join(process.cwd(), 'public');

/** Returns `src` if that file exists in public/, otherwise undefined (so pages skip missing images). */
export function existingPublicAsset(src: string | undefined): string | undefined {
  if (!src) return undefined;
  return existsSync(path.join(publicDirectory, decodeURIComponent(src))) ? src : undefined;
}
