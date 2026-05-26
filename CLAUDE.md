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

- `sync-data.sh` wipe-and-replaces XML files in `src/data/` from two local mod modules: `TAOM/ModuleData` (troops, characters, XSLT, cultures/kingdoms) and `LOTRLOME_Armory/ModuleData` (per-culture armor folders, weapons, shields, horses, crafting pieces)
- `src/lib/parse-xml.ts` is a barrel re-export; actual parsing lives in modular files:
  - `xml-shared.ts` — parser config, types, culture mappings, helpers
  - `parse-troops.ts`, `parse-kingdoms.ts`, `parse-clans.ts`, `parse-lords.ts`, `parse-armory.ts`, `parse-weaponry.ts`
- `src/lib/damage-calc.ts` replicates TaleWorlds' exact physics pipeline for weapon damage calculations
- Astro pages import from `parse-xml.ts` barrel and render static HTML
- View Transitions enabled via Astro's `<ViewTransitions />` for smooth page navigation

## Quality Tooling

- **ESLint** (`eslint.config.mjs`) — TypeScript + Astro flat config
- **Prettier** (`.prettierrc`) — 120 width, single quotes, Astro plugin
- **Vitest** (`vitest.config.ts`) — Unit tests in `src/lib/__tests__/`
- **Husky + lint-staged** — Pre-commit formatting and linting
- **CI/CD** — Quality gate job (lint, format check, tests) before build/deploy
- **PR Preview** — Build status comments on pull requests
- **Lighthouse CI** (`lighthouserc.json`) — Performance budgets on key pages

## Key Conventions

- **Culture mapping**: Bannerlord vanilla culture IDs map to LOTR factions via `CULTURE_DISPLAY_NAMES` in `xml-shared.ts` (e.g., `aserai` → Harad, `vlandia` → Rohan, `khuzait` → Rhun, `empire` → Dunland)
- **XML name cleanup**: `stripLocKey()` removes `{=key}` prefixes, `stripPrefix()` removes `Item.`/`Hero.`/etc prefixes
- **CSS culture colors**: Table rows use `data-culture` attributes for faction-colored backgrounds (defined in `styles/global.css`)
- **Skill colors**: Per-skill CSS classes like `.skill-athletics`, `.skill-riding` with `.skill-zero` for dimming zero values (in `styles/global.css`)
- **Dark theme**: CSS custom properties defined in `:root` in `global.css` (`--bg-primary`, `--accent`, etc.)
- **Font**: Self-hosted Cinzel (woff2 in `public/fonts/`) for navigation, system font stack for body text
- **Shared DataTable utilities**: `src/scripts/data-table.ts` provides `initSorting()`, `initCollapse()`, `applyUrlParams()`, `collectRows()` for all data table pages
- **Sticky table headers**: All tables use Excel-style freeze-pane behavior — `.data-table-wrapper` and `.table-wrapper` are capped at `max-height: 75vh` with `overflow: auto`, and `thead th` is `position: sticky; top: 0` so column labels stay pinned while rows scroll within the wrapper. New tables should reuse one of these wrapper classes (defined in `styles/global.css`) rather than rolling their own scroll container.

## File Organization

```
src/
  components/   TroopTree.astro (SVG upgrade tree visualization)
  data/         130+ XML files (troops/, characters/, armory/), 9 XSLT transforms, faction-troops.ts
  layouts/      BaseLayout.astro (single layout with nav, footer)
  lib/          parse-xml.ts (barrel), xml-shared.ts, parse-troops.ts, parse-kingdoms.ts, parse-clans.ts, parse-lords.ts, parse-armory.ts, parse-weaponry.ts, damage-calc.ts
  scripts/      data-table.ts (shared client-side table sorting/collapse/filters)
  pages/        18 pages with dynamic [id].astro routes for factions, kingdoms, clans
  styles/       global.css (theme, table styles, culture colors, skill colors)
scripts/        Node.js analysis scripts (weapon balance, culture summaries)
public/         Images, favicon, CNAME
```

## Data Sources

- **Troops**: `src/data/troops/troops_*.xml` (13 faction files; sourced from `TAOM/ModuleData/troops/`)
- **Characters**: `src/data/characters/` (lords.xml, heroes.xml, npcs_*.xml, clans.xml; sourced from `TAOM/ModuleData/characters/`)
- **Armory**: `src/data/armory/` (per-culture armor folders + LOTRAOM weapons/shields/horses + LOTRLOME crafting pieces; sourced from `LOTRLOME_Armory/ModuleData/LOTRLOME_items/`. Plus vanilla reference files from SandBoxCore/Native.)
- **Kingdoms/Cultures**: `src/data/taom_spkingdoms.xml`, `taom_spcultures.xml`
- **XSLT Transforms**: `src/data/*.xslt` (8 files — lords, heroes, clans, cultures, kingdoms, action_strings, comment_strings, module_strings)

## Damage Calculator

`damage-calc.ts` implements the full TaleWorlds CombatStatCalculator physics from decompiled Bannerlord v1.3.12. Verified against in-game values (e.g., Galadriel Sword: Game=87/72, Calc=86/72). Do not simplify the math — it must match the game engine exactly.
