import { describe, it, expect } from 'vitest';
import { parseArmory, parseWeaponry } from '../parse-xml';

describe('release equipment catalogue', () => {
  const armour = parseArmory();
  const weapons = parseWeaponry();

  it('includes crafted and ranged weapons stored in culture folders', () => {
    const spear = weapons.find((item) => item.id === 'hr_st_spear_light_a');
    expect(spear).toMatchObject({ culture: 'aserai', type: 'Weapon', weaponClass: 'TwoHandedPolearm' });
    expect(spear?.estimatedThrustDamage).toBeGreaterThan(0);
    expect(spear?.weaponLength).toBeGreaterThan(0);
    expect(weapons.find((item) => item.id === 'hr_st_longbow_light')).toMatchObject({
      type: 'Bow',
      missileSpeed: 77,
      estimatedThrustDamage: 50,
    });
    expect(weapons.find((item) => item.id === 'hr_st_arrows_a')).toMatchObject({
      weaponClass: 'Arrow',
      type: 'Bow',
    });
  });

  it('keeps culture-folder shields in the shield category with their protection stats', () => {
    expect(weapons.find((item) => item.id === 'sm_sg_st_shield_cav_light_a')).toMatchObject({
      culture: 'shaghana',
      type: 'Shield',
      bodyArmor: 6,
      hitPoints: 290,
      speed: 88,
    });
    expect(weapons.find((item) => item.id === 'sm_gd_shield_b1')?.type).toBe('Shield');
  });

  it('includes the refreshed armour without keeping removed Harad pieces', () => {
    expect(armour.find((item) => item.id === 'sk_hr_st_bracer_heavy_a')).toMatchObject({
      culture: 'harad',
      slot: 'Arm',
    });
    expect(armour.some((item) => item.id === 'haradrim_gloves')).toBe(false);
    expect(
      armour.every((item) => ['Head', 'Body', 'Leg', 'Arm', 'Shoulder', 'Mount', 'Starter'].includes(item.slot)),
    ).toBe(true);
    expect(armour.find((item) => item.id === 'sk_hr_pz_camel_bard_light_a')).toMatchObject({
      type: 'HorseHarness',
      slot: 'Mount',
    });
  });

  it('excludes generated twins and bow ladders while retaining regular starter armour', () => {
    const items = [...armour, ...weapons];
    expect(items.some((item) => item.id.startsWith('ladder_'))).toBe(false);
    expect(items.some((item) => item.id === 'starter_aserai_sword_3_t3')).toBe(false);
    expect(armour.some((item) => item.slot === 'Starter')).toBe(true);
    expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
  });
});
