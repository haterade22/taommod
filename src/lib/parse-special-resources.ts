/**
 * Special resources (each realm's second war currency) and the elite troops that cost them, read from the mod's own
 * files in src/data/special-resources/ (copied by sync-data.sh). Used by the tables on /mod-info/features.
 */
import fs from 'fs';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';
import { KINGDOM_ID_TO_NAME } from './parse-clans';
import { parseTroops } from './parse-troops';
import { getCultureDisplayName, getDataDir, stripLocKey } from './xml-shared';

export interface SpecialResource {
  id: string;
  name: string;
  /** Realms that share this resource, e.g. ["Mordor", "Isengard", ...]. */
  realms: string[];
  dailyPerTown: number;
  battle: number;
  raid: number;
  siege: number;
  prisoner: number;
  tournament: number;
  hideout: number;
}

export interface SpecialTroop {
  id: string;
  name: string;
  /** Realm the troop belongs to, when the site's troop data knows it. */
  realm?: string;
  resourceId: string;
  /** Price at the capital's emissary. */
  buy?: number;
  /** Price to upgrade into it on the party screen. */
  upgrade?: number;
  /** One-time charge when recruited another way (volunteer or prisoner). */
  recruit?: number;
  /** Resource drained per soldier per day. */
  upkeep?: number;
}

export interface EmissaryTown {
  id: string;
  name: string;
}

export interface SpecialResourceData {
  resources: SpecialResource[];
  /** Troops that cost a resource, grouped by resource in `resources` order. */
  troopsByResource: { resource: SpecialResource; troops: SpecialTroop[] }[];
  emissaryTowns: EmissaryTown[];
}

const xml = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => ['Resource', 'Kingdom', 'Culture', 'Troop', 'Settlement'].includes(name),
});

// Creatures that live outside the troop files the site reads.
const NAME_OVERRIDES: Record<string, string> = {
  taom_spider_creature: 'Giant Spider',
  cave_troll: 'Cave Troll',
  hill_troll: 'Hill Troll',
  taom_spider_rider_brown: 'Brown Spider Rider',
  taom_spider_rider_pale: 'Pale Spider Rider',
  arthedain_kings_guard: "Arthedain King's Guard",
};

// Troop names carry their realm in brackets ("[Mordor] Black Uruk Captain"); the tables group by realm already.
const cleanName = (name: string) => name.replace(/^\[[^\]]*\]\s*/, '');

/** "[Iron Hills] Royal Warden" -> "Iron Hills"; else the troop's culture; else a known id prefix. */
function realmOf(id: string, troop?: { name: string; culture: string }): string | undefined {
  const bracket = troop?.name.match(/^\[([^\]]+)\]/)?.[1];
  if (bracket) return bracket;
  if (troop) return getCultureDisplayName(troop.culture);
  if (id.startsWith('arthedain_')) return 'Arthedain';
  if (id.startsWith('taom_spider')) return 'Dol Guldur';
  return undefined;
}

const num = (value: unknown) => (value === undefined || value === '' ? undefined : Number(value));
const titleCase = (id: string) => id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function read(file: string): string | null {
  const full = path.join(getDataDir(), 'special-resources', file);
  return fs.existsSync(full) ? fs.readFileSync(full, 'utf-8') : null;
}

export function parseSpecialResources(): SpecialResourceData {
  const resourceXml = read('special_resources_config.xml');
  const costXml = read('troop_resource_costs.xml');
  const emissaryXml = read('elite_emissary_config.xml');
  if (!resourceXml || !costXml) return { resources: [], troopsByResource: [], emissaryTowns: [] };

  const resources: SpecialResource[] = (xml.parse(resourceXml).SpecialResources?.Resource ?? []).map(
    (r: Record<string, any>) => ({
      id: r['@_id'],
      name: stripLocKey(r['@_display_name'] ?? r['@_id']),
      realms: (r.Kingdom ?? []).map(
        (k: Record<string, string>) => KINGDOM_ID_TO_NAME[k['@_id']] ?? titleCase(k['@_id']),
      ),
      dailyPerTown: Number(r['@_daily_per_town'] ?? 0),
      battle: Number(r['@_per_battle_victory_base'] ?? 0),
      raid: Number(r['@_per_raid'] ?? 0),
      siege: Number(r['@_per_siege_victory'] ?? 0),
      prisoner: Number(r['@_per_prisoner'] ?? 0),
      tournament: Number(r['@_per_tournament_win'] ?? 0),
      hideout: Number(r['@_per_hideout_clear'] ?? 0),
    }),
  );

  const troopById = new Map(parseTroops().map((t) => [t.id, t]));
  const troops: SpecialTroop[] = (xml.parse(costXml).TroopResourceCosts?.Troop ?? []).map(
    (t: Record<string, string>) => ({
      id: t['@_id'],
      name: NAME_OVERRIDES[t['@_id']] ?? cleanName(troopById.get(t['@_id'])?.name ?? titleCase(t['@_id'])),
      realm: realmOf(t['@_id'], troopById.get(t['@_id'])),
      resourceId: t['@_resource_id'],
      buy: num(t['@_merchant_cost']),
      upgrade: num(t['@_upgrade_cost']),
      recruit: num(t['@_recruit_cost']),
      upkeep: num(t['@_daily_upkeep']),
    }),
  );

  const troopsByResource = resources
    .map((resource) => ({
      resource,
      troops: troops
        .filter((t) => t.resourceId === resource.id)
        .sort(
          (a, b) => (b.buy ?? 0) - (a.buy ?? 0) || (b.upgrade ?? 0) - (a.upgrade ?? 0) || a.name.localeCompare(b.name),
        ),
    }))
    .filter((group) => group.troops.length > 0);

  // Emissary towns: the file names each town in a comment after its id ("<!-- Minas Tirith (Gondor) -->").
  const emissaryTowns: EmissaryTown[] = [];
  if (emissaryXml) {
    const re = /<Settlement\s+id="([^"]+)"\s*\/>\s*(?:<!--\s*([^(<]+?)\s*(?:\([^)]*\))?\s*-->)?/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(emissaryXml)) !== null) emissaryTowns.push({ id: m[1], name: m[2] ?? titleCase(m[1]) });
  }

  return { resources, troopsByResource, emissaryTowns };
}
