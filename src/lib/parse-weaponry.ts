import fs from 'fs';
import path from 'path';
import { parser, getDataDir, stripLocKey, stripPrefix } from './xml-shared';
import type { WeaponItem } from './xml-shared';
import {
  computeCraftedWeaponDamage,
  type CraftingPieceData,
  type WeaponFlags,
  DESCRIPTION_FLAGS,
  TEMPLATE_DESCRIPTIONS,
} from './damage-calc';

function parseAllCraftingPiecesFromFile(filePath: string, pieceMap: Map<string, CraftingPieceData>): void {
  if (!fs.existsSync(filePath)) return;
  const xml = fs.readFileSync(filePath, 'utf-8');
  const parsed = parser.parse(xml);
  const pieces = parsed?.CraftingPieces?.CraftingPiece || [];
  for (const piece of pieces) {
    const id = piece['@_id'] || '';
    if (pieceMap.has(id)) continue; // Don't override LOTRAOM with vanilla
    const pieceType = piece['@_piece_type'] || '';
    const lengthCm = parseFloat(piece['@_length']) || 0;
    const length = lengthCm * 0.01;
    const weight = parseFloat(piece['@_weight']) || 0;
    const fullScale = piece['@_full_scale'] === 'true' || pieceType === 'Guard' || pieceType === 'Pommel';
    const comFactor = parseFloat(piece['@_center_of_mass']) || 0.5;
    const centerOfMass = length * comFactor;
    const inertia = (1 / 12) * weight * length * length;

    let distToNext: number, distToPrev: number;
    if (lengthCm > 0) {
      distToNext = length / 2;
      distToPrev = length / 2;
    } else {
      distToNext = (parseFloat(piece['@_distance_to_next_piece']) || 0) * 0.01;
      distToPrev = (parseFloat(piece['@_distance_to_previous_piece']) || 0) * 0.01;
    }

    const buildData = piece.BuildData;
    const pieceOffset = (parseFloat(buildData?.['@_piece_offset']) || 0) * 0.01;

    // Blade-specific data
    let swingDamageFactor = 0,
      swingDamageType = '',
      thrustDamageFactor = 0,
      thrustDamageType = '';
    if (pieceType === 'Blade' && piece.BladeData) {
      const bd = piece.BladeData;
      swingDamageFactor = parseFloat(bd.Swing?.['@_damage_factor']) || 0;
      swingDamageType = bd.Swing?.['@_damage_type'] || '';
      thrustDamageFactor = parseFloat(bd.Thrust?.['@_damage_factor']) || 0;
      thrustDamageType = bd.Thrust?.['@_damage_type'] || '';
    }

    pieceMap.set(id, {
      id,
      pieceType,
      weight,
      length,
      centerOfMass,
      inertia,
      fullScale,
      distToNext,
      distToPrev,
      pieceOffset,
      swingDamageFactor,
      swingDamageType,
      thrustDamageFactor,
      thrustDamageType,
    });
  }
}

function parseAllCraftingPieces(armoryDir: string): Map<string, CraftingPieceData> {
  const pieceMap = new Map<string, CraftingPieceData>();
  parseAllCraftingPiecesFromFile(path.join(armoryDir, 'LOTRLOME_crafting_pieces.xml'), pieceMap);
  parseAllCraftingPiecesFromFile(path.join(armoryDir, 'vanilla_crafting_pieces.xml'), pieceMap);
  return pieceMap;
}

/**
 * Parse the LOTRAOM weapon_descriptions.xslt to build a map of
 * descriptionId → Set<pieceId> for each weapon description.
 */
function parseWeaponDescriptionsXslt(armoryDir: string): Map<string, Set<string>> {
  const xsltPath = path.join(armoryDir, 'weapon_descriptions.xslt');
  if (!fs.existsSync(xsltPath)) return new Map();

  const xslt = fs.readFileSync(xsltPath, 'utf-8');
  const descPieces = new Map<string, Set<string>>();

  const templateRegex =
    /xsl:template\s+match="WeaponDescription\[@id='([^']+)'\]\/AvailablePieces">([\s\S]*?)<\/xsl:template>/g;
  let match;
  while ((match = templateRegex.exec(xslt)) !== null) {
    const descId = match[1];
    const body = match[2];
    const pieceSet = new Set<string>();

    const pieceRegex = /AvailablePiece\s+id="([^"]+)"/g;
    let pieceMatch;
    while ((pieceMatch = pieceRegex.exec(body)) !== null) {
      pieceSet.add(pieceMatch[1]);
    }

    descPieces.set(descId, pieceSet);
  }

  return descPieces;
}

/**
 * Determine the primary weapon description flags for a crafted weapon.
 */
function resolvePrimaryFlags(
  template: string,
  pieceIds: string[],
  descPieces: Map<string, Set<string>>,
): WeaponFlags | undefined {
  const descriptions = TEMPLATE_DESCRIPTIONS[template];
  if (!descriptions || descriptions.length <= 1) return undefined;

  for (const descId of descriptions) {
    const available = descPieces.get(descId);
    if (!available) continue;
    const allMatch = pieceIds.every((pid) => available.has(pid));
    if (allMatch) {
      return DESCRIPTION_FLAGS[descId];
    }
  }
  return undefined;
}

function isBowClass(weaponClass: string): boolean {
  return ['Bow', 'Crossbow', 'Arrow', 'Bolt'].includes(weaponClass);
}

function parseCraftedWeapons(
  filePath: string,
  allPieces: Map<string, CraftingPieceData>,
  isVanilla: boolean,
  descPieces?: Map<string, Set<string>>,
): WeaponItem[] {
  if (!fs.existsSync(filePath)) return [];
  const xml = fs.readFileSync(filePath, 'utf-8');
  const parsed = parser.parse(xml);
  const items: WeaponItem[] = [];

  const craftedItems = parsed?.Items?.CraftedItem || [];
  for (const item of craftedItems) {
    const xmlPieces = item.Pieces?.Piece || [];
    const template = item['@_crafting_template'] || '';

    const weaponPieces: { pieceType: string; piece: CraftingPieceData; scalePercent: number }[] = [];
    let bladePieceData: CraftingPieceData | undefined;
    for (const xp of xmlPieces) {
      const pieceId = xp['@_id'] || '';
      const pieceType = xp['@_Type'] || '';
      const scalePercent = parseInt(xp['@_scale_factor']) || 100;
      const pieceData = allPieces.get(pieceId);
      if (pieceData) {
        weaponPieces.push({ pieceType, piece: pieceData, scalePercent });
        if (pieceType === 'Blade') bladePieceData = pieceData;
      }
    }

    const pieceIds = xmlPieces.map((xp: any) => xp['@_id'] || '');
    const primaryFlags = descPieces ? resolvePrimaryFlags(template, pieceIds, descPieces) : undefined;

    const dmg = computeCraftedWeaponDamage(template, weaponPieces, primaryFlags);

    items.push({
      id: item['@_id'] || '',
      name: stripLocKey(item['@_name'] || ''),
      culture: stripPrefix(item['@_culture'] || '', 'Culture.'),
      weaponClass: template,
      type: 'Weapon',
      craftingTemplate: template,
      weight: dmg?.totalWeight || 0,
      difficulty: parseInt(item['@_difficulty']) || 0,
      appearance: parseFloat(item['@_appearance']) || 0,
      swingDamage: bladePieceData?.swingDamageFactor || 0,
      swingDamageType: bladePieceData?.swingDamageType || '',
      thrustDamage: bladePieceData?.thrustDamageFactor || 0,
      thrustDamageType: bladePieceData?.thrustDamageType || '',
      weaponLength: dmg?.weaponReach || 0,
      speed: dmg?.swingSpeed || 0,
      missileSpeed: 0,
      accuracy: 0,
      bodyArmor: 0,
      hitPoints: 0,
      isMerchandise: item['@_is_merchandise'] === 'true',
      estimatedSwingDamage: dmg?.swingDamage || 0,
      estimatedThrustDamage: dmg?.thrustDamage || 0,
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
      estimatedSwingDamage: swingDmg,
      estimatedThrustDamage: thrustDmg,
      isVanilla,
    });
  }

  return items;
}

export function parseWeaponry(): WeaponItem[] {
  const dataDir = getDataDir();
  const armoryDir = path.join(dataDir, 'armory');
  if (!fs.existsSync(armoryDir)) return [];

  const allPieces = parseAllCraftingPieces(armoryDir);
  const descPieces = parseWeaponDescriptionsXslt(armoryDir);
  const items: WeaponItem[] = [];

  // Parse LOTRAOM weapons
  items.push(...parseCraftedWeapons(path.join(armoryDir, 'LOTRAOM_weapons.xml'), allPieces, false, descPieces));

  // Parse shields file
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
