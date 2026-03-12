import fs from 'fs';
import path from 'path';
import { parser, getDataDir, stripLocKey, stripPrefix } from './xml-shared';
import type { Kingdom } from './xml-shared';

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
