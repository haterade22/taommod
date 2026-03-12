import fs from 'fs';
import path from 'path';
import { parser, getDataDir, stripLocKey, stripPrefix } from './xml-shared';
import type { Lord } from './xml-shared';
import { parseAllClans } from './parse-clans';

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

      const skills: Record<string, number> = {};
      const skillRegex = /<skill\s+id="([^"]+)"\s+value="(\d+)"/g;
      let skillMatch;
      while ((skillMatch = skillRegex.exec(block)) !== null) {
        skills[skillMatch[1]] = parseInt(skillMatch[2], 10);
      }

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

  // Derive or refine culture from clan ID prefix
  for (const lord of lords) {
    if (lord.clan) {
      const clanCulture = deriveCultureFromClanId(lord.clan);
      if (clanCulture) lord.culture = clanCulture;
    }
  }

  return lords;
}

// Parse hero-to-clan mappings from vanilla + custom heroes.xml
export function parseHeroClanMap(): Map<string, string> {
  const map = new Map<string, string>();
  const dataDir = getDataDir();

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

  const heroesXmlPath = path.join(dataDir, 'characters', 'heroes.xml');
  if (fs.existsSync(heroesXmlPath)) {
    const xml = fs.readFileSync(heroesXmlPath, 'utf-8');
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

  return map;
}
