import { XMLParser } from 'fast-xml-parser';
import fs from 'fs';
import path from 'path';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => ['CraftedItem', 'Piece', 'CraftingPiece', 'Item'].includes(name),
});

const SWING_MULTIPLIER = 25;
const THRUST_MULTIPLIER = 18;

const CULTURE_DISPLAY_NAMES = {
  aserai: 'Harad', khuzait: 'Rhun', battania: 'Khand', empire: 'Dunland',
  vlandia: 'Rohan', sturgia: 'Dale', erebor: 'Erebor', gondor: 'Gondor',
  mordor: 'Mordor', isengard: 'Isengard', gundabad: 'Gundabad',
  mirkwood: 'Mirkwood', rivendell: 'Rivendell', umbar: 'Umbar',
  dolguldur: 'Dol Guldur', thenn: 'Mercenary', iron_hills: 'Iron Hills',
  arnor: 'Arnor', troll: 'Troll', mercenary: 'Mercenary',
  dunland: 'Dunland', dol_guldur: 'Dol Guldur', harad: 'Harad',
  rohan: 'Rohan', rhun: 'Rhun', lothlorien: 'Lothlorien',
};

function stripLocKey(name) {
  if (!name) return '';
  return name.replace(/^\{=[^}]*\}/, '').replace(/^\{\{=[^}]*\}\}/, '');
}

function stripPrefix(val, prefix) {
  if (!val) return '';
  return val.startsWith(prefix) ? val.slice(prefix.length) : val;
}

// Map crafting_template to weapon class category
const TEMPLATE_TO_CLASS = {
  'OneHandedSword': 'OneHandedSword',
  'TwoHandedSword': 'TwoHandedSword',
  'OneHandedAxe': 'OneHandedAxe',
  'TwoHandedAxe': 'TwoHandedAxe',
  'Mace': 'Mace',
  'TwoHandedMace': 'TwoHandedMace',
  'TwoHandedPolearm': 'TwoHandedPolearm',
  'Pike': 'Pike',
  'Javelin': 'Javelin',
  'ThrowingAxe': 'ThrowingAxe',
  'ThrowingKnife': 'ThrowingKnife',
  'OneHandedPolearm': 'OneHandedPolearm',
  'Dagger': 'Dagger',
};

const armoryDir = path.resolve('src/data/armory');

// Parse crafting pieces
function parseCraftingPiecesFromFile(filePath) {
  const map = new Map();
  if (!fs.existsSync(filePath)) return map;
  const xml = fs.readFileSync(filePath, 'utf-8');
  const parsed = parser.parse(xml);
  const pieces = parsed?.CraftingPieces?.CraftingPiece || [];
  for (const piece of pieces) {
    if (piece['@_piece_type'] !== 'Blade') continue;
    const blade = piece.BladeData;
    if (!blade) continue;
    const swing = blade.Swing;
    const thrust = blade.Thrust;
    map.set(piece['@_id'] || '', {
      swingDamageFactor: parseFloat(swing?.['@_damage_factor']) || 0,
      swingDamageType: swing?.['@_damage_type'] || '',
      thrustDamageFactor: parseFloat(thrust?.['@_damage_factor']) || 0,
      thrustDamageType: thrust?.['@_damage_type'] || '',
      length: parseFloat(piece['@_length']) || 0,
      bladeWeight: parseFloat(piece['@_weight']) || 0,
    });
  }
  return map;
}

// Merge blade maps
const bladeMap = new Map();
for (const [k, v] of parseCraftingPiecesFromFile(path.join(armoryDir, 'LOTRLOME_crafting_pieces.xml'))) {
  bladeMap.set(k, v);
}
for (const [k, v] of parseCraftingPiecesFromFile(path.join(armoryDir, 'vanilla_crafting_pieces.xml'))) {
  if (!bladeMap.has(k)) bladeMap.set(k, v);
}

// Parse weapons
const weaponsPath = path.join(armoryDir, 'LOTRAOM_weapons.xml');
const xml = fs.readFileSync(weaponsPath, 'utf-8');
const parsed = parser.parse(xml);

const weapons = [];

// CraftedItem entries
const craftedItems = parsed?.Items?.CraftedItem || [];
for (const item of craftedItems) {
  const pieces = item.Pieces?.Piece || [];
  const bladePiece = pieces.find(p => p['@_Type'] === 'Blade');
  const blade = bladePiece ? bladeMap.get(bladePiece['@_id'] || '') : undefined;

  const swingFactor = blade?.swingDamageFactor || 0;
  const thrustFactor = blade?.thrustDamageFactor || 0;
  const bladeWeight = blade?.bladeWeight || 0;

  const estSwing = (bladeWeight > 0 && swingFactor > 0) ? Math.round(bladeWeight * swingFactor * SWING_MULTIPLIER) : 0;
  const estThrust = (bladeWeight > 0 && thrustFactor > 0) ? Math.round(bladeWeight * thrustFactor * THRUST_MULTIPLIER) : 0;

  const template = item['@_crafting_template'] || '';
  const weaponClass = TEMPLATE_TO_CLASS[template] || template;

  weapons.push({
    id: item['@_id'] || '',
    name: stripLocKey(item['@_name'] || ''),
    culture: stripPrefix(item['@_culture'] || '', 'Culture.'),
    weaponClass,
    type: 'CraftedItem',
    bladeWeight,
    swingDamageFactor: swingFactor,
    thrustDamageFactor: thrustFactor,
    swingDamageType: blade?.swingDamageType || '',
    thrustDamageType: blade?.thrustDamageType || '',
    estimatedSwingDamage: estSwing,
    estimatedThrustDamage: estThrust,
    bladePieceId: bladePiece?.['@_id'] || '',
    bladeFound: !!blade,
  });
}

// Item entries (bows, crossbows, javelins, etc.)
const xmlItems = parsed?.Items?.Item || [];
for (const item of xmlItems) {
  const weapon = item.ItemComponent?.Weapon;
  if (!weapon) continue;
  const wClass = weapon['@_weapon_class'] || '';
  const thrustDmg = parseInt(weapon['@_thrust_damage']) || 0;
  const swingDmg = parseInt(weapon['@_swing_damage']) || 0;

  weapons.push({
    id: item['@_id'] || '',
    name: stripLocKey(item['@_name'] || ''),
    culture: stripPrefix(item['@_culture'] || item['@_Culture'] || '', 'Culture.'),
    weaponClass: wClass,
    type: 'Item',
    bladeWeight: parseFloat(item['@_weight']) || 0,
    swingDamageFactor: 0,
    thrustDamageFactor: 0,
    swingDamageType: weapon['@_swing_damage_type'] || '',
    thrustDamageType: weapon['@_thrust_damage_type'] || '',
    estimatedSwingDamage: swingDmg,
    estimatedThrustDamage: thrustDmg,
    bladePieceId: '',
    bladeFound: false,
  });
}

// Group by culture
const byCulture = {};
for (const w of weapons) {
  const cult = w.culture || 'unknown';
  if (!byCulture[cult]) byCulture[cult] = [];
  byCulture[cult].push(w);
}

// Compute stats
const result = {};

for (const [culture, cultureWeapons] of Object.entries(byCulture)) {
  const displayName = CULTURE_DISPLAY_NAMES[culture] || culture.charAt(0).toUpperCase() + culture.slice(1);

  // Group by weapon class
  const byClass = {};
  for (const w of cultureWeapons) {
    if (!byClass[w.weaponClass]) byClass[w.weaponClass] = [];
    byClass[w.weaponClass].push(w);
  }

  const classStats = {};
  let totalDamageSum = 0;
  let totalDamageCount = 0;

  for (const [wc, wcWeapons] of Object.entries(byClass)) {
    const count = wcWeapons.length;
    const swingDamages = wcWeapons.filter(w => w.estimatedSwingDamage > 0).map(w => w.estimatedSwingDamage);
    const thrustDamages = wcWeapons.filter(w => w.estimatedThrustDamage > 0).map(w => w.estimatedThrustDamage);

    const avgSwing = swingDamages.length > 0 ? Math.round(swingDamages.reduce((a, b) => a + b, 0) / swingDamages.length * 10) / 10 : 0;
    const avgThrust = thrustDamages.length > 0 ? Math.round(thrustDamages.reduce((a, b) => a + b, 0) / thrustDamages.length * 10) / 10 : 0;

    // Best damage = max of swing or thrust for each weapon
    const bestDamages = wcWeapons.map(w => Math.max(w.estimatedSwingDamage, w.estimatedThrustDamage));
    const avgBest = bestDamages.length > 0 ? Math.round(bestDamages.reduce((a, b) => a + b, 0) / bestDamages.length * 10) / 10 : 0;

    classStats[wc] = {
      count,
      avgSwingDamage: avgSwing,
      avgThrustDamage: avgThrust,
      avgBestDamage: avgBest,
      minSwing: swingDamages.length > 0 ? Math.min(...swingDamages) : 0,
      maxSwing: swingDamages.length > 0 ? Math.max(...swingDamages) : 0,
      minThrust: thrustDamages.length > 0 ? Math.min(...thrustDamages) : 0,
      maxThrust: thrustDamages.length > 0 ? Math.max(...thrustDamages) : 0,
    };

    // For overall average, use best damage per weapon
    for (const d of bestDamages) {
      if (d > 0) {
        totalDamageSum += d;
        totalDamageCount++;
      }
    }
  }

  const overallAvgDamage = totalDamageCount > 0 ? Math.round(totalDamageSum / totalDamageCount * 10) / 10 : 0;

  result[displayName] = {
    cultureId: culture,
    totalWeapons: cultureWeapons.length,
    overallAvgDamage,
    weaponClasses: classStats,
    missingBlades: cultureWeapons.filter(w => w.type === 'CraftedItem' && !w.bladeFound).map(w => ({ id: w.id, bladePieceId: w.bladePieceId })),
  };
}

// Sort by culture name
const sorted = Object.fromEntries(
  Object.entries(result).sort(([a], [b]) => a.localeCompare(b))
);

console.log(JSON.stringify(sorted, null, 2));

// Also print a summary table
console.error('\n=== CULTURE WEAPON BALANCE SUMMARY ===\n');
console.error('Culture'.padEnd(15) + 'Weapons'.padEnd(10) + 'AvgDmg'.padEnd(10) + 'Missing Blades');
console.error('-'.repeat(55));
for (const [name, data] of Object.entries(sorted)) {
  console.error(
    name.padEnd(15) +
    String(data.totalWeapons).padEnd(10) +
    String(data.overallAvgDamage).padEnd(10) +
    String(data.missingBlades.length)
  );
}
