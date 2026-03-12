# TAOM - Tales From the Age of Men

A companion website for **TAOM** (Tales From the Age of Men), a Lord of the Rings total conversion mod for Mount & Blade II: Bannerlord. Browse troops, lords, weapons, armour, and faction data — all generated directly from the mod's XML files.

**Live site**: [taommod.com](https://taommod.com)

## Features

- **Troop Database** — All factions, skills, equipment, and upgrade trees
- **Lord Database** — Family trees, skills, traits, and biographies for 830+ lords
- **Weaponry** — Crafted weapons with TaleWorlds-accurate damage calculations
- **Armoury** — Armour stats across all factions and slots
- **Faction Pages** — 16 factions with troop rosters and kingdom details
- **Kingdom & Clan Pages** — Dynamic pages for every kingdom and clan

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
  data/         125+ XML files synced from the TAOM mod (troops, characters, armory)
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
  pages/        18 pages with dynamic [id].astro routes
  layouts/      BaseLayout.astro (nav, footer, View Transitions)
  styles/       global.css (theme, table styles, culture colors, skill colors)
  components/   TroopTree.astro (SVG upgrade tree)
scripts/        Node.js analysis scripts (weapon balance, culture summaries)
public/         Images, fonts, favicon, CNAME
```

### Data Sync

`sync-data.sh` copies XML files from a local TAOM mod installation into `src/data/`. This is a manual step run when mod data changes.

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

Custom cultures (`gondor`, `mordor`, `erebor`, `isengard`, `gundabad`, `mirkwood`, `rivendell`, `umbar`, `dolguldur`, `lothlorien`, `arnor`, `iron_hills`) map directly.

### Damage Calculator

`damage-calc.ts` replicates the full TaleWorlds CombatStatCalculator physics pipeline from decompiled Bannerlord v1.3.12. It calculates swing/thrust damage for crafted weapons using piece weight, inertia, center of mass, and speed ratings. Verified against in-game values (e.g., Galadriel Sword: Game=87/72, Calc=86/72). **Do not simplify the math** — it must match the game engine.

## CI/CD

- **Deploy** (`.github/workflows/deploy.yml`) — On push to `main`: lint, format check, test, build, deploy to GitHub Pages
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
