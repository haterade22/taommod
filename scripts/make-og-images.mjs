// Makes the 1200x630 link-preview pictures (Discord, social sites) for faction pages in public/images/og/, from
// each faction's hero art. Most are cropped from the middle; pictures whose subject would be cut off are fitted
// whole onto the site's dark background, or cropped from the top.
// Usage: node scripts/make-og-images.mjs [path-to-ffmpeg]   (default: ffmpeg on PATH)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ffmpeg = process.argv[2] || 'ffmpeg';
const pub = path.resolve('public/images');
const outDir = path.join(pub, 'og');
fs.mkdirSync(outDir, { recursive: true });

// Hero art used by src/pages/factions/[id].astro (HERO_IMAGES) and how to frame it.
const FIT = new Set(['gondor_web_ready', 'faction-mirkwood']); // whole picture on dark background
const TOP = new Set(['faction-rivendell']); // crop from the top (keeps the helmets)
const sources = [
  'faction-dolguldur',
  'faction-dunland',
  'faction-erebor',
  'faction-gundabad',
  'faction-harad',
  'faction-isengard',
  'faction-mirkwood',
  'faction-mordor',
  'faction-rhun',
  'faction-rivendell',
  'faction-rohan',
  'gondor_web_ready',
];

for (const name of sources) {
  const filter = FIT.has(name)
    ? 'scale=1200:630:force_original_aspect_ratio=decrease:flags=lanczos,pad=1200:630:(ow-iw)/2:(oh-ih)/2:color=0x0d0908'
    : `scale=1200:630:force_original_aspect_ratio=increase:flags=lanczos,crop=1200:630${TOP.has(name) ? ':0:0' : ''}`;
  execFileSync(ffmpeg, [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    path.join(pub, `${name}.webp`),
    '-vf',
    filter,
    '-q:v',
    '3',
    path.join(outDir, `${name}.jpg`),
  ]);
  console.log(`  og/${name}.jpg`);
}
