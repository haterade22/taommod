import { describe, it, expect } from 'vitest';
import { getCultureDisplayName, isHiddenCulture } from '../parse-xml';

describe('getCultureDisplayName', () => {
  it('maps vanilla Bannerlord culture IDs to LOTR names', () => {
    expect(getCultureDisplayName('aserai')).toBe('Harad');
    expect(getCultureDisplayName('khuzait')).toBe('Rhun');
    expect(getCultureDisplayName('battania')).toBe('Khand');
    expect(getCultureDisplayName('empire')).toBe('Dunland');
    expect(getCultureDisplayName('vlandia')).toBe('Rohan');
    expect(getCultureDisplayName('sturgia')).toBe('Dale');
  });

  it('maps LOTR-native culture IDs directly', () => {
    expect(getCultureDisplayName('gondor')).toBe('Gondor');
    expect(getCultureDisplayName('mordor')).toBe('Mordor');
    expect(getCultureDisplayName('erebor')).toBe('Erebor');
    expect(getCultureDisplayName('isengard')).toBe('Isengard');
    expect(getCultureDisplayName('gundabad')).toBe('Gundabad');
    expect(getCultureDisplayName('mirkwood')).toBe('Mirkwood');
    expect(getCultureDisplayName('rivendell')).toBe('Rivendell');
    expect(getCultureDisplayName('umbar')).toBe('Umbar');
    expect(getCultureDisplayName('dolguldur')).toBe('Dol Guldur');
  });

  it('handles armory folder-name aliases', () => {
    expect(getCultureDisplayName('dunland')).toBe('Dunland');
    expect(getCultureDisplayName('dol_guldur')).toBe('Dol Guldur');
    expect(getCultureDisplayName('harad')).toBe('Harad');
    expect(getCultureDisplayName('rohan')).toBe('Rohan');
    expect(getCultureDisplayName('rhun')).toBe('Rhun');
    expect(getCultureDisplayName('lothlorien')).toBe('Lothlorien');
  });

  it('capitalizes unknown cultures', () => {
    expect(getCultureDisplayName('newculture')).toBe('Newculture');
    expect(getCultureDisplayName('abc')).toBe('Abc');
  });

  it('handles special cultures', () => {
    expect(getCultureDisplayName('thenn')).toBe('Mercenary');
    expect(getCultureDisplayName('mercenary')).toBe('Mercenary');
    expect(getCultureDisplayName('iron_hills')).toBe('Iron Hills');
    expect(getCultureDisplayName('arnor')).toBe('Arnor');
    expect(getCultureDisplayName('troll')).toBe('Troll');
  });
});

describe('isHiddenCulture', () => {
  it('returns true for hidden cultures', () => {
    expect(isHiddenCulture('lothlorien')).toBe(true);
    expect(isHiddenCulture('sturgia')).toBe(true);
  });

  it('returns false for visible cultures', () => {
    expect(isHiddenCulture('gondor')).toBe(false);
    expect(isHiddenCulture('mordor')).toBe(false);
    expect(isHiddenCulture('erebor')).toBe(false);
    expect(isHiddenCulture('aserai')).toBe(false);
  });
});
