---
name: culture_mapping
description: Bannerlord vanilla culture IDs to LOTR faction name mapping — critical for data pipeline and CSS
type: reference
---

The mod reuses Bannerlord's vanilla culture system with LOTR names and adds its own. The display mapping is `CULTURE_DISPLAY_NAMES` in `src/lib/xml-shared.ts`; kingdom-column names on `/lords` come from `KINGDOM_ID_TO_NAME` in `src/lib/parse-clans.ts`; row colours come from `data-culture` rules in `src/styles/global.css` plus kingdom colours read from `taom_spkingdoms.xml`. When the mod adds a culture, all of these need an entry or the raw id leaks onto the page.

| ID | LOTR Faction | Notes |
|----|-------------|-------|
| aserai | Harad | Armory folder `harad` |
| khuzait | Rhun | Armory folder `rhun` |
| battania | Khand | No troop roster yet |
| empire | Dunland | Armory folder `dunland` |
| vlandia | Rohan | Armory folder `rohan` |
| sturgia | Dale | Visible since 2026-09-02; armory folder `dale` |
| gondor, mordor, erebor, isengard, gundabad, mirkwood, rivendell, umbar | (same) | Native LOTR ids |
| dolguldur | Dol Guldur | Armory folder `dol_guldur` |
| lothlorien | Lothlorien | **Hidden** from /troops and /lords (only hidden culture) |
| goblin | Goblins | Goblin-town |
| mistymountainorcs | Misty Mountain Orcs | |
| bluecraig | Blue Craig | Own roster since 2026-09-02 |
| lindon | Lindon | Own roster since 2026-09-02; only Elven culture with cavalry + horse archers |
| abanissa, shaghana | Âbanissa, Shaghâna | Harad sub-kingdoms |
| thenn, mercenary | Mercenary | Armory only |
| iron_hills, arnor, troll | Iron Hills, Arnor, Troll | Armory only |
| gondor_soldiers, erebor_warriors, mirkwood_stalkers, gundabad_raiders, harad_raiders, rhun_raiders, dunland_raiders, umbar_corsairs | … Soldiers / Raiders / Corsairs | One bandit-boss troop each; roll up to parent faction in mod-info counts |

Known duplicate ids in the mod data: `bluecraig_bolgs_ironfang` and `mistymountainorcs_bolgs_ironfang` are defined both in `troops_goblin.xml` and their own faction file. Site counts use unique ids.
