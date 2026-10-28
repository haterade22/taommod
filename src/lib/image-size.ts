/**
 * The pixel size of a picture in public/, read from the file's header at build time, so <img> tags can carry
 * width and height (the browser then keeps the picture's space while it loads, and the page does not jump).
 * Handles WebP (lossy, lossless, extended), PNG and JPEG.
 */
import fs from 'node:fs';
import path from 'node:path';

const cache = new Map<string, { width: number; height: number } | null>();

export function imageSize(publicPath: string): { width: number; height: number } | null {
  if (cache.has(publicPath)) return cache.get(publicPath)!;
  let size: { width: number; height: number } | null = null;
  try {
    const b = fs.readFileSync(path.join(process.cwd(), 'public', publicPath.split('?')[0]));
    if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
      const chunk = b.toString('ascii', 12, 16);
      if (chunk === 'VP8 ') size = { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
      else if (chunk === 'VP8L') {
        const bits = b.readUInt32LE(21);
        size = { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
      } else if (chunk === 'VP8X') size = { width: b.readUIntLE(24, 3) + 1, height: b.readUIntLE(27, 3) + 1 };
    } else if (b.readUInt32BE(0) === 0x89504e47) {
      size = { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
    } else if (b[0] === 0xff && b[1] === 0xd8) {
      let i = 2;
      while (i < b.length) {
        const marker = b[i + 1];
        const len = b.readUInt16BE(i + 2);
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          size = { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) };
          break;
        }
        i += 2 + len;
      }
    }
  } catch {
    size = null;
  }
  cache.set(publicPath, size);
  return size;
}

/** `{ width, height }` to spread onto an <img>, or nothing if the file cannot be read. */
export const sizeAttrs = (publicPath: string) => imageSize(publicPath) ?? {};
