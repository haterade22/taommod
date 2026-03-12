import { XMLParser } from 'fast-xml-parser';
import path from 'path';

export const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) =>
    [
      'NPCCharacter',
      'skill',
      'equipment',
      'EquipmentRoster',
      'upgrade_target',
      'Trait',
      'Kingdom',
      'Culture',
      'Faction',
      'Item',
      'CraftedItem',
      'Piece',
      'CraftingPiece',
      'Hero',
    ].includes(name),
});

export function getDataDir(): string {
  return path.resolve(process.cwd(), 'src', 'data');
}

// Map vanilla Bannerlord culture IDs to LOTR faction names
const CULTURE_DISPLAY_NAMES: Record<string, string> = {
  aserai: 'Harad',
  khuzait: 'Rhun',
  battania: 'Khand',
  empire: 'Dunland',
  vlandia: 'Rohan',
  sturgia: 'Dale',
  erebor: 'Erebor',
  gondor: 'Gondor',
  mordor: 'Mordor',
  isengard: 'Isengard',
  gundabad: 'Gundabad',
  mirkwood: 'Mirkwood',
  rivendell: 'Rivendell',
  umbar: 'Umbar',
  dolguldur: 'Dol Guldur',
  thenn: 'Mercenary',
  iron_hills: 'Iron Hills',
  arnor: 'Arnor',
  troll: 'Troll',
  mercenary: 'Mercenary',
  // Armory folder-name aliases
  dunland: 'Dunland',
  dol_guldur: 'Dol Guldur',
  harad: 'Harad',
  rohan: 'Rohan',
  rhun: 'Rhun',
  lothlorien: 'Lothlorien',
};

// Cultures to exclude from display
const HIDDEN_CULTURES = new Set(['lothlorien', 'sturgia']);

export function getCultureDisplayName(culture: string): string {
  return CULTURE_DISPLAY_NAMES[culture] || culture.charAt(0).toUpperCase() + culture.slice(1);
}

export function isHiddenCulture(culture: string): boolean {
  return HIDDEN_CULTURES.has(culture);
}

// --- Types ---

export interface Troop {
  id: string;
  name: string;
  culture: string;
  race: string;
  defaultGroup: string;
  level: number;
  occupation: string;
  isBasicTroop: boolean;
  faceTemplate: string;
  athletics: number;
  riding: number;
  oneHanded: number;
  twoHanded: number;
  polearm: number;
  bow: number;
  crossbow: number;
  throwing: number;
  item0: string;
  item1: string;
  item2: string;
  item3: string;
  head: string;
  body: string;
  leg: string;
  glove: string;
  cape: string;
  upgradeTo: string[];
}

export interface Kingdom {
  id: string;
  name: string;
  shortName: string;
  title: string;
  rulerTitle: string;
  description: string;
  culture: string;
  owner: string;
  color: string;
  color2: string;
  bannerKey: string;
}

export interface Clan {
  id: string;
  name: string;
  kingdom: string;
  kingdomId: string;
  culture: string;
  tier: number;
  owner: string;
  bannerKey: string;
}

export interface Lord {
  id: string;
  name: string;
  culture: string;
  defaultGroup: string;
  isFemale: boolean;
  skills: Record<string, number>;
  traits: Record<string, number>;
  clan: string;
  kingdom: string;
  spouse: string;
  father: string;
  mother: string;
  children: string[];
  biography: string;
  alive: boolean;
  age: number;
}

export interface ArmorItem {
  id: string;
  name: string;
  culture: string;
  type: string;
  slot: string;
  weight: number;
  appearance: number;
  headArmor: number;
  bodyArmor: number;
  armArmor: number;
  legArmor: number;
  materialType: string;
  modifierGroup: string;
  isMerchandise: boolean;
}

export interface WeaponItem {
  id: string;
  name: string;
  culture: string;
  weaponClass: string;
  type: string;
  craftingTemplate: string;
  weight: number;
  difficulty: number;
  appearance: number;
  swingDamage: number;
  swingDamageType: string;
  thrustDamage: number;
  thrustDamageType: string;
  weaponLength: number;
  speed: number;
  missileSpeed: number;
  accuracy: number;
  bodyArmor: number;
  hitPoints: number;
  isMerchandise: boolean;
  estimatedSwingDamage: number;
  estimatedThrustDamage: number;
  isVanilla: boolean;
}

// --- Helpers ---

export function stripLocKey(name: string): string {
  if (!name) return '';
  return name.replace(/^\{=[^}]*\}/, '').replace(/^\{\{=[^}]*\}\}/, '');
}

export function stripPrefix(val: string, prefix: string): string {
  if (!val) return '';
  return val.startsWith(prefix) ? val.slice(prefix.length) : val;
}

export function getSkillValue(skills: any[], skillId: string): number {
  if (!skills) return 0;
  const skill = skills.find((s: any) => s['@_id'] === skillId);
  return skill ? parseInt(skill['@_value'], 10) || 0 : 0;
}

export function getEquipSlot(equipment: any[], slot: string): string {
  if (!equipment) return '';
  const eq = equipment.find((e: any) => e['@_slot'] === slot);
  return eq ? stripPrefix(eq['@_id'] || '', 'Item.') : '';
}
