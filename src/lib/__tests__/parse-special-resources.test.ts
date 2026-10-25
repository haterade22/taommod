import { describe, expect, it } from 'vitest';
import { parseSpecialResources } from '../parse-special-resources';

describe('parseSpecialResources', () => {
  const data = parseSpecialResources();

  it('reads every resource with the realms that share it', () => {
    expect(data.resources.length).toBeGreaterThanOrEqual(11);
    const spoils = data.resources.find((r) => r.id === 'war_spoils');
    expect(spoils?.name).toBe('War Spoils');
    expect(spoils?.realms).toEqual(expect.arrayContaining(['Mordor', 'Isengard', 'Gundabad', 'Dol Guldur']));
  });

  it('gives every costed troop a readable name and a known resource', () => {
    const ids = new Set(data.resources.map((r) => r.id));
    const all = data.troopsByResource.flatMap((g) => g.troops);
    expect(all.length).toBeGreaterThan(50);
    for (const t of all) {
      expect(ids.has(t.resourceId)).toBe(true);
      expect(t.name).not.toMatch(/_/);
    }
  });

  it('names the emissary towns', () => {
    expect(data.emissaryTowns.map((t) => t.name)).toContain('Minas Tirith');
  });
});
