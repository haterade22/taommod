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

- `sync-data.sh` wipe-and-replaces XML files in `src/data/` from two local mod modules: `TAOM/ModuleData` (troops, characters, XSLT, cultures/kingdoms) and `LOTRLOME_Armory/ModuleData` (per-culture armor folders, weapons, shields, horses, crafting pieces), plus vanilla reference copies from the Bannerlord install. It preserves `faction-troops.ts` and `patreon-posts.json`.
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

- **Culture mapping**: Bannerlord vanilla culture IDs map to LOTR factions via `CULTURE_DISPLAY_NAMES` in `xml-shared.ts` (e.g., `aserai` → Harad, `vlandia` → Rohan, `khuzait` → Rhun, `empire` → Dunland, `sturgia` → Dale). Every culture id present in the data must have an entry or it renders as a raw capitalised id; `HIDDEN_CULTURES` (currently only `lothlorien`) filters `/troops` and `/lords`. Kingdom ids for the Kingdom column on `/lords` come from `KINGDOM_ID_TO_NAME` in `parse-clans.ts` — keep both in step when the mod adds a faction.
- **XML name cleanup**: `stripLocKey()` removes `{=key}` prefixes, `stripPrefix()` removes `Item.`/`Hero.`/etc prefixes
- **CSS culture colors**: Table rows use `data-culture` attributes for faction-colored backgrounds (defined in `styles/global.css`)
- **Skill colors**: Per-skill CSS classes like `.skill-athletics`, `.skill-riding` with `.skill-zero` for dimming zero values (in `styles/global.css`)
- **Dark theme**: CSS custom properties defined in `:root` in `global.css` (`--bg-primary`, `--accent`, etc.)
- **Font**: Self-hosted Cinzel (woff2 in `public/fonts/`) for navigation, system font stack for body text
- **Credits**: content is in `src/data/credits.json` (`updatedAt`, `groups[]` with `id`, `title`, optional `note`, `discordRoles[]`, `people[]`; a person is a name or `{ "name", "extra", "href", "label", "status", "discordId" }`, status `active` | `former`). Rule: nobody is ever removed; people who leave get `"status": "former"` and show under "Former members" in their group. For the Discord bot sync: members holding one of a group's `discordRoles` are added/kept as active (matched by `discordId`), people with a `discordId` who lost the role become `former`; entries without a `discordId` (older history) are left as they are. `src/pages/credits.astro` only renders it.
- **Changelog**: every update (each merged PR or data sync) gets a versioned entry at the top of `CHANGELOG.md` — major for a redesign, minor for new features or a mod data sync, patch for small fixes. Website changes are written in plain language; mod data details go under a "Mod data" heading.
- **Roadmap**: content is in `src/data/roadmap.json` (`contributors`, `disciplines[]` with `discipline`, `lead`, `completed`/`wip`/`next`; an item is a name or `{ "name", "eta" }`). `src/pages/roadmap.astro` only renders it.
- **Shared DataTable utilities**: `src/scripts/data-table.ts` provides `initSorting()`, `initPager()`, `initCollapse()`, `applyUrlParams()`, `collectRows()` for all data table pages. Tables show one screen of rows per page (no scroll box; the count follows the window height): `initPager()` pages the rows the filters left visible (call `pager.refresh()` at the end of the filter function, or dispatch `datatable:filtered` on the table from scripts that cannot import it; sorting refreshes it itself). Off-page rows get `data-off-page` (hidden in `global.css`)
- **Sticky table headers**: All tables use Excel-style freeze-pane behavior — `.data-table-wrapper` and `.table-wrapper` are capped at `max-height: 75vh` with `overflow: auto`, and `thead th` is `position: sticky; top: 0` so column labels stay pinned while rows scroll within the wrapper. New tables should reuse one of these wrapper classes (defined in `styles/global.css`) rather than rolling their own scroll container.

## File Organization

```
src/
  components/   TroopTree.astro (SVG upgrade tree visualization)
  data/         180 XML files (troops/, characters/, armory/), 8 XSLT transforms, faction-troops.ts
  layouts/      BaseLayout.astro (single layout with nav, footer)
  lib/          parse-xml.ts (barrel), xml-shared.ts, parse-troops.ts, parse-kingdoms.ts, parse-clans.ts, parse-lords.ts, parse-armory.ts, parse-weaponry.ts, damage-calc.ts
  scripts/      data-table.ts (shared client-side table sorting/collapse/filters)
  pages/        31 pages with dynamic [id].astro routes for factions, kingdoms, clans
  styles/       global.css (theme, table styles, culture colors, skill colors)
scripts/        Node.js analysis scripts (weapon balance, culture summaries)
public/         Images, favicon, CNAME
gallery-media/  Gallery source images and videos (not deployed). `scripts/sync-gallery-assets.mjs` (run before dev/build) writes WebP full-size + thumbnail copies to `public/images/gallery/` (generated, git-ignored). To add to the gallery, drop the file in `gallery-media/` and add its date to `src/data/gallery-dates.json` (the gallery sorts newest first by that date; file dates are useless on the build server; a file without a date shows first).
```

## Data Sources

- **Troops**: `src/data/troops/troops_*.xml` (18 faction files; sourced from `TAOM/ModuleData/troops/`)
- **Characters**: `src/data/characters/` (lords.xml, heroes.xml, npcs_*.xml, clans.xml; sourced from `TAOM/ModuleData/characters/`)
- **Armory**: `src/data/armory/` (per-culture armor folders + LOTRAOM weapons/shields/horses + LOTRLOME crafting pieces; sourced from `LOTRLOME_Armory/ModuleData/LOTRLOME_items/`. Plus vanilla reference files from SandBoxCore/Native.) Culture folders also carry generated `ranged_ladder.xml` and `starter_kit.xml` sets that `parse-armory.ts` deliberately excludes — they are AI/player-start clones, not gear.
- **Kingdoms/Cultures**: `src/data/taom_spkingdoms.xml`, `taom_spcultures.xml`
- **XSLT Transforms**: `src/data/*.xslt` (8 files — lords, heroes, clans, cultures, kingdoms, action_strings, comment_strings, module_strings)

## Damage Calculator

`damage-calc.ts` implements the full TaleWorlds CombatStatCalculator physics from decompiled Bannerlord v1.3.12. Verified against in-game values (e.g., Galadriel Sword: Game=87/72, Calc=86/72). Do not simplify the math — it must match the game engine exactly.
