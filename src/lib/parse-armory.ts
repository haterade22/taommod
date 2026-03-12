import fs from 'fs';
import path from 'path';
import { parser, getDataDir, stripLocKey } from './xml-shared';
import type { ArmorItem } from './xml-shared';

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
  const cultureDirs = fs.readdirSync(armoryDir).filter((d) => {
    const full = path.join(armoryDir, d);
    return fs.statSync(full).isDirectory();
  });

  for (const culture of cultureDirs) {
    const cultureDir = path.join(armoryDir, culture);
    const files = fs.readdirSync(cultureDir).filter((f) => f.endsWith('.xml'));
    for (const file of files) {
      const slotKey = file.replace('.xml', '');
      const slot = ARMOR_SLOT_MAP[slotKey] || slotKey;
      const xml = fs.readFileSync(path.join(cultureDir, file), 'utf-8');
      const parsed = parser.parse(xml);
      const xmlItems = parsed?.Items?.Item || [];
      for (const item of xmlItems) {
        const armor = item.ItemComponent?.Armor;
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
