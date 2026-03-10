/**
 * Simplified TaleWorlds damage estimation based on decompiled Bannerlord v1.3.12 formulas.
 *
 * Full pipeline (from CombatStatCalculator + DefaultStrikeMagnitudeModel):
 *   1. Physics magnitude = 0.067 × energyTransferred (swing) or 0.125 × KE (thrust)
 *   2. specialMagnitude = physicsMagnitude × damageFactor
 *   3. rawDamage = ComputeRawDamage(type, specialMag, armor)
 *
 * Since we lack runtime physics params (inertia, CoM, swing speed), we use a
 * calibrated constant × bladeWeight × damageFactor as a simplified estimate.
 */

// Calibrated multiplier for swing damage estimation.
// Derived from: 0.067 × ~50% energy transfer × reference swing KE per kg ≈ 25
const SWING_MULTIPLIER = 25;

// Thrust adds arm weight (2.5 kg) in the real formula, so thrust multiplier is lower
// per unit weight but accounts for the arm contribution.
const THRUST_MULTIPLIER = 18;

/**
 * Estimate swing damage for a CraftedItem weapon.
 * Uses blade weight and swing damage factor from crafting pieces.
 */
export function estimateSwingDamage(bladeWeight: number, swingDamageFactor: number): number {
  if (bladeWeight <= 0 || swingDamageFactor <= 0) return 0;
  return Math.round(bladeWeight * swingDamageFactor * SWING_MULTIPLIER);
}

/**
 * Estimate thrust damage for a CraftedItem weapon.
 * Uses blade weight and thrust damage factor from crafting pieces.
 */
export function estimateThrustDamage(bladeWeight: number, thrustDamageFactor: number): number {
  if (bladeWeight <= 0 || thrustDamageFactor <= 0) return 0;
  return Math.round(bladeWeight * thrustDamageFactor * THRUST_MULTIPLIER);
}

/**
 * TaleWorlds ComputeRawDamage formula (exact from DefaultStrikeMagnitudeModel).
 * Computes damage after armor reduction.
 *
 * @param damageType - 'Cut', 'Pierce', or 'Blunt'
 * @param magnitude - Pre-armor damage magnitude
 * @param armor - Target armor value
 */
export function computeRawDamage(damageType: string, magnitude: number, armor: number): number {
  if (magnitude <= 0) return 0;

  const armorReduction = 50 / (50 + armor);
  const reducedMag = magnitude * armorReduction;

  let bluntFactor: number;
  let armorThreshold: number;

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

  const bluntDamage = bluntFactor * reducedMag;
  const penetrating = Math.max(0, reducedMag - armor * armorThreshold);
  const sharpDamage = (1 - bluntFactor) * penetrating;

  return bluntDamage + sharpDamage;
}
