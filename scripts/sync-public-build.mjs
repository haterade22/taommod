// Copies the public build's special resource files (TAOM for Bannerlord 1.4.8) into src/data/special-resources/public/
// for the Features page. The public build lives on the bannerlord-1.4.5 branch of github.com/haterade22/TAOM; the
// supporter build's files come from the local install through sync-data.sh.
// Usage: node scripts/sync-public-build.mjs [branch]
import fs from 'node:fs';
import path from 'node:path';

const branch = process.argv[2] || 'bannerlord-1.4.5';
const base = `https://raw.githubusercontent.com/haterade22/TAOM/${branch}/Main/_Module/ModuleData`;
const files = [
  'special_resources/special_resources_config.xml',
  'special_resources/troop_resource_costs.xml',
  'elite_emissary/elite_emissary_config.xml',
];
const outDir = path.resolve('src/data/special-resources/public');
fs.mkdirSync(outDir, { recursive: true });

for (const file of files) {
  const response = await fetch(`${base}/${file}`);
  if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
  fs.writeFileSync(path.join(outDir, path.basename(file)), await response.text());
  console.log(`  ${file}`);
}
console.log(`Public build files updated from ${branch}.`);
