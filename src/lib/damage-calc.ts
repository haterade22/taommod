/**
 * Full TaleWorlds damage calculation — replicates the exact physics pipeline
 * from decompiled Bannerlord v1.3.12 CombatStatCalculator + Crafting.CraftingStats.
 *
 * Verified against in-game values:
 *   Galadriel Sword: Game=87/72, Calc=86/72 (1 rounding diff on swing)
 */

// ── Piece data needed for physics ──

export interface CraftingPieceData {
  id: string;
  pieceType: string; // Blade, Guard, Handle, Pommel
  weight: number; // kg
  length: number; // meters (from cm in XML * 0.01)
  centerOfMass: number; // meters
  inertia: number; // kg*m^2 = 1/12 * weight * length^2
  fullScale: boolean;
  distToNext: number; // meters
  distToPrev: number; // meters
  pieceOffset: number; // meters
  // Blade-specific
  swingDamageFactor: number;
  swingDamageType: string;
  thrustDamageFactor: number;
  thrustDamageType: string;
}

export interface WeaponFlags {
  meleeWeapon: boolean;
  notUsableWithOneHand: boolean;
  wideGrip: boolean;
}

export interface WeaponDamageResult {
  swingDamage: number;
  thrustDamage: number;
  swingSpeed: number; // Display value (game UI)
  thrustSpeed: number; // Display value (game UI)
  totalWeight: number;
  weaponReach: number; // cm
}

// ── Build orders per template (from Native/ModuleData/crafting_templates.xml) ──

interface BuildOrder {
  pieceType: string;
  order: number; // positive = forward, negative = backward
}

const TEMPLATE_BUILD_ORDERS: Record<string, BuildOrder[]> = {
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
  Dagger: [
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
  OneHandedPolearm: [
    { pieceType: 'Handle', order: 0 },
    { pieceType: 'Blade', order: 1 },
    { pieceType: 'Pommel', order: -1 },
  ],
};

const TEMPLATE_FLAGS: Record<string, WeaponFlags> = {
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

// ── Physics simulation (exact TaleWorlds decompiled code) ──

function simulateSwingLayer(
  weaponReach: number,
  wideGrip: boolean,
  angleSpan: number,
  usablePower: number,
  maxTorque: number,
  inertia: number,
): { finalSpeed: number; finalTime: number } {
  let angle = 0,
    speed = 0.01,
    time = 0;
  const drag = 3.9 * weaponReach * (wideGrip ? 1.0 : 0.3);
  while (angle < angleSpan) {
    let torque = usablePower / speed;
    if (torque > maxTorque) torque = maxTorque;
    torque -= speed * drag;
    speed += (0.009999999776482582 * torque) / inertia;
    angle += speed * 0.009999999776482582;
    time += 0.009999999776482582;
  }
  return { finalSpeed: speed, finalTime: time };
}

function simulateThrustLayer(
  distance: number,
  usablePower: number,
  maxForce: number,
  mass: number,
): { finalSpeed: number; finalTime: number } {
  let pos = 0,
    speed = 0.01,
    time = 0;
  while (pos < distance) {
    let force = usablePower / speed;
    if (force > maxForce) force = maxForce;
    speed += (0.01 * force) / mass;
    pos += speed * 0.01;
    time += 0.01;
  }
  return { finalSpeed: speed, finalTime: time };
}

function calcSwingSpeed(reach: number, weight: number, inertia: number, com: number, flags: WeaponFlags): number {
  const inertiaAroundShoulder = inertia + weight * (0.5 + com) * (0.5 + com);
  const isTwoHanded = flags.meleeWeapon && flags.notUsableWithOneHand;
  const isWide = flags.wideGrip;

  let I = 1.0 * inertiaAroundShoulder + 0.9;
  let p1 = 170,
    p2 = 90,
    t1 = 27,
    t2 = 15,
    t3 = 7;

  if (isTwoHanded) {
    if (isWide) {
      I += 1.5;
      t3 *= 4.0;
      t2 *= 1.7;
      p2 *= 1.3;
      p1 *= 1.15;
    } else {
      I += 1.0;
      t3 *= 2.4;
      t2 *= 1.3;
      p2 *= 1.35;
      p1 *= 1.15;
    }
  }

  t1 = Math.max(1.0, t1 - I);
  t2 = Math.max(1.0, t2 - I);
  t3 = Math.max(1.0, t3 - I);

  const r1 = simulateSwingLayer(reach, isWide, 1.5, 200, t1, 2.0 + I);
  const r2 = simulateSwingLayer(reach, isWide, 1.5, p1, t2, 1.0 + I);
  const r3 = simulateSwingLayer(reach, isWide, 1.5, p2, t3, 0.5 + I);

  return 20.8 / (0.33 * (r1.finalTime + r2.finalTime + r3.finalTime));
}

function calcThrustSpeed(weight: number, inertia: number, com: number, flags: WeaponFlags): number {
  const inertiaAroundGrip = inertia + weight * com * com;
  const isTwoHanded = flags.meleeWeapon && flags.notUsableWithOneHand;
  const isWide = flags.wideGrip;

  let mass = 1.8 + weight + inertiaAroundGrip * 0.2;
  let p1 = 170,
    p2 = 90,
    f1 = 24,
    f2 = 15;

  if (isTwoHanded && !isWide) {
    mass += 0.6;
    f2 *= 1.9;
    f1 *= 1.1;
    p2 *= 1.2;
    p1 *= 1.05;
  } else if (isTwoHanded && isWide) {
    mass += 0.9;
    f2 *= 2.1;
    f1 *= 1.2;
    p2 *= 1.2;
    p1 *= 1.05;
  }

  const r1 = simulateThrustLayer(0.6, 250, 48, 4.0 + mass);
  const r2 = simulateThrustLayer(0.6, p1, f1, 2.0 + mass);
  const r3 = simulateThrustLayer(0.6, p2, f2, 0.5 + mass);

  return 3.8500000000000005 / (0.33 * (r1.finalTime + r2.finalTime + r3.finalTime));
}

// Energy transfer at impact point
function strikeMagnitudeSwing(
  swingSpeed: number,
  impactPt: number,
  weight: number,
  length: number,
  inertia: number,
  com: number,
): number {
  const r = length * impactPt - com;
  const vLin = swingSpeed * (0.5 + com);
  const keBefore = 0.5 * weight * vLin * vLin + 0.5 * inertia * swingSpeed * swingSpeed;
  const impulse = (vLin + swingSpeed * r) / (1.0 / weight + (r * r) / inertia);
  const vAfter = vLin - impulse / weight;
  const wAfter = swingSpeed - (impulse * r) / inertia;
  const keAfter = 0.5 * weight * vAfter * vAfter + 0.5 * inertia * wAfter * wAfter;
  return 0.067 * (keBefore - keAfter + 0.5);
}

function baseBlowMagnitudeSwing(
  angularSpeed: number,
  reach: number,
  weight: number,
  inertia: number,
  com: number,
  impactPt: number,
): number {
  impactPt = Math.min(impactPt, 0.93);
  const window = Math.min(0.4 / reach, 1.0);
  let best = 0;
  for (let i = 0; i < 5; i++) {
    const pt = impactPt + (i / 4) * window;
    if (pt >= 1.0) break;
    const mag = strikeMagnitudeSwing(angularSpeed, pt, weight, reach, inertia, com);
    if (mag > best) best = mag;
  }
  return best;
}

function strikeMagnitudeThrust(thrustSpeed: number, weight: number): number {
  if (thrustSpeed <= 0) return 0;
  const effectiveWeight = weight + 2.5; // arm weight added for non-thrown
  return 0.125 * 0.5 * effectiveWeight * thrustSpeed * thrustSpeed;
}

// ── Weapon assembly physics ──

interface ScaledPiece {
  piece: CraftingPieceData;
  scaledWeight: number;
  scaledLength: number;
  scaledCenterOfMass: number;
  scaledDistToPrev: number;
  scaledPieceOffset: number;
}

function assembleWeapon(
  pieces: Map<string, ScaledPiece>,
  buildOrders: BuildOrder[],
): { totalWeight: number; weaponReach: number; centerOfMass: number; inertia: number } {
  let totalWeight = 0;
  for (const bo of buildOrders) {
    const p = pieces.get(bo.pieceType);
    if (p) totalWeight += p.scaledWeight;
  }
  if (totalWeight <= 0) return { totalWeight: 0, weaponReach: 0, centerOfMass: 0, inertia: 0 };

  // Center of mass
  let comNum = 0,
    fwd = 0,
    bwd = 0;
  for (const bo of buildOrders) {
    const p = pieces.get(bo.pieceType);
    if (!p) continue;
    if (bo.order < 0) {
      comNum -= (bwd + (p.scaledLength - p.scaledCenterOfMass)) * p.scaledWeight;
      bwd += p.scaledLength;
    } else {
      comNum += (fwd + p.scaledCenterOfMass) * p.scaledWeight;
      fwd += p.scaledLength;
    }
  }
  const handle = pieces.get('Handle');
  const handleAdj = handle ? handle.scaledDistToPrev - handle.scaledPieceOffset : 0;
  const centerOfMass = comNum / totalWeight - handleAdj;
  const weaponReach = fwd;

  // Inertia via parallel axis theorem
  let totalInertia = 0,
    offset = -centerOfMass;
  for (const bo of buildOrders) {
    const p = pieces.get(bo.pieceType);
    if (!p) continue;
    const d = offset + p.piece.centerOfMass;
    totalInertia += p.piece.inertia + p.scaledWeight * d * d;
    offset += p.scaledLength;
  }

  return { totalWeight: Math.round(totalWeight * 100) / 100, weaponReach, centerOfMass, inertia: totalInertia };
}

// ── Public API ──

// ── Weapon description flags per description ID (from weapon_descriptions.xml) ──
// Used to resolve the primary weapon description for multi-mode templates.

export const DESCRIPTION_FLAGS: Record<string, WeaponFlags> = {
  OneHandedSword: { meleeWeapon: true, notUsableWithOneHand: false, wideGrip: false },
  OneHandedBastardSword: { meleeWeapon: true, notUsableWithOneHand: false, wideGrip: false },
  OneHandedBastardSwordAlternative: { meleeWeapon: true, notUsableWithOneHand: false, wideGrip: false },
  TwoHandedSword: { meleeWeapon: true, notUsableWithOneHand: true, wideGrip: false },
  OneHandedAxe: { meleeWeapon: true, notUsableWithOneHand: false, wideGrip: false },
  TwoHandedAxe: { meleeWeapon: true, notUsableWithOneHand: true, wideGrip: false },
  Mace: { meleeWeapon: true, notUsableWithOneHand: false, wideGrip: false },
  TwoHandedMace: { meleeWeapon: true, notUsableWithOneHand: true, wideGrip: false },
  TwoHandedPolearm: { meleeWeapon: true, notUsableWithOneHand: true, wideGrip: true },
  TwoHandedPolearm_Couchable: { meleeWeapon: true, notUsableWithOneHand: true, wideGrip: true },
  TwoHandedPolearm_Bracing: { meleeWeapon: true, notUsableWithOneHand: true, wideGrip: true },
  TwoHandedPolearm_Pike: { meleeWeapon: true, notUsableWithOneHand: true, wideGrip: true },
  OneHandedPolearm: { meleeWeapon: true, notUsableWithOneHand: false, wideGrip: false },
  OneHandedPolearm_Bracing: { meleeWeapon: true, notUsableWithOneHand: false, wideGrip: false },
  Dagger: { meleeWeapon: true, notUsableWithOneHand: false, wideGrip: false },
  Javelin: { meleeWeapon: true, notUsableWithOneHand: false, wideGrip: false },
  ThrowingAxe: { meleeWeapon: true, notUsableWithOneHand: false, wideGrip: false },
  // LOTRAOM custom descriptions
  uruk_two_handed: { meleeWeapon: true, notUsableWithOneHand: true, wideGrip: false },
  uruk_twoHandedPolearm_Pike: { meleeWeapon: true, notUsableWithOneHand: true, wideGrip: true },
  uruk_twoHandedPolearm_Bracing: { meleeWeapon: true, notUsableWithOneHand: true, wideGrip: true },
  uOneHandedSword: { meleeWeapon: true, notUsableWithOneHand: false, wideGrip: false },
};

// Ordered weapon descriptions per crafting template (from crafting_templates.xml).
// The game checks descriptions in this order — first matching is primary.
export const TEMPLATE_DESCRIPTIONS: Record<string, string[]> = {
  OneHandedSword: ['OneHandedSword'],
  TwoHandedSword: ['OneHandedBastardSword', 'TwoHandedSword', 'OneHandedBastardSwordAlternative'],
  Dagger: ['Dagger'],
  OneHandedAxe: ['OneHandedAxe'],
  TwoHandedAxe: ['TwoHandedAxe'],
  Mace: ['Mace'],
  TwoHandedMace: ['TwoHandedMace'],
  TwoHandedPolearm: ['TwoHandedPolearm'],
  Pike: ['TwoHandedPolearm_Pike'],
  Javelin: ['Javelin'],
  ThrowingAxe: ['ThrowingAxe'],
  OneHandedPolearm: ['OneHandedPolearm'],
  // LOTRAOM custom templates
  uruk_Pike: ['uruk_twoHandedPolearm_Pike', 'uruk_twoHandedPolearm_Bracing'],
  u_onehanded: ['uOneHandedSword'],
  u_twohanded: ['uruk_two_handed'],
};

/**
 * Compute exact TaleWorlds damage for a CraftedItem weapon.
 * Requires all piece data (blade, guard, handle, pommel) and the crafting template.
 * If flagsOverride is provided, uses those flags instead of the template's default flags.
 * This is needed for multi-mode templates (e.g. TwoHandedSword template can produce
 * OneHandedBastardSword or TwoHandedSword stats depending on which description matches).
 */
export function computeCraftedWeaponDamage(
  template: string,
  weaponPieces: { pieceType: string; piece: CraftingPieceData; scalePercent: number }[],
  flagsOverride?: WeaponFlags,
): WeaponDamageResult | null {
  const buildOrders = TEMPLATE_BUILD_ORDERS[template];
  const flags = flagsOverride || TEMPLATE_FLAGS[template];
  if (!buildOrders || !flags) return null;

  const pieceMap = new Map<string, ScaledPiece>();
  for (const wp of weaponPieces) {
    const sf = wp.scalePercent / 100;
    const isScaled = wp.scalePercent !== 100;
    const p = wp.piece;
    pieceMap.set(wp.pieceType, {
      piece: p,
      scaledWeight: isScaled ? p.weight * (p.fullScale ? sf * sf * sf : sf) : p.weight,
      scaledLength: isScaled ? p.length * sf : p.length,
      scaledCenterOfMass: isScaled ? p.centerOfMass * sf : p.centerOfMass,
      scaledDistToPrev: isScaled ? p.distToPrev * sf : p.distToPrev,
      scaledPieceOffset: isScaled ? p.pieceOffset * sf : p.pieceOffset,
    });
  }

  const bladePiece = weaponPieces.find((wp) => wp.pieceType === 'Blade');
  if (!bladePiece) return null;

  const stats = assembleWeapon(pieceMap, buildOrders);
  if (stats.totalWeight <= 0) return null;

  const swingSpeed = calcSwingSpeed(stats.weaponReach, stats.totalWeight, stats.inertia, stats.centerOfMass, flags);
  const thrustSpeed = calcThrustSpeed(stats.totalWeight, stats.inertia, stats.centerOfMass, flags);

  // Swing damage: find max magnitude across impact points, multiply by factor
  let maxSwingMag = 0;
  for (let ip = 0.93; ip > 0.5; ip -= 0.05) {
    const mag = baseBlowMagnitudeSwing(
      swingSpeed,
      stats.weaponReach,
      stats.totalWeight,
      stats.inertia,
      stats.centerOfMass,
      ip,
    );
    if (mag > maxSwingMag) maxSwingMag = mag;
  }
  const swingDamage = maxSwingMag * bladePiece.piece.swingDamageFactor;

  // Thrust damage
  const thrustMag = strikeMagnitudeThrust(thrustSpeed, stats.totalWeight);
  const thrustDamage = thrustMag * bladePiece.piece.thrustDamageFactor;

  return {
    swingDamage: Math.round(swingDamage),
    thrustDamage: Math.round(thrustDamage),
    swingSpeed: Math.floor(swingSpeed * 4.5454545),
    thrustSpeed: Math.floor(thrustSpeed * 11.764706),
    totalWeight: stats.totalWeight,
    weaponReach: Math.round(stats.weaponReach * 100),
  };
}

/**
 * TaleWorlds ComputeRawDamage formula (exact from DefaultStrikeMagnitudeModel).
 * Computes damage after armor reduction.
 */
export function computeRawDamage(damageType: string, magnitude: number, armor: number): number {
  if (magnitude <= 0) return 0;
  const armorReduction = 50 / (50 + armor);
  const reducedMag = magnitude * armorReduction;

  let bluntFactor: number, armorThreshold: number;
  switch (damageType) {
    case 'Cut':
      bluntFactor = 0.1;
      armorThreshold = 0.5;
      break;
    case 'Pierce':
      bluntFactor = 0.25;
      armorThreshold = 0.33;
      break;
    case 'Blunt':
      bluntFactor = 0.6;
      armorThreshold = 0.2;
      break;
    default:
      bluntFactor = 0.1;
      armorThreshold = 0.5;
  }

  return bluntFactor * reducedMag + (1 - bluntFactor) * Math.max(0, reducedMag - armor * armorThreshold);
}
