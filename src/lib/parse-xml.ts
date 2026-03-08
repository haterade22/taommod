import { XMLParser } from 'fast-xml-parser';
import fs from 'fs';
import path from 'path';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => ['NPCCharacter', 'skill', 'equipment', 'EquipmentRoster', 'upgrade_target', 'Trait', 'Kingdom', 'Culture', 'Faction'].includes(name),
});

function getDataDir(): string {
  return path.resolve(process.cwd(), 'src', 'data');
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

  // Parse NPC files (notables, merchants, etc.)
  if (fs.existsSync(charsDir)) {
    const npcFiles = fs.readdirSync(charsDir).filter(f => f.startsWith('npcs_') && f.endsWith('.xml'));
    for (const file of npcFiles) {
      const xml = fs.readFileSync(path.join(charsDir, file), 'utf-8');
      const parsed = parser.parse(xml);
      const npcs = parsed?.NPCCharacters?.NPCCharacter;
      if (!npcs) continue;
      for (const npc of npcs) {
        troops.push(parseNpc(npc));
      }
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

export function parseClansFromXslt(): Clan[] {
  const dataDir = getDataDir();
  const xsltPath = path.join(dataDir, 'spclans.xslt');
  if (!fs.existsSync(xsltPath)) return [];

  const content = fs.readFileSync(xsltPath, 'utf-8');
  const clans: Clan[] = [];

  // Match template patterns: match="Faction[@id='clan_xxx']"
  // Then extract the name and banner_key attributes set inside
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
        bannerKey: bannerMatch ? bannerMatch[1].trim() : '',
      });
    }
  }

  return clans;
}

export function getCultureList(): string[] {
  const troops = parseTroops();
  const cultures = new Set(troops.map(t => t.culture).filter(Boolean));
  return Array.from(cultures).sort();
}
