// @ts-check
import { writeFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';

const site = 'https://taommod.com';

// discord-bot is noindex; factions/gondor and factions/mordor are older addresses of factions/empire_w and empire_s.
const sitemapExclude = new Set(['discord-bot/', 'factions/gondor/', 'factions/mordor/']);

/**
 * Writes dist/sitemap.xml listing every built page. Small inline replacement for @astrojs/sitemap.
 * @returns {import('astro').AstroIntegration}
 */
function sitemap() {
  return {
    name: 'taom-sitemap',
    hooks: {
      'astro:build:done': ({ pages, dir }) => {
        const urls = pages
          .map((page) => page.pathname)
          .filter((pathname) => !sitemapExclude.has(pathname) && !pathname.startsWith('404'))
          .sort()
          .map((pathname) => `  <url><loc>${new URL(pathname, site).href}</loc></url>`);
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
        writeFileSync(new URL('sitemap.xml', dir), xml);
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site,
  output: 'static',
  integrations: [sitemap()],
});
