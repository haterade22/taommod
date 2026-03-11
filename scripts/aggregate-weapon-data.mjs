#!/usr/bin/env node
// Aggregates weapon damage data by culture from tw-damage-calc.mjs output
import { execSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raw = execSync(`node "${join(__dirname, 'tw-damage-calc.mjs')}"`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
const weapons = JSON.parse(raw);

const byCulture = {};
for (const w of weapons) {
  const c = w.culture || 'unknown';
  if (!byCulture[c]) byCulture[c] = { weapons: [], swingDmgs: [], thrustDmgs: [], speeds: [] };
  byCulture[c].weapons.push(w);
  if (w.swingDamage > 0) byCulture[c].swingDmgs.push(w.swingDamage);
  if (w.thrustDamage > 0) byCulture[c].thrustDmgs.push(w.thrustDamage);
  if (w.swingSpeed > 0) byCulture[c].speeds.push(w.swingSpeed);
  else if (w.thrustSpeed > 0) byCulture[c].speeds.push(w.thrustSpeed);
}

const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

const summary = {};
for (const [culture, data] of Object.entries(byCulture)) {
  const avgSwing = avg(data.swingDmgs);
  const avgThrust = avg(data.thrustDmgs);
  const avgMelee = avg([...data.swingDmgs, ...data.thrustDmgs]);
  const avgSpeed = avg(data.speeds);
  summary[culture] = {
    count: data.weapons.length,
    avgSwing,
    avgThrust,
    avgMelee,
    avgSpeed,
    weapons: data.weapons.map(w => ({
      id: w.id,
      name: w.name,
      template: w.template,
      swing: w.swingDamage,
      thrust: w.thrustDamage,
      swingSpeed: w.swingSpeed,
      thrustSpeed: w.thrustSpeed,
      weight: w.weight
    }))
  };
}

// Print summary table
console.log('\n=== Per-Culture Weapon Damage Summary (Full Physics) ===\n');
console.log('Culture'.padEnd(20) + 'Count'.padStart(6) + 'AvgSwing'.padStart(10) + 'AvgThrust'.padStart(10) + 'AvgMelee'.padStart(10) + 'AvgSpeed'.padStart(10));
console.log('-'.repeat(66));

const sorted = Object.entries(summary).sort((a, b) => b[1].avgMelee - a[1].avgMelee);
for (const [culture, s] of sorted) {
  console.log(
    culture.padEnd(20) +
    String(s.count).padStart(6) +
    String(s.avgSwing).padStart(10) +
    String(s.avgThrust).padStart(10) +
    String(s.avgMelee).padStart(10) +
    String(s.avgSpeed).padStart(10)
  );
}

// Also output as JSON for easy consumption
const jsonOut = join(__dirname, 'weapon-culture-data.json');
import('fs').then(fs => {
  fs.writeFileSync(jsonOut, JSON.stringify(summary, null, 2));
  console.log(`\nJSON written to ${jsonOut}`);
});
