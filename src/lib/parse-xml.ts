import { XMLParser } from 'fast-xml-parser';
import fs from 'fs';
import path from 'path';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => ['NPCCharacter', 'skill', 'equipment', 'EquipmentRoster', 'upgrade_target', 'Trait', 'Kingdom', 'Culture', 'Faction', 'Item', 'CraftedItem', 'Piece', 'CraftingPiece'].includes(name),
});

function getDataDir(): string {
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
  // Skills
  athletics: number;
  riding: number;
  oneHanded: number;
  twoHanded: number;
  polearm: number;
  bow: number;
  crossbow: number;
  throwing: number;
  // Equipment (first non-civilian roster)
  item0: string;
  item1: string;
  item2: string;
  item3: string;
  head: string;
  body: string;
  leg: string;
  glove: string;
  cape: string;
  // Upgrade targets
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
  culture: string;
  tier: number;
  bannerKey: string;
}

// --- Helpers ---

function stripLocKey(name: string): string {
  if (!name) return '';
  // Remove {=key} prefix: "{=aom_foo}Bar" → "Bar"
  return name.replace(/^\{=[^}]*\}/, '').replace(/^\{\{=[^}]*\}\}/, '');
}

function stripPrefix(val: string, prefix: string): string {
  if (!val) return '';
  return val.startsWith(prefix) ? val.slice(prefix.length) : val;
}

function getSkillValue(skills: any[], skillId: string): number {
  if (!skills) return 0;
  const skill = skills.find((s: any) => s['@_id'] === skillId);
  return skill ? parseInt(skill['@_value'], 10) || 0 : 0;
}

function getEquipSlot(equipment: any[], slot: string): string {
  if (!equipment) return '';
  const eq = equipment.find((e: any) => e['@_slot'] === slot);
  return eq ? stripPrefix(eq['@_id'] || '', 'Item.') : '';
}

// --- Parsers ---

export function parseTroops(): Troop[] {
  const dataDir = getDataDir();
  const troopsDir = path.join(dataDir, 'troops');
  const charsDir = path.join(dataDir, 'characters');
  const troops: Troop[] = [];

  // Parse troop files
  const troopFiles = fs.readdirSync(troopsDir).filter(f => f.startsWith('troops_') && f.endsWith('.xml'));
  for (const file of troopFiles) {
    const xml = fs.readFileSync(path.join(troopsDir, file), 'utf-8');
    const parsed = parser.parse(xml);
    const npcs = parsed?.NPCCharacters?.NPCCharacter;
    if (!npcs) continue;
    for (const npc of npcs) {
      troops.push(parseNpc(npc));
    }
  }

  return troops;
}

function parseNpc(npc: any): Troop {
  const skills = npc.skills?.skill || [];

  // Get first non-civilian equipment roster
  const rosters = npc.Equipments?.EquipmentRoster || [];
  const battleRoster = rosters.find((r: any) => r['@_civilian'] !== 'true') || rosters[0];
  const equipment = battleRoster?.equipment || [];

  const upgradeTargets = npc.upgrade_targets?.upgrade_target || [];

  return {
    id: npc['@_id'] || '',
    name: stripLocKey(npc['@_name'] || ''),
    culture: stripPrefix(npc['@_culture'] || '', 'Culture.'),
    race: npc['@_race'] || '',
    defaultGroup: npc['@_default_group'] || '',
    level: parseInt(npc['@_level'], 10) || 0,
    occupation: npc['@_occupation'] || '',
    isBasicTroop: npc['@_is_basic_troop'] === 'true',
    faceTemplate: npc.face?.face_key_template?.['@_value'] || '',
    // Skills
    athletics: getSkillValue(skills, 'Athletics'),
    riding: getSkillValue(skills, 'Riding'),
    oneHanded: getSkillValue(skills, 'OneHanded'),
    twoHanded: getSkillValue(skills, 'TwoHanded'),
    polearm: getSkillValue(skills, 'Polearm'),
    bow: getSkillValue(skills, 'Bow'),
    crossbow: getSkillValue(skills, 'Crossbow'),
    throwing: getSkillValue(skills, 'Throwing'),
    // Equipment
    item0: getEquipSlot(equipment, 'Item0'),
    item1: getEquipSlot(equipment, 'Item1'),
    item2: getEquipSlot(equipment, 'Item2'),
    item3: getEquipSlot(equipment, 'Item3'),
    head: getEquipSlot(equipment, 'Head'),
    body: getEquipSlot(equipment, 'Body'),
    leg: getEquipSlot(equipment, 'Leg'),
    glove: getEquipSlot(equipment, 'Gloves'),
    cape: getEquipSlot(equipment, 'Cape'),
    // Upgrades
    upgradeTo: upgradeTargets.map((u: any) => stripPrefix(u['@_id'] || '', 'NPCCharacter.')),
  };
}

export function parseKingdomsFromXslt(): Kingdom[] {
  const dataDir = getDataDir();
  const xsltPath = path.join(dataDir, 'spkingdoms.xslt');
  if (!fs.existsSync(xsltPath)) return [];

  const content = fs.readFileSync(xsltPath, 'utf-8');
  const kingdoms: Kingdom[] = [];

  // Parse Kingdom elements from XSLT templates
  const kingdomRegex = /<Kingdom\s+([^>]+)>/gs;
  let match;
  while ((match = kingdomRegex.exec(content)) !== null) {
    const attrs = match[1];
    const getAttr = (name: string) => {
      const m = attrs.match(new RegExp(`${name}="([^"]*)"`, 's'));
      return m ? m[1] : '';
    };
    kingdoms.push({
      id: getAttr('id'),
      name: stripLocKey(getAttr('name')),
      shortName: stripLocKey(getAttr('short_name')),
      title: stripLocKey(getAttr('title')),
      rulerTitle: stripLocKey(getAttr('ruler_title')),
      description: stripLocKey(getAttr('text')),
      culture: stripPrefix(getAttr('culture'), 'Culture.'),
      owner: stripPrefix(getAttr('owner'), 'Hero.'),
      color: getAttr('color'),
      color2: getAttr('color2'),
      bannerKey: getAttr('banner_key'),
    });
  }

  return kingdoms;
}

// Map XSLT clan ID prefixes to kingdom display names
const CLAN_ID_TO_KINGDOM: Record<string, string> = {
  empire_north: 'Dunland',
  empire_west: 'Gondor',
  empire_south: 'Mordor',
  sturgia: 'Dale',
  aserai: 'Harad',
  vlandia: 'Rohan',
  battania: 'Khand',
  khuzait: 'Rhun',
};

// Map super_faction kingdom IDs to display names
const KINGDOM_ID_TO_NAME: Record<string, string> = {
  empire_w: 'Gondor',
  empire_s: 'Mordor',
  empire: 'Dunland',
  vlandia: 'Rohan',
  khuzait: 'Rhun',
  sturgia: 'Dale',
  aserai: 'Harad',
  battania: 'Khand',
  erebor: 'Erebor',
  rivendell: 'Rivendell',
  mirkwood: 'Mirkwood',
  lothlorien: 'Lothlorien',
  isengard: 'Isengard',
  gundabad: 'Gundabad',
  umbar: 'Umbar',
  dolguldur: 'Dol Guldur',
};

function getKingdomFromClanId(clanId: string): string {
  for (const [prefix, kingdom] of Object.entries(CLAN_ID_TO_KINGDOM)) {
    if (clanId.startsWith(`clan_${prefix}_`)) return kingdom;
  }
  return '';
}

export function parseAllClans(): Clan[] {
  const clans: Clan[] = [];

  // 1. Parse XSLT clans (vanilla overrides)
  const dataDir = getDataDir();
  const xsltPath = path.join(dataDir, 'spclans.xslt');
  if (fs.existsSync(xsltPath)) {
    const content = fs.readFileSync(xsltPath, 'utf-8');
    const templateRegex = /match="Faction\[@id='([^']+)'\]"[\s\S]*?<\/xsl:template>/g;
    let match;
    while ((match = templateRegex.exec(content)) !== null) {
      const id = match[1];
      const block = match[0];

      const nameMatch = block.match(/name="name"[^>]*>([^<]*)<\/xsl:attribute>/s)
        || block.match(/name="name">([^<]+)</);
      const bannerMatch = block.match(/name="banner_key"[^>]*>([^<]*)<\/xsl:attribute>/s)
        || block.match(/name="banner_key">([^<]+)</);

      if (nameMatch) {
        clans.push({
          id,
          name: stripLocKey(nameMatch[1].trim()),
          kingdom: getKingdomFromClanId(id),
          culture: '',
          tier: 0,
          bannerKey: bannerMatch ? bannerMatch[1].trim() : '',
        });
      }
    }
  }

  // 2. Parse clans.xml (new custom culture clans)
  const clansXmlPath = path.join(dataDir, 'characters', 'clans.xml');
  if (fs.existsSync(clansXmlPath)) {
    const xml = fs.readFileSync(clansXmlPath, 'utf-8');
    const parsed = parser.parse(xml);
    const factions = parsed?.Factions?.Faction || [];
    for (const f of factions) {
      const superFaction = stripPrefix(f['@_super_faction'] || '', 'Kingdom.');
      const kingdom = KINGDOM_ID_TO_NAME[superFaction] || superFaction;
      clans.push({
        id: f['@_id'] || '',
        name: stripLocKey(f['@_name'] || ''),
        kingdom,
        culture: stripPrefix(f['@_culture'] || '', 'Culture.'),
        tier: parseInt(f['@_tier'], 10) || 0,
        bannerKey: f['@_banner_key'] || '',
      });
    }
  }

  return clans;
}

export function parseClansFromXslt(): Clan[] {
  return parseAllClans();
}

export function getCultureList(): string[] {
  const troops = parseTroops();
  const cultures = new Set(troops.map(t => t.culture).filter(Boolean));
  return Array.from(cultures).sort();
}

// --- Armor ---

export interface ArmorItem {
  id: string;
  name: string;
  culture: string;
  type: string;       // HeadArmor, BodyArmor, LegArmor, HandArmor, Cape
  slot: string;       // head, body, leg, arm, shoulder
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

// Map subfolder name to slot display name
const ARMOR_SLOT_MAP: Record<string, string> = {
  head_armors: 'Head',
  body_armors: 'Body',
  leg_armors: 'Leg',
  arm_armors: 'Arm',
  shoulder_armors: 'Shoulder',
};

export function parseArmory(): ArmorItem[] {
  const dataDir = getDataDir();
  const armoryDir = path.join(dataDir, 'armory');
  if (!fs.existsSync(armoryDir)) return [];

  const items: ArmorItem[] = [];
  const cultureDirs = fs.readdirSync(armoryDir).filter(d => {
    const full = path.join(armoryDir, d);
    return fs.statSync(full).isDirectory();
  });

  for (const culture of cultureDirs) {
    const cultureDir = path.join(armoryDir, culture);
    const files = fs.readdirSync(cultureDir).filter(f => f.endsWith('.xml'));
    for (const file of files) {
      const slotKey = file.replace('.xml', '');
      const slot = ARMOR_SLOT_MAP[slotKey] || slotKey;
      const xml = fs.readFileSync(path.join(cultureDir, file), 'utf-8');
      const parsed = parser.parse(xml);
      const xmlItems = parsed?.Items?.Item || [];
      for (const item of xmlItems) {
        const armor = item.ItemComponent?.Armor;
        // Use folder name as culture — it's the real grouping (e.g. thenn, iron_hills)
        items.push({
          id: item['@_id'] || '',
          name: stripLocKey(item['@_name'] || ''),
          culture: culture,
          type: item['@_Type'] || '',
          slot,
          weight: parseFloat(item['@_weight']) || 0,
          appearance: parseFloat(item['@_appearance']) || 0,
          headArmor: parseInt(armor?.['@_head_armor']) || 0,
          bodyArmor: parseInt(armor?.['@_body_armor']) || 0,
          armArmor: parseInt(armor?.['@_arm_armor']) || 0,
          legArmor: parseInt(armor?.['@_leg_armor']) || 0,
          materialType: armor?.['@_material_type'] || '',
          modifierGroup: armor?.['@_modifier_group'] || '',
          isMerchandise: item['@_is_merchandise'] === 'true',
        });
      }
    }
  }

  return items;
}

// --- Weapons & Shields ---

export interface WeaponItem {
  id: string;
  name: string;
  culture: string;
  weaponClass: string;
  type: string;           // Weapon, Bow, or Shield
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
  missileSpeed: number;   // bows only
  accuracy: number;       // bows only
  bodyArmor: number;      // shields only
  hitPoints: number;      // shields only
  isMerchandise: boolean;
}

interface BladeDamage {
  swingDamage: number;
  swingDamageType: string;
  thrustDamage: number;
  thrustDamageType: string;
  length: number;
}

function parseCraftingPieces(armoryDir: string): Map<string, BladeDamage> {
  const bladeMap = new Map<string, BladeDamage>();
  const piecesPath = path.join(armoryDir, 'LOTRLOME_crafting_pieces.xml');
  if (!fs.existsSync(piecesPath)) return bladeMap;

  const xml = fs.readFileSync(piecesPath, 'utf-8');
  const parsed = parser.parse(xml);
  const pieces = parsed?.CraftingPieces?.CraftingPiece || [];
  for (const piece of pieces) {
    if (piece['@_piece_type'] !== 'Blade') continue;
    const blade = piece.BladeData;
    if (!blade) continue;
    const swing = blade.Swing;
    const thrust = blade.Thrust;
    bladeMap.set(piece['@_id'] || '', {
      swingDamage: parseFloat(swing?.['@_damage_factor']) || 0,
      swingDamageType: swing?.['@_damage_type'] || '',
      thrustDamage: parseFloat(thrust?.['@_damage_factor']) || 0,
      thrustDamageType: thrust?.['@_damage_type'] || '',
      length: parseFloat(piece['@_length']) || 0,
    });
  }
  return bladeMap;
}

export function parseWeaponry(): WeaponItem[] {
  const dataDir = getDataDir();
  const armoryDir = path.join(dataDir, 'armory');
  if (!fs.existsSync(armoryDir)) return [];

  const bladeMap = parseCraftingPieces(armoryDir);
  const items: WeaponItem[] = [];

  // Parse weapons file (CraftedItem + Item elements)
  const weaponsPath = path.join(armoryDir, 'LOTRAOM_weapons.xml');
  if (fs.existsSync(weaponsPath)) {
    const xml = fs.readFileSync(weaponsPath, 'utf-8');
    const parsed = parser.parse(xml);

    // CraftedItem weapons - look up blade damage from crafting pieces
    const craftedItems = parsed?.Items?.CraftedItem || [];
    for (const item of craftedItems) {
      const pieces = item.Pieces?.Piece || [];
      const bladePiece = pieces.find((p: any) => p['@_Type'] === 'Blade');
      const blade = bladePiece ? bladeMap.get(bladePiece['@_id'] || '') : undefined;

      items.push({
        id: item['@_id'] || '',
        name: stripLocKey(item['@_name'] || ''),
        culture: stripPrefix(item['@_culture'] || '', 'Culture.'),
        weaponClass: item['@_crafting_template'] || '',
        type: 'Weapon',
        craftingTemplate: item['@_crafting_template'] || '',
        weight: parseFloat(item['@_weight']) || 0,
        difficulty: parseInt(item['@_difficulty']) || 0,
        appearance: parseFloat(item['@_appearance']) || 0,
        swingDamage: blade?.swingDamage || 0,
        swingDamageType: blade?.swingDamageType || '',
        thrustDamage: blade?.thrustDamage || 0,
        thrustDamageType: blade?.thrustDamageType || '',
        weaponLength: blade?.length || 0,
        speed: 0,
        missileSpeed: 0,
        accuracy: 0,
        bodyArmor: 0,
        hitPoints: 0,
        isMerchandise: item['@_is_merchandise'] === 'true',
      });
    }

    // Item weapons (bows, etc.) - stats directly on Weapon component
    const xmlItems = parsed?.Items?.Item || [];
    for (const item of xmlItems) {
      const weapon = item.ItemComponent?.Weapon;
      if (!weapon) continue;
      const wClass = weapon['@_weapon_class'] || '';
      items.push({
        id: item['@_id'] || '',
        name: stripLocKey(item['@_name'] || ''),
        culture: stripPrefix(item['@_culture'] || '', 'Culture.'),
        weaponClass: wClass,
        type: 'Bow',
        craftingTemplate: '',
        weight: parseFloat(item['@_weight']) || 0,
        difficulty: parseInt(item['@_difficulty']) || 0,
        appearance: parseFloat(item['@_appearance']) || 0,
        swingDamage: 0,
        swingDamageType: '',
        thrustDamage: parseInt(weapon['@_thrust_damage']) || 0,
        thrustDamageType: weapon['@_thrust_damage_type'] || '',
        weaponLength: parseInt(weapon['@_weapon_length']) || 0,
        speed: parseInt(weapon['@_speed_rating']) || 0,
        missileSpeed: parseInt(weapon['@_missile_speed']) || 0,
        accuracy: parseInt(weapon['@_accuracy']) || 0,
        bodyArmor: 0,
        hitPoints: 0,
        isMerchandise: item['@_is_merchandise'] === 'true',
      });
    }
  }

  // Parse shields file (Item elements with Weapon component)
  const shieldsPath = path.join(armoryDir, 'LOTRAOM_shields.xml');
  if (fs.existsSync(shieldsPath)) {
    const xml = fs.readFileSync(shieldsPath, 'utf-8');
    const parsed = parser.parse(xml);
    const xmlItems = parsed?.Items?.Item || [];
    for (const item of xmlItems) {
      const weapon = item.ItemComponent?.Weapon;
      items.push({
        id: item['@_id'] || '',
        name: stripLocKey(item['@_name'] || ''),
        culture: stripPrefix(item['@_culture'] || '', 'Culture.'),
        weaponClass: weapon?.['@_weapon_class'] || 'Shield',
        type: 'Shield',
        craftingTemplate: '',
        weight: parseFloat(item['@_weight']) || 0,
        difficulty: parseInt(item['@_difficulty']) || 0,
        appearance: parseFloat(item['@_appearance']) || 0,
        swingDamage: 0,
        swingDamageType: '',
        thrustDamage: 0,
        thrustDamageType: '',
        weaponLength: parseInt(weapon?.['@_weapon_length']) || 0,
        speed: parseInt(weapon?.['@_speed_rating']) || 0,
        missileSpeed: 0,
        accuracy: 0,
        bodyArmor: parseInt(weapon?.['@_body_armor']) || 0,
        hitPoints: parseInt(weapon?.['@_hit_points']) || 0,
        isMerchandise: item['@_is_merchandise'] === 'true',
      });
    }
  }

  return items;
}
