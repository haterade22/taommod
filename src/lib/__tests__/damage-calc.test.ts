import { describe, it, expect } from 'vitest';
import { computeRawDamage, computeCraftedWeaponDamage, type CraftingPieceData } from '../damage-calc';

describe('computeRawDamage', () => {
  it('returns 0 for zero magnitude', () => {
    expect(computeRawDamage('Cut', 0, 30)).toBe(0);
    expect(computeRawDamage('Pierce', 0, 50)).toBe(0);
    expect(computeRawDamage('Blunt', 0, 10)).toBe(0);
  });

  it('returns 0 for negative magnitude', () => {
    expect(computeRawDamage('Cut', -5, 30)).toBe(0);
  });

  it('handles zero armor (full damage passthrough)', () => {
    // With 0 armor: armorReduction = 50/(50+0) = 1.0
    // Cut: 0.1 * mag + 0.9 * max(0, mag - 0) = mag
    expect(computeRawDamage('Cut', 100, 0)).toBe(100);
    expect(computeRawDamage('Pierce', 100, 0)).toBe(100);
    expect(computeRawDamage('Blunt', 100, 0)).toBe(100);
  });

  it('Cut damage is reduced more by armor than Blunt', () => {
    const armor = 40;
    const magnitude = 80;
    const cutDmg = computeRawDamage('Cut', magnitude, armor);
    const bluntDmg = computeRawDamage('Blunt', magnitude, armor);
    expect(bluntDmg).toBeGreaterThan(cutDmg);
  });

  it('Pierce has intermediate armor penetration', () => {
    const armor = 40;
    const magnitude = 80;
    const cutDmg = computeRawDamage('Cut', magnitude, armor);
    const pierceDmg = computeRawDamage('Pierce', magnitude, armor);
    const bluntDmg = computeRawDamage('Blunt', magnitude, armor);
    expect(pierceDmg).toBeGreaterThan(cutDmg);
    expect(bluntDmg).toBeGreaterThan(pierceDmg);
  });

  it('unknown damage type defaults to Cut behavior', () => {
    expect(computeRawDamage('Unknown', 100, 40)).toBe(computeRawDamage('Cut', 100, 40));
  });

  it('produces correct values for known inputs', () => {
    // Cut, 100 mag, 40 armor: armorReduction = 50/90 ≈ 0.5556
    // reducedMag = 55.56
    // result = 0.1 * 55.56 + 0.9 * max(0, 55.56 - 20) = 5.556 + 32.0 = 37.556
    const result = computeRawDamage('Cut', 100, 40);
    expect(result).toBeCloseTo(37.556, 2);
  });
});

describe('computeCraftedWeaponDamage', () => {
  it('returns null for unknown template', () => {
    const result = computeCraftedWeaponDamage('NonExistentTemplate', []);
    expect(result).toBeNull();
  });

  it('returns null when no blade piece provided', () => {
    const handle: CraftingPieceData = {
      id: 'test_handle',
      pieceType: 'Handle',
      weight: 0.3,
      length: 0.15,
      centerOfMass: 0.075,
      inertia: 0.0005625,
      fullScale: false,
      distToNext: 0,
      distToPrev: 0,
      pieceOffset: 0,
      swingDamageFactor: 0,
      swingDamageType: '',
      thrustDamageFactor: 0,
      thrustDamageType: '',
    };

    const result = computeCraftedWeaponDamage('OneHandedSword', [
      { pieceType: 'Handle', piece: handle, scalePercent: 100 },
    ]);
    expect(result).toBeNull();
  });

  it('computes damage for a basic one-handed sword', () => {
    // Minimal realistic sword pieces
    const blade: CraftingPieceData = {
      id: 'test_blade',
      pieceType: 'Blade',
      weight: 0.8,
      length: 0.7,
      centerOfMass: 0.35,
      inertia: (1 / 12) * 0.8 * 0.7 * 0.7,
      fullScale: false,
      distToNext: 0,
      distToPrev: 0,
      pieceOffset: 0,
      swingDamageFactor: 1.5,
      swingDamageType: 'Cut',
      thrustDamageFactor: 1.2,
      thrustDamageType: 'Pierce',
    };
    const guard: CraftingPieceData = {
      id: 'test_guard',
      pieceType: 'Guard',
      weight: 0.15,
      length: 0.02,
      centerOfMass: 0.01,
      inertia: 0.00001,
      fullScale: false,
      distToNext: 0,
      distToPrev: 0,
      pieceOffset: 0,
      swingDamageFactor: 0,
      swingDamageType: '',
      thrustDamageFactor: 0,
      thrustDamageType: '',
    };
    const handle: CraftingPieceData = {
      id: 'test_handle',
      pieceType: 'Handle',
      weight: 0.2,
      length: 0.12,
      centerOfMass: 0.06,
      inertia: 0.00024,
      fullScale: false,
      distToNext: 0,
      distToPrev: 0,
      pieceOffset: 0,
      swingDamageFactor: 0,
      swingDamageType: '',
      thrustDamageFactor: 0,
      thrustDamageType: '',
    };
    const pommel: CraftingPieceData = {
      id: 'test_pommel',
      pieceType: 'Pommel',
      weight: 0.1,
      length: 0.03,
      centerOfMass: 0.015,
      inertia: 0.0000075,
      fullScale: false,
      distToNext: 0,
      distToPrev: 0,
      pieceOffset: 0,
      swingDamageFactor: 0,
      swingDamageType: '',
      thrustDamageFactor: 0,
      thrustDamageType: '',
    };

    const result = computeCraftedWeaponDamage('OneHandedSword', [
      { pieceType: 'Handle', piece: handle, scalePercent: 100 },
      { pieceType: 'Guard', piece: guard, scalePercent: 100 },
      { pieceType: 'Blade', piece: blade, scalePercent: 100 },
      { pieceType: 'Pommel', piece: pommel, scalePercent: 100 },
    ]);

    expect(result).not.toBeNull();
    expect(result!.swingDamage).toBeGreaterThan(0);
    expect(result!.thrustDamage).toBeGreaterThan(0);
    expect(result!.swingSpeed).toBeGreaterThan(0);
    expect(result!.thrustSpeed).toBeGreaterThan(0);
    expect(result!.totalWeight).toBeGreaterThan(0);
    expect(result!.weaponReach).toBeGreaterThan(0);
  });

  it('applies scale factor to piece dimensions', () => {
    const blade: CraftingPieceData = {
      id: 'test_blade',
      pieceType: 'Blade',
      weight: 1.0,
      length: 0.8,
      centerOfMass: 0.4,
      inertia: (1 / 12) * 1.0 * 0.8 * 0.8,
      fullScale: false,
      distToNext: 0,
      distToPrev: 0,
      pieceOffset: 0,
      swingDamageFactor: 1.5,
      swingDamageType: 'Cut',
      thrustDamageFactor: 1.0,
      thrustDamageType: 'Pierce',
    };
    const handle: CraftingPieceData = {
      id: 'h',
      pieceType: 'Handle',
      weight: 0.2,
      length: 0.12,
      centerOfMass: 0.06,
      inertia: 0.00024,
      fullScale: false,
      distToNext: 0,
      distToPrev: 0,
      pieceOffset: 0,
      swingDamageFactor: 0,
      swingDamageType: '',
      thrustDamageFactor: 0,
      thrustDamageType: '',
    };
    const guard: CraftingPieceData = {
      id: 'g',
      pieceType: 'Guard',
      weight: 0.1,
      length: 0.02,
      centerOfMass: 0.01,
      inertia: 0.00001,
      fullScale: false,
      distToNext: 0,
      distToPrev: 0,
      pieceOffset: 0,
      swingDamageFactor: 0,
      swingDamageType: '',
      thrustDamageFactor: 0,
      thrustDamageType: '',
    };
    const pommel: CraftingPieceData = {
      id: 'p',
      pieceType: 'Pommel',
      weight: 0.1,
      length: 0.03,
      centerOfMass: 0.015,
      inertia: 0.0000075,
      fullScale: false,
      distToNext: 0,
      distToPrev: 0,
      pieceOffset: 0,
      swingDamageFactor: 0,
      swingDamageType: '',
      thrustDamageFactor: 0,
      thrustDamageType: '',
    };

    const pieces = [
      { pieceType: 'Handle', piece: handle, scalePercent: 100 },
      { pieceType: 'Guard', piece: guard, scalePercent: 100 },
      { pieceType: 'Blade', piece: blade, scalePercent: 100 },
      { pieceType: 'Pommel', piece: pommel, scalePercent: 100 },
    ];

    const normal = computeCraftedWeaponDamage('OneHandedSword', pieces);
    const scaled = computeCraftedWeaponDamage(
      'OneHandedSword',
      pieces.map((p) => ({ ...p, scalePercent: p.pieceType === 'Blade' ? 120 : 100 })),
    );

    expect(normal).not.toBeNull();
    expect(scaled).not.toBeNull();
    // Scaled blade should produce different reach
    expect(scaled!.weaponReach).not.toBe(normal!.weaponReach);
  });
});
