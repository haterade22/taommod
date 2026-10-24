// Makes smaller copies of large site pictures for phones and small screens, next to the originals
// (`name-768w.webp` etc.), and writes src/data/responsive-images.json, which src/lib/responsive-image.ts reads to
// build `srcset` attributes. Browsers pick the smallest copy that is still at least as large as the picture is shown
// (screen pixel density included), so nothing looks softer; large screens keep getting the original.
//
// Run after adding or replacing one of these pictures:  node scripts/make-responsive-images.mjs
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const pub = path.join(root, 'public');

/** Picture (site path) -> widths to make. Widths at or above the original's width are skipped. */
const groups = [
  {
    widths: [768, 1280, 1920],
    files: [
      'factions/map-background',
      'factions/gondor-background',
      'factions/mordor-background',
      'factions/erebor-background',
      'factions/good',
      'factions/evil',
      'factions/background-border',
      'factions/title-text',
      'factions/card-background',
      'factions/card-border',
    ],
  },
  { widths: [768, 1280], files: ['banner-kingdoms', 'banner-factions'] },
  {
    widths: [128, 256],
    files: [
      'factions/gondor',
      'factions/mordor',
      'factions/erebor',
      'factions/imladris',
      'factions/mirkwood',
      'factions/lothlorien',
      'factions/dolguldur',
      'factions/umbar',
      'factions/harad',
      'factions/khand',
      'factions/rhun',
      'factions/isengard',
      'factions/gundabad',
      'factions/rohan',
      'factions/dale',
      'factions/dunland',
      'factions/abanissa',
    ],
  },
  {
    widths: [320],
    files: [
      'database/troops',
      'database/lords',
      'database/armoury',
      'database/weaponry',
      'database/background-watermark',
      'database/background',
      'database/border',
    ],
  },
  { widths: [480, 640], files: ['logo'] },
  { widths: [160, 240], files: ['logo-navbar'] },
];

const manifest = {};
let made = 0;
for (const { widths, files } of groups) {
  for (const name of files) {
    const source = path.join(pub, 'images', `${name}.webp`);
    if (!fs.existsSync(source)) continue;
    const meta = await sharp(source).metadata();
    const variants = [];
    for (const width of widths.filter((w) => w < meta.width * 0.95)) {
      const target = path.join(pub, 'images', `${name}-${width}w.webp`);
      if (!fs.existsSync(target) || fs.statSync(target).mtimeMs < fs.statSync(source).mtimeMs) {
        await sharp(source)
          .resize({ width })
          .webp(meta.hasAlpha ? { quality: 90, alphaQuality: 95, effort: 6 } : { quality: 90, effort: 6 })
          .toFile(target);
        made++;
      }
      variants.push(width);
    }
    if (variants.length) manifest[`/images/${name}.webp`] = { width: meta.width, variants };
  }
}

const out = path.join(root, 'src', 'data', 'responsive-images.json');
fs.writeFileSync(out, JSON.stringify(manifest, null, 2) + '\n');
console.log(`${Object.keys(manifest).length} pictures, ${made} copies made`);
