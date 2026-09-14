---
name: project_overview
description: TAOM website architecture — Astro static site for LOTR Bannerlord mod with XML data pipeline and damage calculations
type: project
---

TAOM (Tales From the Age of Men) is an Astro 5 static website for a Lord of the Rings total conversion mod for Mount & Blade II: Bannerlord, deployed to GitHub Pages at taommod.com.

**Why:** The mod has 22 kingdoms, 1,580 lords and heroes, 901 troops across 18 troop-fielding cultures, 2,900+ armour items and 600+ weapons — the website makes this data browsable and provides weapon/armor balance analysis. Counts as of the 2026-09-14 sync; see CHANGELOG.md.

**How to apply:** When working on this project, remember that all data comes from XML files synced from the game mod via `sync-data.sh`, parsed at build time by `fast-xml-parser`. There is no database or runtime data fetching. The damage calculator in `damage-calc.ts` replicates exact TaleWorlds physics — never simplify its math.
