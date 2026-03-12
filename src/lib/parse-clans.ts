import fs from 'fs';
import path from 'path';
import { parser, getDataDir, stripLocKey, stripPrefix } from './xml-shared';
import type { Clan } from './xml-shared';

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
export const KINGDOM_ID_TO_NAME: Record<string, string> = {
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

      const nameMatch =
        block.match(/name="name"[^>]*>([^<]*)<\/xsl:attribute>/s) || block.match(/name="name">([^<]+)</);
      const bannerMatch =
        block.match(/name="banner_key"[^>]*>([^<]*)<\/xsl:attribute>/s) || block.match(/name="banner_key">([^<]+)</);

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
