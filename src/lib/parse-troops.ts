import fs from 'fs';
import path from 'path';
import { parser, getDataDir, stripLocKey, stripPrefix, getSkillValue, getEquipSlot } from './xml-shared';
import type { Troop } from './xml-shared';

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
    athletics: getSkillValue(skills, 'Athletics'),
    riding: getSkillValue(skills, 'Riding'),
    oneHanded: getSkillValue(skills, 'OneHanded'),
    twoHanded: getSkillValue(skills, 'TwoHanded'),
    polearm: getSkillValue(skills, 'Polearm'),
    bow: getSkillValue(skills, 'Bow'),
    crossbow: getSkillValue(skills, 'Crossbow'),
    throwing: getSkillValue(skills, 'Throwing'),
    item0: getEquipSlot(equipment, 'Item0'),
    item1: getEquipSlot(equipment, 'Item1'),
    item2: getEquipSlot(equipment, 'Item2'),
    item3: getEquipSlot(equipment, 'Item3'),
    head: getEquipSlot(equipment, 'Head'),
    body: getEquipSlot(equipment, 'Body'),
    leg: getEquipSlot(equipment, 'Leg'),
    glove: getEquipSlot(equipment, 'Gloves'),
    cape: getEquipSlot(equipment, 'Cape'),
    upgradeTo: upgradeTargets.map((u: any) => stripPrefix(u['@_id'] || '', 'NPCCharacter.')),
  };
}

export function parseTroops(): Troop[] {
  const dataDir = getDataDir();
  const troopsDir = path.join(dataDir, 'troops');
  const troops: Troop[] = [];

  const troopFiles = fs.readdirSync(troopsDir).filter((f) => f.startsWith('troops_') && f.endsWith('.xml'));
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

export function getCultureList(): string[] {
  const troops = parseTroops();
  const cultures = new Set(troops.map((t) => t.culture).filter(Boolean));
  return Array.from(cultures).sort();
}
