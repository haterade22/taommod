/**
 * Full TaleWorlds damage calculation — replicates the exact physics pipeline
 * from decompiled v1.3.12 CombatStatCalculator + Crafting.CraftingStats
 */
import { XMLParser } from 'fast-xml-parser';
import fs from 'fs';
import path from 'path';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => ['CraftedItem', 'Piece', 'CraftingPiece', 'Item', 'CraftingTemplate', 'PieceData', 'WeaponFlag'].includes(name),
});

const GAME_DIR = 'E:/Steam/steamapps/common/Mount & Blade II Bannerlord';
const armoryDir = path.resolve('src/data/armory');

// ── Parse crafting pieces (all properties needed) ──
function parseCraftingPieces(filePath) {
  const map = new Map();
  if (!fs.existsSync(filePath)) return map;
  const xml = fs.readFileSync(filePath, 'utf-8');
  const parsed = parser.parse(xml);
  const pieces = parsed?.CraftingPieces?.CraftingPiece || [];
  for (const piece of pieces) {
    const id = piece['@_id'] || '';
    const pieceType = piece['@_piece_type'] || '';
    const lengthCm = parseFloat(piece['@_length']) || 0;
    const length = lengthCm * 0.01; // Convert cm to meters
    const weight = parseFloat(piece['@_weight']) || 0;
    const fullScale = piece['@_full_scale'] === 'true' ||
      pieceType === 'Guard' || pieceType === 'Pommel';

    // CenterOfMass: from XML attribute or default 0.5
    const comFactor = parseFloat(piece['@_center_of_mass']) || 0.5;
    const centerOfMass = length * comFactor;

    // Inertia: uniform rod formula (1/12 * m * L^2)
    const inertia = (1 / 12) * weight * length * length;

    // Distance to next/previous piece
    let distToNext, distToPrev;
    if (lengthCm > 0) {
      distToNext = length / 2;
      distToPrev = length / 2;
    } else {
      distToNext = (parseFloat(piece['@_distance_to_next_piece']) || 0) * 0.01;
      distToPrev = (parseFloat(piece['@_distance_to_previous_piece']) || 0) * 0.01;
    }

    // Piece offset from BuildData
    const buildData = piece.BuildData;
    const pieceOffset = (parseFloat(buildData?.['@_piece_offset']) || 0) * 0.01;
    const prevPieceOffset = (parseFloat(buildData?.['@_previous_piece_offset']) || 0) * 0.01;
    const nextPieceOffset = (parseFloat(buildData?.['@_next_piece_offset']) || 0) * 0.01;

    // Blade data
    let bladeData = null;
    if (pieceType === 'Blade' && piece.BladeData) {
      const bd = piece.BladeData;
      bladeData = {
        swingDamageFactor: parseFloat(bd.Swing?.['@_damage_factor']) || 0,
        swingDamageType: bd.Swing?.['@_damage_type'] || '',
        thrustDamageFactor: parseFloat(bd.Thrust?.['@_damage_factor']) || 0,
        thrustDamageType: bd.Thrust?.['@_damage_type'] || '',
        bladeLength: (parseFloat(piece['@_blade_length']) || lengthCm) * 0.01,
        physicsMaterial: bd['@_physics_material'] || '',
        stackAmount: parseInt(bd['@_stack_amount']) || 1,
      };
    }

    map.set(id, {
      id,
      pieceType,
      weight,
      length,
      centerOfMass,
      inertia,
      fullScale,
      distToNext,
      distToPrev,
      pieceOffset,
      prevPieceOffset,
      nextPieceOffset,
      bladeData,
    });
  }
  return map;
}

// ── Build order per template type ──
// From Native/ModuleData/crafting_templates.xml
// build_order: positive = forward from grip, negative = backward from grip
const TEMPLATE_BUILD_ORDERS = {
  OneHandedSword: [
    { pieceType: 'Handle', order: 0 },
    { pieceType: 'Guard', order: 1 },
    { pieceType: 'Blade', order: 2 },
    { pieceType: 'Pommel', order: -1 },
  ],
  TwoHandedSword: [
    { pieceType: 'Handle', order: 0 },
    { pieceType: 'Guard', order: 1 },
    { pieceType: 'Blade', order: 2 },
    { pieceType: 'Pommel', order: -1 },
  ],
  OneHandedAxe: [
    { pieceType: 'Handle', order: 0 },
    { pieceType: 'Blade', order: 1 },
    { pieceType: 'Pommel', order: -1 },
  ],
  TwoHandedAxe: [
    { pieceType: 'Handle', order: 0 },
    { pieceType: 'Blade', order: 1 },
    { pieceType: 'Pommel', order: -1 },
  ],
  Mace: [
    { pieceType: 'Handle', order: 0 },
    { pieceType: 'Blade', order: 1 },
    { pieceType: 'Pommel', order: -1 },
  ],
  TwoHandedMace: [
    { pieceType: 'Handle', order: 0 },
    { pieceType: 'Blade', order: 1 },
    { pieceType: 'Pommel', order: -1 },
  ],
  TwoHandedPolearm: [
    { pieceType: 'Handle', order: 0 },
    { pieceType: 'Blade', order: 1 },
    { pieceType: 'Pommel', order: -1 },
  ],
  Pike: [
    { pieceType: 'Handle', order: 0 },
    { pieceType: 'Blade', order: 1 },
    { pieceType: 'Pommel', order: -1 },
  ],
  Javelin: [
    { pieceType: 'Handle', order: 0 },
    { pieceType: 'Blade', order: 1 },
    { pieceType: 'Pommel', order: -1 },
  ],
  ThrowingAxe: [
    { pieceType: 'Handle', order: 0 },
    { pieceType: 'Blade', order: 1 },
    { pieceType: 'Pommel', order: -1 },
  ],
  Dagger: [
    { pieceType: 'Handle', order: 0 },
    { pieceType: 'Guard', order: 1 },
    { pieceType: 'Blade', order: 2 },
    { pieceType: 'Pommel', order: -1 },
  ],
  OneHandedPolearm: [
    { pieceType: 'Handle', order: 0 },
    { pieceType: 'Blade', order: 1 },
    { pieceType: 'Pommel', order: -1 },
  ],
};

// Weapon flags per template (default, used when no description resolution available)
const TEMPLATE_FLAGS = {
  OneHandedSword: { meleeWeapon: true, notUsableWithOneHand: false, wideGrip: false },
  TwoHandedSword: { meleeWeapon: true, notUsableWithOneHand: true, wideGrip: false },
  OneHandedAxe: { meleeWeapon: true, notUsableWithOneHand: false, wideGrip: false },
  TwoHandedAxe: { meleeWeapon: true, notUsableWithOneHand: true, wideGrip: false },
  Mace: { meleeWeapon: true, notUsableWithOneHand: false, wideGrip: false },
  TwoHandedMace: { meleeWeapon: true, notUsableWithOneHand: true, wideGrip: false },
  TwoHandedPolearm: { meleeWeapon: true, notUsableWithOneHand: true, wideGrip: true },
  Pike: { meleeWeapon: true, notUsableWithOneHand: true, wideGrip: true },
  Javelin: { meleeWeapon: true, notUsableWithOneHand: false, wideGrip: false },
  ThrowingAxe: { meleeWeapon: true, notUsableWithOneHand: false, wideGrip: false },
  Dagger: { meleeWeapon: true, notUsableWithOneHand: false, wideGrip: false },
  OneHandedPolearm: { meleeWeapon: true, notUsableWithOneHand: false, wideGrip: false },
};

// Per-description flags (from weapon_descriptions.xml)
const DESCRIPTION_FLAGS = {
  OneHandedSword:                    { meleeWeapon: true, notUsableWithOneHand: false, wideGrip: false },
  OneHandedBastardSword:             { meleeWeapon: true, notUsableWithOneHand: false, wideGrip: false },
  OneHandedBastardSwordAlternative:  { meleeWeapon: true, notUsableWithOneHand: false, wideGrip: false },
  TwoHandedSword:                    { meleeWeapon: true, notUsableWithOneHand: true,  wideGrip: false },
  TwoHandedPolearm:                  { meleeWeapon: true, notUsableWithOneHand: true,  wideGrip: true  },
  TwoHandedPolearm_Couchable:        { meleeWeapon: true, notUsableWithOneHand: true,  wideGrip: true  },
  TwoHandedPolearm_Bracing:          { meleeWeapon: true, notUsableWithOneHand: true,  wideGrip: true  },
  TwoHandedPolearm_Pike:             { meleeWeapon: true, notUsableWithOneHand: true,  wideGrip: true  },
};

// Ordered weapon descriptions per crafting template
const TEMPLATE_DESCRIPTIONS = {
  TwoHandedSword: ['OneHandedBastardSword', 'TwoHandedSword', 'OneHandedBastardSwordAlternative'],
};

// Parse weapon_descriptions.xslt to get per-description available piece sets
function parseWeaponDescriptionsXslt() {
  const xsltPath = path.join(armoryDir, 'weapon_descriptions.xslt');
  if (!fs.existsSync(xsltPath)) return new Map();
  const xslt = fs.readFileSync(xsltPath, 'utf-8');
  const descPieces = new Map();
  const templateRegex = /xsl:template\s+match="WeaponDescription\[@id='([^']+)'\]\/AvailablePieces">([\s\S]*?)<\/xsl:template>/g;
  let match;
  while ((match = templateRegex.exec(xslt)) !== null) {
    const descId = match[1];
    const body = match[2];
    const pieceSet = new Set();
    const pieceRegex = /AvailablePiece\s+id="([^"]+)"/g;
    let pieceMatch;
    while ((pieceMatch = pieceRegex.exec(body)) !== null) {
      pieceSet.add(pieceMatch[1]);
    }
    descPieces.set(descId, pieceSet);
  }
  return descPieces;
}

function resolvePrimaryFlags(template, pieceIds, descPieces) {
  const descriptions = TEMPLATE_DESCRIPTIONS[template];
  if (!descriptions) return null;
  for (const descId of descriptions) {
    const available = descPieces.get(descId);
    if (!available) continue;
    if (pieceIds.every(pid => available.has(pid))) {
      return DESCRIPTION_FLAGS[descId] || null;
    }
  }
  return null;
}

const descPieces = parseWeaponDescriptionsXslt();

// ── Physics simulation (exact TaleWorlds code) ──

function simulateSwingLayer(weaponReach, wideGrip, angleSpan, usablePower, maxUsableTorque, inertia) {
  let angle = 0;
  let speed = 0.01;
  let time = 0;
  const dragCoeff = 3.9 * weaponReach * (wideGrip ? 1.0 : 0.3);
  while (angle < angleSpan) {
    let torque = usablePower / speed;
    if (torque > maxUsableTorque) torque = maxUsableTorque;
    torque -= speed * dragCoeff;
    const accel = 0.009999999776482582 * torque / inertia;
    speed += accel;
    angle += speed * 0.009999999776482582;
    time += 0.009999999776482582;
  }
  return { finalSpeed: speed, finalTime: time };
}

function simulateThrustLayer(distance, usablePower, maxUsableForce, mass) {
  let pos = 0;
  let speed = 0.01;
  let time = 0;
  while (pos < distance) {
    let force = usablePower / speed;
    if (force > maxUsableForce) force = maxUsableForce;
    const accel = 0.01 * force / mass;
    speed += accel;
    pos += speed * 0.01;
    time += 0.01;
  }
  return { finalSpeed: speed, finalTime: time };
}

function calculateSwingSpeed(weaponReach, weaponWeight, weaponInertia, weaponCenterOfMass, flags) {
  const inertiaAroundShoulder = weaponInertia + weaponWeight * (0.5 + weaponCenterOfMass) * (0.5 + weaponCenterOfMass);

  let stoppingTorque = 10;
  let armInertia = 2.9;
  const isTwoHanded = flags.meleeWeapon && flags.notUsableWithOneHand;
  const isWideGrip = flags.wideGrip;

  if (isTwoHanded) {
    stoppingTorque *= 1.5;
    armInertia *= 1.4;
  }
  if (isWideGrip) {
    stoppingTorque *= 1.5;
    armInertia *= 1.4;
  }

  let I = 1.0 * inertiaAroundShoulder + 0.9;
  let power1 = 170;
  let power2 = 90;
  let torque1 = 27;
  let torque2 = 15;
  let torque3 = 7;

  if (isTwoHanded) {
    if (isWideGrip) {
      I += 1.5;
      torque3 *= 4.0;
      torque2 *= 1.7;
      power2 *= 1.3;
      power1 *= 1.15;
    } else {
      I += 1.0;
      torque3 *= 2.4;
      torque2 *= 1.3;
      power2 *= 1.35;
      power1 *= 1.15;
    }
  }

  torque1 = Math.max(1.0, torque1 - I);
  torque2 = Math.max(1.0, torque2 - I);
  torque3 = Math.max(1.0, torque3 - I);

  const { finalTime: t1 } = simulateSwingLayer(weaponReach, isWideGrip, 1.5, 200, torque1, 2.0 + I);
  const { finalTime: t2 } = simulateSwingLayer(weaponReach, isWideGrip, 1.5, power1, torque2, 1.0 + I);
  const { finalTime: t3 } = simulateSwingLayer(weaponReach, isWideGrip, 1.5, power2, torque3, 0.5 + I);

  const avgTime = 0.33 * (t1 + t2 + t3);
  return 20.8 / avgTime;
}

function calculateThrustSpeed(weaponWeight, weaponInertia, weaponCenterOfMass, flags) {
  const inertiaAroundGrip = weaponInertia + weaponWeight * weaponCenterOfMass * weaponCenterOfMass;

  let mass = 1.8 + weaponWeight + inertiaAroundGrip * 0.2;
  let power1 = 170;
  let power2 = 90;
  let force1 = 24;
  let force2 = 15;

  const isTwoHanded = flags.meleeWeapon && flags.notUsableWithOneHand;
  const isWideGrip = flags.wideGrip;

  if (isTwoHanded && !isWideGrip) {
    mass += 0.6;
    force2 *= 1.9;
    force1 *= 1.1;
    power2 *= 1.2;
    power1 *= 1.05;
  } else if (isTwoHanded && isWideGrip) {
    mass += 0.9;
    force2 *= 2.1;
    force1 *= 1.2;
    power2 *= 1.2;
    power1 *= 1.05;
  }

  const { finalTime: t1 } = simulateThrustLayer(0.6, 250, 48, 4.0 + mass);
  const { finalTime: t2 } = simulateThrustLayer(0.6, power1, force1, 2.0 + mass);
  const { finalTime: t3 } = simulateThrustLayer(0.6, power2, force2, 0.5 + mass);

  const avgTime = 0.33 * (t1 + t2 + t3);
  return 3.8500000000000005 / avgTime;
}

// Strike magnitude for swing (energy transfer)
function calculateStrikeMagnitudeForSwing(swingSpeed, impactPoint, weaponWeight, weaponLength, weaponInertia, weaponCoM, extraLinearSpeed) {
  const r = weaponLength * impactPoint - weaponCoM;
  const vLinear = swingSpeed * (0.5 + weaponCoM) + extraLinearSpeed;
  const keLinear = 0.5 * weaponWeight * vLinear * vLinear;
  const keRotational = 0.5 * weaponInertia * swingSpeed * swingSpeed;
  const totalKE = keLinear + keRotational;

  const impulse = (vLinear + swingSpeed * r) / (1.0 / weaponWeight + r * r / weaponInertia);
  const vAfter = vLinear - impulse / weaponWeight;
  const wAfter = swingSpeed - impulse * r / weaponInertia;
  const keAfterLinear = 0.5 * weaponWeight * vAfter * vAfter;
  const keAfterRot = 0.5 * weaponInertia * wAfter * wAfter;
  const keAfter = keAfterLinear + keAfterRot;

  const energyTransferred = totalKE - keAfter + 0.5;
  return 0.067 * energyTransferred;
}

// Base blow magnitude for swing (finds optimal impact point in a window)
function calculateBaseBlowMagnitudeForSwing(angularSpeed, weaponReach, weaponWeight, weaponInertia, weaponCoM, impactPoint, extraLinearSpeed) {
  impactPoint = Math.min(impactPoint, 0.93);
  const window = Math.min(0.4 / weaponReach, 1.0);
  let bestMag = 0;
  for (let i = 0; i < 5; i++) {
    const pt = impactPoint + (i / 4) * window;
    if (pt >= 1.0) break;
    const mag = calculateStrikeMagnitudeForSwing(angularSpeed, pt, weaponWeight, weaponReach, weaponInertia, weaponCoM, extraLinearSpeed);
    if (mag > bestMag) bestMag = mag;
  }
  return bestMag;
}

// Strike magnitude for thrust
function calculateStrikeMagnitudeForThrust(thrustSpeed, weaponWeight, extraLinearSpeed, isThrown) {
  const totalSpeed = thrustSpeed + extraLinearSpeed;
  if (totalSpeed <= 0) return 0;
  let effectiveWeight = weaponWeight;
  if (!isThrown) effectiveWeight += 2.5;
  const ke = 0.5 * effectiveWeight * totalSpeed * totalSpeed;
  return 0.125 * ke;
}

// ── Main damage calculation ──
function calculateSwingBaseDamage(swingSpeed, weaponReach, weaponWeight, weaponInertia, weaponCoM, swingDamageFactor) {
  let maxMag = 0;
  for (let ip = 0.93; ip > 0.5; ip -= 0.05) {
    const mag = calculateBaseBlowMagnitudeForSwing(swingSpeed, weaponReach, weaponWeight, weaponInertia, weaponCoM, ip, 0);
    if (mag > maxMag) maxMag = mag;
  }
  return maxMag * swingDamageFactor;
}

function calculateThrustBaseDamage(thrustSpeed, weaponWeight, thrustDamageFactor) {
  const mag = calculateStrikeMagnitudeForThrust(thrustSpeed, weaponWeight, 0, false);
  return mag * thrustDamageFactor;
}

// ── Weapon physics from pieces ──
function computeWeaponStats(pieces, buildOrders, flags) {
  // pieces is a map of pieceType -> { piece data, scaleFactor }
  // buildOrders defines assembly order

  // Total weight
  let totalWeight = 0;
  for (const bo of buildOrders) {
    const p = pieces.get(bo.pieceType);
    if (!p) continue;
    totalWeight += p.scaledWeight;
  }

  // Center of mass (relative to handle grip point)
  // Positive = forward, negative = backward
  let comNumerator = 0;
  let forwardDist = 0; // distance forward from grip
  let backwardDist = 0; // distance backward from grip

  for (const bo of buildOrders) {
    const p = pieces.get(bo.pieceType);
    if (!p) continue;
    if (bo.order < 0) {
      // Backward (pommel direction)
      comNumerator -= (backwardDist + (p.scaledLength - p.scaledCenterOfMass)) * p.scaledWeight;
      backwardDist += p.scaledLength;
    } else {
      // Forward (blade direction)
      comNumerator += (forwardDist + p.scaledCenterOfMass) * p.scaledWeight;
      forwardDist += p.scaledLength;
    }
  }

  // Handle piece offset adjustment
  const handlePiece = pieces.get('Handle');
  const handleDistToPrev = handlePiece ? handlePiece.scaledDistToPrev : 0;
  const handlePieceOffset = handlePiece ? handlePiece.scaledPieceOffset : 0;

  let centerOfMass = comNumerator / totalWeight - (handleDistToPrev - handlePieceOffset);

  // Weapon reach (total forward length)
  const weaponReach = forwardDist;

  // Inertia (parallel axis theorem from center of mass)
  let totalInertia = 0;
  let offset = -centerOfMass;
  for (const bo of buildOrders) {
    const p = pieces.get(bo.pieceType);
    if (!p) continue;
    // ParallelAxis: piece inertia + mass * (offset + piece_com)^2
    const pieceInertia = p.piece.inertia;
    const pieceCom = p.piece.centerOfMass;
    const offsetFromCm = offset + pieceCom;
    totalInertia += pieceInertia + p.scaledWeight * offsetFromCm * offsetFromCm;
    offset += p.scaledLength;
  }

  return {
    totalWeight: Math.round(totalWeight * 100) / 100,
    weaponReach: Math.round(weaponReach * 100) / 100,
    centerOfMass,
    inertia: totalInertia,
  };
}

// ── Process a CraftedItem ──
function processWeapon(weaponItem, allPieces) {
  const template = weaponItem['@_crafting_template'] || '';
  const buildOrders = TEMPLATE_BUILD_ORDERS[template];
  if (!buildOrders) return null;

  const xmlPieces = weaponItem.Pieces?.Piece || [];
  // Resolve primary description flags for multi-mode templates
  const pieceIds = xmlPieces.map(xp => xp['@_id'] || '');
  const flags = resolvePrimaryFlags(template, pieceIds, descPieces) || TEMPLATE_FLAGS[template];
  if (!flags) return null;
  const pieceMap = new Map();

  for (const xmlPiece of xmlPieces) {
    const pieceId = xmlPiece['@_id'] || '';
    const pieceType = xmlPiece['@_Type'] || '';
    const scalePercent = parseInt(xmlPiece['@_scale_factor']) || 100;
    const scaleFactor = scalePercent / 100;
    const isScaled = scalePercent !== 100;

    const pieceData = allPieces.get(pieceId);
    if (!pieceData) continue;

    const scaledWeight = isScaled
      ? pieceData.weight * (pieceData.fullScale ? scaleFactor * scaleFactor * scaleFactor : scaleFactor)
      : pieceData.weight;
    const scaledLength = isScaled ? pieceData.length * scaleFactor : pieceData.length;
    const scaledCenterOfMass = isScaled ? pieceData.centerOfMass * scaleFactor : pieceData.centerOfMass;
    const scaledDistToNext = isScaled ? pieceData.distToNext * scaleFactor : pieceData.distToNext;
    const scaledDistToPrev = isScaled ? pieceData.distToPrev * scaleFactor : pieceData.distToPrev;
    const scaledPieceOffset = isScaled ? pieceData.pieceOffset * scaleFactor : pieceData.pieceOffset;

    pieceMap.set(pieceType, {
      piece: pieceData,
      scaleFactor,
      scaledWeight,
      scaledLength,
      scaledCenterOfMass,
      scaledDistToNext,
      scaledDistToPrev,
      scaledPieceOffset,
    });
  }

  const bladePieceEntry = pieceMap.get('Blade');
  if (!bladePieceEntry || !bladePieceEntry.piece.bladeData) return null;

  const stats = computeWeaponStats(pieceMap, buildOrders, flags);
  const swingDamageFactor = bladePieceEntry.piece.bladeData.swingDamageFactor;
  const thrustDamageFactor = bladePieceEntry.piece.bladeData.thrustDamageFactor;

  const swingSpeed = calculateSwingSpeed(stats.weaponReach, stats.totalWeight, stats.inertia, stats.centerOfMass, flags);
  const thrustSpeed = calculateThrustSpeed(stats.totalWeight, stats.inertia, stats.centerOfMass, flags);

  const swingDamage = calculateSwingBaseDamage(swingSpeed, stats.weaponReach, stats.totalWeight, stats.inertia, stats.centerOfMass, swingDamageFactor);
  const thrustDamage = calculateThrustBaseDamage(thrustSpeed, stats.totalWeight, thrustDamageFactor);

  // Convert speeds to game display values
  const displaySwingSpeed = Math.floor(swingSpeed * 4.5454545);
  const displayThrustSpeed = Math.floor(thrustSpeed * 11.764706);

  return {
    template,
    totalWeight: stats.totalWeight,
    weaponReach: Math.round(stats.weaponReach * 100), // in cm for display
    swingSpeed: displaySwingSpeed,
    thrustSpeed: displayThrustSpeed,
    swingDamage: Math.round(swingDamage),
    thrustDamage: Math.round(thrustDamage),
    swingDamageFactor,
    thrustDamageFactor,
    // Debug
    _rawSwingSpeed: swingSpeed,
    _rawThrustSpeed: thrustSpeed,
    _inertia: stats.inertia,
    _centerOfMass: stats.centerOfMass,
  };
}

// ── Load and run ──
const allPieces = new Map();
for (const [k, v] of parseCraftingPieces(path.join(armoryDir, 'LOTRLOME_crafting_pieces.xml'))) {
  allPieces.set(k, v);
}
for (const [k, v] of parseCraftingPieces(path.join(armoryDir, 'vanilla_crafting_pieces.xml'))) {
  if (!allPieces.has(k)) allPieces.set(k, v);
}

const weaponsPath = path.join(armoryDir, 'LOTRAOM_weapons.xml');
const xml = fs.readFileSync(weaponsPath, 'utf-8');
const parsed = parser.parse(xml);
const craftedItems = parsed?.Items?.CraftedItem || [];

// If a specific weapon ID is provided as argument, show detailed output
const targetId = process.argv[2];

if (targetId) {
  const item = craftedItems.find(i => (i['@_id'] || '') === targetId);
  if (!item) {
    console.error(`Weapon '${targetId}' not found`);
    process.exit(1);
  }
  const result = processWeapon(item, allPieces);
  if (!result) {
    console.error('Could not compute stats');
    process.exit(1);
  }
  const name = (item['@_name'] || '').replace(/^\{=[^}]*\}/, '');
  console.log(`\n=== ${name} ===`);
  console.log(`Template: ${result.template}`);
  console.log(`Weight: ${result.totalWeight}`);
  console.log(`Reach: ${result.weaponReach}`);
  console.log(`Swing Speed: ${result.swingSpeed}`);
  console.log(`Swing Damage: ${result.swingDamage}`);
  console.log(`Thrust Speed: ${result.thrustSpeed}`);
  console.log(`Thrust Damage: ${result.thrustDamage}`);
  console.log(`\nDamage Factors: swing=${result.swingDamageFactor}, thrust=${result.thrustDamageFactor}`);
  console.log(`Raw Speeds: swing=${result._rawSwingSpeed.toFixed(4)}, thrust=${result._rawThrustSpeed.toFixed(4)}`);
  console.log(`Inertia: ${result._inertia.toFixed(6)}, CoM: ${result._centerOfMass.toFixed(6)}`);
} else {
  // Process all weapons and output JSON
  const results = [];
  for (const item of craftedItems) {
    const id = item['@_id'] || '';
    const name = (item['@_name'] || '').replace(/^\{=[^}]*\}/, '');
    const culture = (item['@_culture'] || '').replace('Culture.', '');
    const result = processWeapon(item, allPieces);
    if (result) {
      results.push({
        id,
        name,
        culture,
        ...result,
      });
    }
  }
  console.log(JSON.stringify(results, null, 2));
  console.error(`\nProcessed ${results.length} / ${craftedItems.length} crafted weapons`);
}
