import { XMLParser } from 'fast-xml-parser';
import fs from 'fs';
import path from 'path';
import { estimateSwingDamage, estimateThrustDamage } from './damage-calc';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => ['NPCCharacter', 'skill', 'equipment', 'EquipmentRoster', 'upgrade_target', 'Trait', 'Kingdom', 'Culture', 'Faction', 'Item', 'CraftedItem', 'Piece', 'CraftingPiece', 'Hero'].includes(name),
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
  // Hero data (from heroes.xslt / heroes.xml)
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

  // Also parse taom_spkingdoms.xml for custom kingdoms
  const xmlPath = path.join(dataDir, 'taom_spkingdoms.xml');
  if (fs.existsSync(xmlPath)) {
    const xml = fs.readFileSync(xmlPath, 'utf-8');
    const parsed = parser.parse(xml);
    const xmlKingdoms = parsed?.Kingdoms?.Kingdom || [];
    for (const k of xmlKingdoms) {
      kingdoms.push({
        id: k['@_id'] || '',
        name: stripLocKey(k['@_name'] || ''),
        shortName: stripLocKey(k['@_short_name'] || ''),
        title: stripLocKey(k['@_title'] || ''),
        rulerTitle: stripLocKey(k['@_ruler_title'] || ''),
        description: stripLocKey(k['@_text'] || ''),
        culture: stripPrefix(k['@_culture'] || '', 'Culture.'),
        owner: stripPrefix(k['@_owner'] || '', 'Hero.'),
        color: k['@_color'] || '',
        color2: k['@_color2'] || '',
        bannerKey: k['@_banner_key'] || '',
      });
    }
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

// Map clan ID prefix to kingdom ID
const CLAN_ID_TO_KINGDOM_ID: Record<string, string> = {
  empire_north: 'empire',
  empire_west: 'empire_w',
  empire_south: 'empire_s',
  sturgia: 'sturgia',
  aserai: 'aserai',
  vlandia: 'vlandia',
  battania: 'battania',
  khuzait: 'khuzait',
};

function getKingdomFromClanId(clanId: string): string {
  for (const [prefix, kingdom] of Object.entries(CLAN_ID_TO_KINGDOM)) {
    if (clanId.startsWith(`clan_${prefix}_`)) return kingdom;
  }
  return '';
}

function getKingdomIdFromClanId(clanId: string): string {
  for (const [prefix, kingdomId] of Object.entries(CLAN_ID_TO_KINGDOM_ID)) {
    if (clanId.startsWith(`clan_${prefix}_`)) return kingdomId;
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
          kingdomId: getKingdomIdFromClanId(id),
          culture: '',
          tier: 0,
          owner: '',
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
        kingdomId: superFaction,
        culture: stripPrefix(f['@_culture'] || '', 'Culture.'),
        tier: parseInt(f['@_tier'], 10) || 0,
        owner: stripPrefix(f['@_owner'] || '', 'Hero.'),
        bannerKey: f['@_banner_key'] || '',
      });
    }
  }

  return clans;
}

export function parseClansFromXslt(): Clan[] {
  return parseAllClans();
}

// Parse hero data (family relationships, biography, clan) from heroes.xslt and heroes.xml
interface HeroData {
  id: string;
  spouse: string;
  father: string;
  mother: string;
  biography: string;
  clan: string;
  alive: boolean;
}

function parseHeroData(): Map<string, HeroData> {
  const dataDir = getDataDir();
  const heroMap = new Map<string, HeroData>();

  function getOrCreate(id: string): HeroData {
    if (!heroMap.has(id)) {
      heroMap.set(id, { id, spouse: '', father: '', mother: '', biography: '', clan: '', alive: true });
    }
    return heroMap.get(id)!;
  }

  // 1. Parse vanilla_heroes.xml (base game hero-to-clan mappings)
  const vanillaPath = path.join(dataDir, 'vanilla_heroes.xml');
  if (fs.existsSync(vanillaPath)) {
    const xml = fs.readFileSync(vanillaPath, 'utf-8');
    const parsed = parser.parse(xml);
    const heroes = parsed?.Heroes?.Hero || [];
    for (const h of heroes) {
      const id = h['@_id'] || '';
      if (!id) continue;
      const hero = getOrCreate(id);
      hero.clan = stripPrefix(h['@_faction'] || '', 'Faction.');
      if (h['@_spouse']) hero.spouse = stripPrefix(h['@_spouse'], 'Hero.');
      if (h['@_father']) hero.father = stripPrefix(h['@_father'], 'Hero.');
      if (h['@_mother']) hero.mother = stripPrefix(h['@_mother'], 'Hero.');
      if (h['@_alive'] === 'false') hero.alive = false;
      if (h['@_text']) hero.biography = stripLocKey(h['@_text']);
    }
  }

  // 2. Parse characters/heroes.xml (custom culture heroes - overrides vanilla)
  const heroesXmlPath = path.join(dataDir, 'characters', 'heroes.xml');
  if (fs.existsSync(heroesXmlPath)) {
    const xml = fs.readFileSync(heroesXmlPath, 'utf-8');
    const parsed = parser.parse(xml);
    const heroes = parsed?.Heroes?.Hero || [];
    for (const h of heroes) {
      const id = h['@_id'] || '';
      if (!id) continue;
      const hero = getOrCreate(id);
      if (h['@_faction']) hero.clan = stripPrefix(h['@_faction'], 'Faction.');
      if (h['@_spouse']) hero.spouse = stripPrefix(h['@_spouse'], 'Hero.');
      if (h['@_father']) hero.father = stripPrefix(h['@_father'], 'Hero.');
      if (h['@_mother']) hero.mother = stripPrefix(h['@_mother'], 'Hero.');
      if (h['@_alive'] === 'false') hero.alive = false;
      if (h['@_text']) hero.biography = stripLocKey(h['@_text']);
    }
  }

  // 3. Parse heroes.xslt (overrides biography, spouse, father, mother for XSLT lords)
  const xsltPath = path.join(dataDir, 'heroes.xslt');
  if (fs.existsSync(xsltPath)) {
    const content = fs.readFileSync(xsltPath, 'utf-8');
    const templateRegex = /match="Hero\[@id='([^']+)'\]"[\s\S]*?<\/xsl:template>/g;
    let match;
    while ((match = templateRegex.exec(content)) !== null) {
      const id = match[1];
      const block = match[0];
      const hero = getOrCreate(id);

      const textMatch = block.match(/name="text">([^<]+)<\/xsl:attribute>/);
      if (textMatch) hero.biography = stripLocKey(textMatch[1].trim());

      const spouseMatch = block.match(/name="spouse">([^<]+)<\/xsl:attribute>/);
      if (spouseMatch) hero.spouse = stripPrefix(spouseMatch[1].trim(), 'Hero.');

      const fatherMatch = block.match(/name="father">([^<]+)<\/xsl:attribute>/);
      if (fatherMatch) hero.father = stripPrefix(fatherMatch[1].trim(), 'Hero.');

      const motherMatch = block.match(/name="mother">([^<]+)<\/xsl:attribute>/);
      if (motherMatch) hero.mother = stripPrefix(motherMatch[1].trim(), 'Hero.');
    }
  }

  return heroMap;
}

export function parseAllLords(): Lord[] {
  const lords: Lord[] = [];
  const dataDir = getDataDir();

  // 1. Parse XSLT lords (vanilla overrides with full skill/trait data)
  const xsltPath = path.join(dataDir, 'lords.xslt');
  if (fs.existsSync(xsltPath)) {
    const content = fs.readFileSync(xsltPath, 'utf-8');
    const templateRegex = /match="NPCCharacter\[@id='([^']+)'\]"[\s\S]*?<\/xsl:template>/g;
    let match;
    while ((match = templateRegex.exec(content)) !== null) {
      const id = match[1];
      const block = match[0];

      const nameMatch = block.match(/name="name">([^<]+)<\/xsl:attribute>/);
      if (!nameMatch) continue;

      const groupMatch = block.match(/name="default_group">([^<]+)<\/xsl:attribute>/);
      const femaleMatch = block.match(/name="is_female">([^<]+)<\/xsl:attribute>/);

      // Parse skills
      const skills: Record<string, number> = {};
      const skillRegex = /<skill\s+id="([^"]+)"\s+value="(\d+)"/g;
      let skillMatch;
      while ((skillMatch = skillRegex.exec(block)) !== null) {
        skills[skillMatch[1]] = parseInt(skillMatch[2], 10);
      }

      // Parse traits
      const traits: Record<string, number> = {};
      const traitRegex = /<Trait\s+id="([^"]+)"\s+value="(-?\d+)"/g;
      let traitMatch;
      while ((traitMatch = traitRegex.exec(block)) !== null) {
        traits[traitMatch[1]] = parseInt(traitMatch[2], 10);
      }

      lords.push({
        id,
        name: stripLocKey(nameMatch[1].trim()),
        culture: '',
        defaultGroup: groupMatch ? groupMatch[1].trim() : '',
        isFemale: femaleMatch ? femaleMatch[1].trim() === 'true' : false,
        skills,
        traits,
        clan: '',
        kingdom: '',
        spouse: '',
        father: '',
        mother: '',
        children: [],
        biography: '',
        alive: true,
        age: 0,
      });
    }
  }

  // 2. Parse lords.xml (new custom lords)
  const lordsXmlPath = path.join(dataDir, 'characters', 'lords.xml');
  if (fs.existsSync(lordsXmlPath)) {
    const xml = fs.readFileSync(lordsXmlPath, 'utf-8');
    const parsed = parser.parse(xml);
    const npcs = parsed?.NPCCharacters?.NPCCharacter || [];
    for (const npc of npcs) {
      const skillsList = npc.skills?.skill || [];
      const skills: Record<string, number> = {};
      for (const s of skillsList) {
        if (s['@_id'] && s['@_value']) {
          skills[s['@_id']] = parseInt(s['@_value'], 10) || 0;
        }
      }

      const traitsList = npc.Traits?.Trait || [];
      const traits: Record<string, number> = {};
      for (const t of traitsList) {
        if (t['@_id'] && t['@_value'] !== undefined) {
          traits[t['@_id']] = parseInt(t['@_value'], 10) || 0;
        }
      }

      lords.push({
        id: npc['@_id'] || '',
        name: stripLocKey(npc['@_name'] || ''),
        culture: stripPrefix(npc['@_culture'] || '', 'Culture.'),
        defaultGroup: npc['@_default_group'] || '',
        isFemale: npc['@_is_female'] === 'true',
        skills,
        traits,
        clan: '',
        kingdom: '',
        spouse: '',
        father: '',
        mother: '',
        children: [],
        biography: '',
        alive: true,
        age: parseInt(npc['@_age'], 10) || 0,
      });
    }
  }

  // 3. Merge hero data (family, biography, clan)
  const heroData = parseHeroData();
  const lordMap = new Map<string, Lord>();
  for (const lord of lords) {
    lordMap.set(lord.id, lord);
  }

  // Parse clans for kingdom mapping
  const clans = parseAllClans();
  const clanToKingdom = new Map<string, string>();
  const clanToCulture = new Map<string, string>();
  for (const clan of clans) {
    clanToKingdom.set(clan.id, clan.kingdom);
    if (clan.culture) clanToCulture.set(clan.id, clan.culture);
  }

  for (const lord of lords) {
    const hero = heroData.get(lord.id);
    if (!hero) continue;

    lord.spouse = hero.spouse;
    lord.father = hero.father;
    lord.mother = hero.mother;
    lord.biography = hero.biography;
    lord.alive = hero.alive;

    if (hero.clan) {
      lord.clan = hero.clan;
      lord.kingdom = clanToKingdom.get(hero.clan) || '';
      if (!lord.culture && clanToCulture.get(hero.clan)) {
        lord.culture = clanToCulture.get(hero.clan)!;
      }
    }
  }

  // Build children arrays from father/mother references
  for (const lord of lords) {
    if (lord.father) {
      const parent = lordMap.get(lord.father);
      if (parent) parent.children.push(lord.id);
    }
    if (lord.mother) {
      const parent = lordMap.get(lord.mother);
      if (parent && !parent.children.includes(lord.id)) parent.children.push(lord.id);
    }
  }

  // Derive culture from clan ID prefix for lords that still have no culture
  for (const lord of lords) {
    if (!lord.culture && lord.clan) {
      const clanCulture = deriveCultureFromClanId(lord.clan);
      if (clanCulture) lord.culture = clanCulture;
    }
  }

  return lords;
}

function deriveCultureFromClanId(clanId: string): string {
  const prefixMap: Record<string, string> = {
    clan_empire_north: 'empire',
    clan_empire_west: 'gondor',
    clan_empire_south: 'mordor',
    clan_sturgia: 'sturgia',
    clan_aserai: 'aserai',
    clan_vlandia: 'vlandia',
    clan_battania: 'battania',
    clan_khuzait: 'khuzait',
    clan_erebor: 'erebor',
    clan_rivendell: 'rivendell',
    clan_mirkwood: 'mirkwood',
    clan_lothlorien: 'lothlorien',
    clan_isengard: 'isengard',
    clan_gundabad: 'gundabad',
    clan_umbar: 'umbar',
    clan_dolguldur: 'dolguldur',
    clan_gondor: 'gondor',
    clan_mordor: 'mordor',
  };
  for (const [prefix, culture] of Object.entries(prefixMap)) {
    if (clanId.startsWith(prefix)) return culture;
  }
  return '';
}

// Parse hero-to-clan mappings from vanilla + custom heroes.xml
// Returns a map of hero/lord ID → clan ID
export function parseHeroClanMap(): Map<string, string> {
  const map = new Map<string, string>();
  const dataDir = getDataDir();

  // 1. Parse vanilla heroes.xml (base game hero-to-clan mappings)
  const vanillaPath = path.join(dataDir, 'vanilla_heroes.xml');
  if (fs.existsSync(vanillaPath)) {
    const xml = fs.readFileSync(vanillaPath, 'utf-8');
    const parsed = parser.parse(xml);
    const heroes = parsed?.Heroes?.Hero || [];
    for (const h of heroes) {
      const id = h['@_id'] || '';
      const faction = stripPrefix(h['@_faction'] || '', 'Faction.');
      if (id && faction) {
        map.set(id, faction);
      }
    }
  }

  // 2. Parse custom heroes.xml (overrides/additions for custom cultures)
  const heroesXmlPath = path.join(dataDir, 'characters', 'heroes.xml');
  if (fs.existsSync(heroesXmlPath)) {
    const xml = fs.readFileSync(heroesXmlPath, 'utf-8');
    const parsed = parser.parse(xml);
    const heroes = parsed?.Heroes?.Hero || [];
    for (const h of heroes) {
      const id = h['@_id'] || '';
      const faction = stripPrefix(h['@_faction'] || '', 'Faction.');
      if (id && faction) {
        map.set(id, faction); // Custom overrides vanilla
      }
    }
  }

  return map;
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
  estimatedSwingDamage: number;
  estimatedThrustDamage: number;
  isVanilla: boolean;
}

interface BladeDamage {
  swingDamage: number;
  swingDamageType: string;
  thrustDamage: number;
  thrustDamageType: string;
  length: number;
  bladeWeight: number;
}

function parseCraftingPiecesFromFile(filePath: string, bladeMap: Map<string, BladeDamage>): void {
  if (!fs.existsSync(filePath)) return;
  const xml = fs.readFileSync(filePath, 'utf-8');
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
      bladeWeight: parseFloat(piece['@_weight']) || 0,
    });
  }
}

function parseCraftingPieces(armoryDir: string): Map<string, BladeDamage> {
  const bladeMap = new Map<string, BladeDamage>();
  // LOTRAOM crafting pieces
  parseCraftingPiecesFromFile(path.join(armoryDir, 'LOTRLOME_crafting_pieces.xml'), bladeMap);
  // Vanilla crafting pieces
  parseCraftingPiecesFromFile(path.join(armoryDir, 'vanilla_crafting_pieces.xml'), bladeMap);
  return bladeMap;
}

function parseCraftedWeapons(
  filePath: string,
  bladeMap: Map<string, BladeDamage>,
  isVanilla: boolean,
): WeaponItem[] {
  if (!fs.existsSync(filePath)) return [];
  const xml = fs.readFileSync(filePath, 'utf-8');
  const parsed = parser.parse(xml);
  const items: WeaponItem[] = [];

  const craftedItems = parsed?.Items?.CraftedItem || [];
  for (const item of craftedItems) {
    const pieces = item.Pieces?.Piece || [];
    const bladePiece = pieces.find((p: any) => p['@_Type'] === 'Blade');
    const blade = bladePiece ? bladeMap.get(bladePiece['@_id'] || '') : undefined;

    const swingFactor = blade?.swingDamage || 0;
    const thrustFactor = blade?.thrustDamage || 0;
    const bladeWeight = blade?.bladeWeight || 0;

    items.push({
      id: item['@_id'] || '',
      name: stripLocKey(item['@_name'] || ''),
      culture: stripPrefix(item['@_culture'] || '', 'Culture.'),
      weaponClass: item['@_crafting_template'] || '',
      type: 'Weapon',
      craftingTemplate: item['@_crafting_template'] || '',
      weight: bladeWeight,
      difficulty: parseInt(item['@_difficulty']) || 0,
      appearance: parseFloat(item['@_appearance']) || 0,
      swingDamage: swingFactor,
      swingDamageType: blade?.swingDamageType || '',
      thrustDamage: thrustFactor,
      thrustDamageType: blade?.thrustDamageType || '',
      weaponLength: blade?.length || 0,
      speed: 0,
      missileSpeed: 0,
      accuracy: 0,
      bodyArmor: 0,
      hitPoints: 0,
      isMerchandise: item['@_is_merchandise'] === 'true',
      estimatedSwingDamage: estimateSwingDamage(bladeWeight, swingFactor),
      estimatedThrustDamage: estimateThrustDamage(bladeWeight, thrustFactor),
      isVanilla,
    });
  }

  // Item weapons (bows, crossbows, etc.) with direct stats
  const xmlItems = parsed?.Items?.Item || [];
  for (const item of xmlItems) {
    const weapon = item.ItemComponent?.Weapon;
    if (!weapon) continue;
    const wClass = weapon['@_weapon_class'] || '';
    const thrustDmg = parseInt(weapon['@_thrust_damage']) || 0;
    const swingDmg = parseInt(weapon['@_swing_damage']) || 0;

    items.push({
      id: item['@_id'] || '',
      name: stripLocKey(item['@_name'] || ''),
      culture: stripPrefix(item['@_culture'] || '', 'Culture.'),
      weaponClass: wClass,
      type: isBowClass(wClass) ? 'Bow' : 'Weapon',
      craftingTemplate: '',
      weight: parseFloat(item['@_weight']) || 0,
      difficulty: parseInt(item['@_difficulty']) || 0,
      appearance: parseFloat(item['@_appearance']) || 0,
      swingDamage: swingDmg,
      swingDamageType: weapon['@_swing_damage_type'] || '',
      thrustDamage: thrustDmg,
      thrustDamageType: weapon['@_thrust_damage_type'] || '',
      weaponLength: parseInt(weapon['@_weapon_length']) || 0,
      speed: parseInt(weapon['@_speed_rating']) || 0,
      missileSpeed: parseInt(weapon['@_missile_speed']) || 0,
      accuracy: parseInt(weapon['@_accuracy']) || 0,
      bodyArmor: 0,
      hitPoints: 0,
      isMerchandise: item['@_is_merchandise'] === 'true',
      // For Item weapons, the damage stat IS the estimated damage
      estimatedSwingDamage: swingDmg,
      estimatedThrustDamage: thrustDmg,
      isVanilla,
    });
  }

  return items;
}

function isBowClass(weaponClass: string): boolean {
  return ['Bow', 'Crossbow', 'Arrow', 'Bolt'].includes(weaponClass);
}

export function parseWeaponry(): WeaponItem[] {
  const dataDir = getDataDir();
  const armoryDir = path.join(dataDir, 'armory');
  if (!fs.existsSync(armoryDir)) return [];

  const bladeMap = parseCraftingPieces(armoryDir);
  const items: WeaponItem[] = [];

  // Parse LOTRAOM weapons
  items.push(...parseCraftedWeapons(path.join(armoryDir, 'LOTRAOM_weapons.xml'), bladeMap, false));

  // Parse vanilla weapons
  items.push(...parseCraftedWeapons(path.join(armoryDir, 'vanilla_weapons.xml'), bladeMap, true));

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
        estimatedSwingDamage: 0,
        estimatedThrustDamage: 0,
        isVanilla: false,
      });
    }
  }

  return items;
}
