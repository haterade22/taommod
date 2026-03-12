# TAOM - Tales From the Age of Men

A static website for the TAOM Lord of the Rings total conversion mod for Mount & Blade II: Bannerlord. Built with Astro, deployed to GitHub Pages at taommod.com.

## Build Commands

```bash
npm run dev       # Local dev server at localhost:4321
npm run build     # Production build to ./dist/
npm run preview   # Preview production build
npm run lint      # ESLint check
npm run format    # Prettier format
npm test          # Vitest unit tests
npx astro check   # TypeScript/Astro type checking
```

## Architecture

**Data Pipeline**: XML mod data → `fast-xml-parser` → Astro pages (all at build time, no runtime data fetching)

- `sync-data.sh` copies XML files from the local TAOM mod directory into `src/data/`
- `src/lib/parse-xml.ts` parses all XML data, exports typed arrays (`parseTroops()`, `parseKingdoms()`, `parseClans()`, `parseLords()`, etc.)
- `src/lib/damage-calc.ts` replicates TaleWorlds' exact physics pipeline for weapon damage calculations
- Astro pages import parsed data and render static HTML

## Key Conventions

- **Culture mapping**: Bannerlord vanilla culture IDs map to LOTR factions via `CULTURE_DISPLAY_NAMES` in `parse-xml.ts` (e.g., `aserai` → Harad, `vlandia` → Rohan, `khuzait` → Rhun, `empire` → Dunland)
- **XML name cleanup**: `stripLocKey()` removes `{=key}` prefixes, `stripPrefix()` removes `Item.`/`Hero.`/etc prefixes
- **CSS culture colors**: Table rows use `data-culture` attributes for faction-colored backgrounds (defined in `styles/culture-colors.css`)
- **Skill colors**: Per-skill CSS classes like `.skill-athletics`, `.skill-riding` with `.skill-zero` for dimming zero values (in `styles/skill-colors.css`)
- **Dark theme**: CSS custom properties defined in `:root` in `global.css` (`--bg-primary`, `--accent`, etc.)
- **Font**: Self-hosted Cinzel (woff2 in `public/fonts/`) for navigation, system font stack for body text
- **Shared DataTable utilities**: `src/scripts/data-table.ts` provides `initSorting()`, `initCollapse()`, `applyUrlParams()`, `collectRows()` for all data table pages

## File Organization

```
src/
  components/   TroopTree.astro (SVG upgrade tree visualization)
  data/         125+ XML files (troops/, characters/, armory/), XSLT transforms, faction-troops.ts
  layouts/      BaseLayout.astro (single layout with nav, footer)
  lib/          parse-xml.ts (barrel), xml-shared.ts, parse-troops.ts, parse-kingdoms.ts, parse-clans.ts, parse-lords.ts, parse-armory.ts, parse-weaponry.ts, damage-calc.ts
  scripts/      data-table.ts (shared client-side table sorting/collapse/filters)
  pages/        18 pages with dynamic [id].astro routes for factions, kingdoms, clans
  styles/       global.css, culture-colors.css, skill-colors.css
scripts/        Node.js analysis scripts (weapon balance, culture summaries)
public/         Images, favicon, CNAME
```

## Data Sources

- **Troops**: `src/data/troops/troops_*.xml` (11 faction files)
- **Characters**: `src/data/characters/` (lords.xml, heroes.xml, npcs_*.xml, clans.xml)
- **Armory**: `src/data/armory/` (armor XML per faction + vanilla reference)
- **Kingdoms/Cultures**: `src/data/taom_spkingdoms.xml`, `taom_spcultures.xml`

## Damage Calculator

`damage-calc.ts` implements the full TaleWorlds CombatStatCalculator physics from decompiled Bannerlord v1.3.12. Verified against in-game values (e.g., Galadriel Sword: Game=87/72, Calc=86/72). Do not simplify the math — it must match the game engine exactly.
