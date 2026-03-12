/**
 * Barrel re-export for all XML parsing modules.
 * Keeps existing imports working: `from '../lib/parse-xml'`
 */

// Shared types and utilities
export type { Troop, Kingdom, Clan, Lord, ArmorItem, WeaponItem } from './xml-shared';
export { getCultureDisplayName, isHiddenCulture } from './xml-shared';

// Domain parsers
export { parseTroops, getCultureList } from './parse-troops';
export { parseKingdomsFromXslt } from './parse-kingdoms';
export { parseAllClans, parseClansFromXslt } from './parse-clans';
export { parseAllLords, parseHeroClanMap } from './parse-lords';
export { parseArmory } from './parse-armory';
export { parseWeaponry } from './parse-weaponry';
