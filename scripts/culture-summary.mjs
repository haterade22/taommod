#!/usr/bin/env node
// Quick culture summary with proper TAOM culture mapping
import { execSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raw = execSync(`node "${join(__dirname, 'tw-damage-calc.mjs')}"`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
const weapons = JSON.parse(raw);

const MAP = { vlandia: 'rohan', empire: 'dunland', aserai: 'harad', khuzait: 'rhun' };
const byCulture = {};
for (const w of weapons) {
  let c = w.culture || 'unknown';
  c = MAP[c] || c;
  if (!byCulture[c]) byCulture[c] = { sw: [], th: [], sp: [], n: 0 };
  byCulture[c].n++;
  if (w.swingDamage > 0) byCulture[c].sw.push(w.swingDamage);
  if (w.thrustDamage > 0) byCulture[c].th.push(w.thrustDamage);
  if (w.swingSpeed > 0) byCulture[c].sp.push(w.swingSpeed);
  else if (w.thrustSpeed > 0) byCulture[c].sp.push(w.thrustSpeed);
}
const avg = a => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0;
const entries = Object.entries(byCulture).map(([c, d]) => ({
  culture: c, count: d.n,
  avgSwing: avg(d.sw), avgThrust: avg(d.th),
  avgMelee: avg([...d.sw, ...d.th]),
  avgSpeed: avg(d.sp),
})).sort((a, b) => b.avgMelee - a.avgMelee);

const gondor = entries.find(e => e.culture === 'gondor');
const base = gondor ? gondor.avgMelee : 65;

console.log('Culture'.padEnd(16) + 'Count'.padStart(6) + 'AvgSwing'.padStart(10) + 'AvgThrust'.padStart(10) + 'AvgMelee'.padStart(10) + 'AvgSpeed'.padStart(10) + 'Pct'.padStart(6));
console.log('-'.repeat(68));
for (const e of entries) {
  const pct = Math.round(e.avgMelee / base * 100);
  console.log(
    e.culture.padEnd(16) +
    String(e.count).padStart(6) +
    String(e.avgSwing).padStart(10) +
    String(e.avgThrust).padStart(10) +
    String(e.avgMelee).padStart(10) +
    String(e.avgSpeed).padStart(10) +
    (pct + '%').padStart(6)
  );
}
