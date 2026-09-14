# TAOM - Tales From the Age of Men

A companion website for **TAOM** (Tales From the Age of Men), a Lord of the Rings total conversion mod for Mount & Blade II: Bannerlord. Browse troops, lords, weapons, armour, and faction data — all generated directly from the mod's XML files.

**Live site**: [taommod.com](https://taommod.com)

## Features

- **Troop Database** — All factions, skills, equipment, and upgrade trees
- **Lord Database** — Family trees, skills, traits, and biographies for 1,580 lords and heroes
- **Weaponry** — Crafted weapons with TaleWorlds-accurate damage calculations
- **Armoury** — Armour stats across all factions and slots
- **Faction Pages** — 22 factions with troop rosters, upgrade trees, and kingdom details
- **Kingdom & Clan Pages** — Dynamic pages for every kingdom and clan
- **Mod Info** — Balance breakdowns for troops, armour, and weapons; races; recruitment; feature overview
- **News, Gallery, Roadmap** — Patreon-synced posts, screenshot gallery, and development roadmap

## Tech Stack

- [Astro](https://astro.build) 5.x — Static site generator
- [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) — XML parsing at build time
- GitHub Pages — Hosting and deployment
- TypeScript — Full type safety across data pipeline

## Getting Started

```bash
npm install       # Install dependencies
npm run dev       # Start dev server at localhost:4321
npm run build     # Production build to ./dist/
npm run preview   # Preview production build locally
```

## Development

```bash
npm run lint          # ESLint check
npm run format        # Prettier format all files
npm run format:check  # Verify formatting (CI)
npm test              # Run Vitest in watch mode
npm run test:ci       # Run tests once (CI)
npx astro check       # TypeScript/Astro type checking
```

## Architecture

**Data Pipeline**: XML mod data → `fast-xml-parser` → Astro pages (all at build time)

```
src/
  data/         180 XML files synced from the TAOM mod (troops, characters, armory, XSLT transforms)
  lib/          Modular XML parsers + TaleWorlds damage calculator
    parse-xml.ts        Barrel re-export (all parsers accessible from one import)
    xml-shared.ts       Shared parser config, types, culture mappings, helpers
    parse-troops.ts     Troop XML parsing
    parse-kingdoms.ts   Kingdom XSLT/XML parsing
    parse-clans.ts      Clan parsing with kingdom resolution
    parse-lords.ts      Lord parsing with hero/family data merging
    parse-armory.ts     Armour item parsing by slot and culture
    parse-weaponry.ts   Weapon/shield parsing with crafting piece physics
    damage-calc.ts      TaleWorlds CombatStatCalculator physics (decompiled v1.3.12)
  scripts/      Shared client-side utilities (data-table sorting/filtering)
  pages/        31 pages with dynamic [id].astro routes
  layouts/      BaseLayout.astro (nav, footer, View Transitions)
  styles/       global.css (theme, table styles, culture colors, skill colors)
  components/   TroopTree.astro (SVG upgrade tree)
scripts/        Node.js analysis scripts (weapon balance, culture summaries)
public/         Images, fonts, favicon, CNAME
```

### Data Sync

`sync-data.sh` wipe-and-replaces `src/data/` from two local Bannerlord modules. It is a manual step, run whenever mod data changes; the site is then rebuilt on push.

```bash
./sync-data.sh [path-to-TAOM-ModuleData] [path-to-LOTRLOME_Armory-ModuleData]
# defaults: E:/Steam/steamapps/common/Mount & Blade II Bannerlord/Modules/{TAOM,LOTRLOME_Armory}/ModuleData
```

| Source | Files copied |
|--------|-------------|
| `TAOM/ModuleData` | `troops/troops_*.xml`, `characters/{npcs_*,lords,heroes,clans}.xml`, `*.xslt`, `taom_spcultures.xml`, `taom_spkingdoms.xml` |
| `LOTRLOME_Armory/ModuleData` | `LOTRLOME_items/<culture>/*.xml`, `LOTRAOM_{weapons,shields,horses}.xml`, `LOTRLOME_crafting_pieces.xml`, `weapon_descriptions.xslt` |
| Bannerlord install | `vanilla_weapons.xml`, `vanilla_crafting_pieces.xml`, `vanilla_heroes.xml` (reference copies from SandBoxCore/Native/SandBox) |

Hand-maintained files that the sync preserves: `src/data/faction-troops.ts` (troop-branch prose per faction) and `src/data/patreon-posts.json` (written by `scripts/sync-patreon-posts.mjs` on every build). Backup files (`*.bak*`, `*~`) left in the mod source are stripped.

The armoury culture folders also carry generated `ranged_ladder.xml` (AI missile-speed bow clones) and `starter_kit.xml` (stat-floored player-start twins). They are synced for completeness but `parse-armory.ts` deliberately skips them — they are not player-facing gear.

### XSLT Transforms

XSLT files in `src/data/` transform vanilla Bannerlord XML data into LOTR equivalents. The parsers read the `<xsl:template match=...>` blocks directly to recover the overridden values.

| File | Purpose |
|------|---------|
| `lords.xslt` | Renames vanilla `NPCCharacter` lords to LOTR characters, sets skills and face properties |
| `heroes.xslt` | Matching `Hero` overrides — clan, kingdom, spouse, biography text |
| `spclans.xslt` | Vanilla `Faction` (clan) name and banner overrides |
| `spcultures.xslt` | Vanilla `Culture` renames, NPC and party-template mappings |
| `spkingdoms.xslt` | Vanilla `Kingdom` name, title, colour, and policy overrides |
| `module_strings.xslt` | Culture adjectives and other localisation strings |
| `action_strings.xslt` | Campaign news / action strings |
| `comment_strings.xslt` | Lord dialogue and introduction strings |

Custom (non-vanilla) kingdoms and cultures are defined directly in `taom_spkingdoms.xml` and `taom_spcultures.xml`; `weapon_descriptions.xslt` lives under `armory/` and names the crafted weapons.

### Culture Mapping

Bannerlord vanilla culture IDs are mapped to LOTR factions:

| Vanilla ID | LOTR Faction |
|-----------|-------------|
| `aserai` | Harad |
| `khuzait` | Rhun |
| `battania` | Khand |
| `empire` | Dunland |
| `vlandia` | Rohan |
| `sturgia` | Dale |

Custom cultures map directly: `gondor`, `mordor`, `erebor`, `isengard`, `gundabad`, `mirkwood`, `rivendell`, `lothlorien`, `umbar`, `dolguldur`, `goblin`, `mistymountainorcs`, `bluecraig`, `lindon`, `abanissa`, `shaghâna` (id `shaghana`), plus the armoury-only `arnor`, `iron_hills`, `mercenary`/`thenn`, and `troll`. Eight minor cultures used by bandit-boss troops (`gondor_soldiers`, `erebor_warriors`, `mirkwood_stalkers`, `gundabad_raiders`, `harad_raiders`, `rhun_raiders`, `dunland_raiders`, `umbar_corsairs`) render with their own labels and roll up to the parent faction in mod-info counts. Only `lothlorien` is hidden from the troop and lord listings.

### Damage Calculator

`damage-calc.ts` replicates the full TaleWorlds CombatStatCalculator physics pipeline from decompiled Bannerlord v1.3.12. It calculates swing/thrust damage for crafted weapons using piece weight, inertia, center of mass, and speed ratings. Verified against in-game values (e.g., Galadriel Sword: Game=87/72, Calc=86/72). **Do not simplify the math** — it must match the game engine.

## CI/CD

- **Deploy** (`.github/workflows/deploy.yml`) — On push to `main` and every 6 hours: quality gate (lint, format check, tests) → build → deploy to GitHub Pages. The scheduled run picks up new Patreon posts without a commit.
- **PR Preview** (`.github/workflows/preview.yml`) — On PRs: quality checks with build status comments
- **Lighthouse** (`.github/workflows/lighthouse.yml`) — Performance monitoring with budgets on key pages

## Quality Tools

| Tool | Config | Purpose |
|------|--------|---------|
| ESLint | `eslint.config.mjs` | TypeScript + Astro linting |
| Prettier | `.prettierrc` | Code formatting (120 width, single quotes) |
| Vitest | `vitest.config.ts` | Unit tests for parsers and damage calc |
| Husky + lint-staged | `.husky/pre-commit` | Pre-commit formatting and linting |
| Lighthouse CI | `lighthouserc.json` | Performance budgets |

## License

This project is a fan-made companion site for the TAOM mod. All game data belongs to TaleWorlds Entertainment and the TAOM mod team.
