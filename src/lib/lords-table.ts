/**
 * The lords that the /lords table lists, in the table's order. Shared by the page and by /lords-bios.json (the
 * biographies, loaded by the page after it has appeared), so both list the lords in exactly the same order.
 */
import { getCultureDisplayName, isHiddenCulture, parseAllLords, type Lord } from './parse-xml';

/** "clan_empire_west_2" -> "Empire West 2" (the label the table shows for clans and kingdoms). */
export function formatMetaLabel(value: string): string {
  return value
    .replace(/^clan_/, '')
    .replace(/^kingdom_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Lords shown on the table (hidden cultures left out), in data order. */
export function visibleLords(): Lord[] {
  return parseAllLords().filter((l) => !isHiddenCulture(l.culture));
}

/** Sorts in place into the table's order: culture, then clan, then name. */
export function sortTableLords(lords: Lord[]): Lord[] {
  return lords.sort((a, b) => {
    const cultureA = getCultureDisplayName(a.culture);
    const cultureB = getCultureDisplayName(b.culture);
    if (cultureA !== cultureB) return cultureA.localeCompare(cultureB);

    const clanA = formatMetaLabel(a.clan || '');
    const clanB = formatMetaLabel(b.clan || '');
    if (clanA !== clanB) return clanA.localeCompare(clanB);

    return a.name.localeCompare(b.name);
  });
}
