# Changelog

All notable changes to the TAOM website data and features are documented here.

## [2026-09-02] — Full Mod Data Sync

### New Factions

- **Blue Craig** (`troops_bluecraig.xml`, `npcs_bluecraig.xml`) — 23 goblin troops, levels 11–36, infantry and ranged branches. Previously the faction page borrowed Goblin-town's roster; it now renders its own.
- **Lindon** (`troops_lindon.xml`, `npcs_lindon.xml`) — 30 Falathrim troops, levels 11–51. The deepest tier spread of any roster and the only Elven culture fielding both cavalry and horse archers. Previously borrowed Rivendell's roster.

### Troops

- Roster grew to **899 unique troops** across 18 troop-fielding cultures (was 818).
- **Dale is now visible.** Its 35 troops use `Culture.sturgia`, which was in `HIDDEN_CULTURES` and filtered every Dale troop and lord off `/troops` and `/lords`.
- Ten culture ids new to the data were added to `CULTURE_DISPLAY_NAMES`: `bluecraig`, `lindon`, and the minor/raider cultures `dunland_raiders`, `erebor_warriors`, `gondor_soldiers`, `gundabad_raiders`, `harad_raiders`, `mirkwood_stalkers`, `rhun_raiders`, `umbar_corsairs`. Without entries these rendered as raw ids (`Gondor_soldiers`).

### Armour

- **2,904 items** across 18 culture sets. Erebor and Rhun shrank substantially; Gondor and Mordor grew.
- **Starter kits added** — 12 new `starter_armors.xml` files (78 items) in cultures that previously had none. `/armoury` gained a **Starter** tab; these items were otherwise reachable only under "All".

### Weapons

- 636 weapons/shields/bows: **344 melee**, 38 ranged, 30 ammunition, 224 shields. New horse data (`LOTRAOM_horses.xml` more than doubled).

### Lords, Heroes & Clans

- **1,580 lords and heroes**, 232 clans. `lords.xml` grew 2.55 MB → 2.73 MB.
- Newer kingdoms (`goblin`, `mistymountainorcs`, `bluecraig`, `lindon`, `abanissa`, `shaghana`) were missing from `KINGDOM_ID_TO_NAME`, so their ids leaked raw into the Kingdom column on `/lords`.

### Mod Info

- Per-faction and headline counts on the troop, armour, weapon and overview balancing pages were recomputed from the XML — several had been stale since March (e.g. "545 troops", "2,368 armour items", "300 melee weapons").
- Added cards for Dale, Lindon, Goblins, Misty Mountain Orcs and Blue Craig. Cultural skill modifiers are applied by the mod at runtime and are not present in the culture XML, so those cards carry counts, races, groups and tier ranges but no modifier table.

### Known Data Issues

- `bluecraig_bolgs_ironfang` and `mistymountainorcs_bolgs_ironfang` are each defined **twice** — once in `troops_goblin.xml` and once in their own faction file. The site counts unique ids (899); a raw element count reports 901.

## [2026-03-19] — Full Mod Data Sync

### Troops — Skill Rebalance (All Factions)

Every faction's troop roster received a comprehensive skill rebalance focused on role clarity:

- **Infantry**: Riding reduced to 0 across all factions; Bow/Crossbow zeroed on melee-focused troops
- **Cavalry**: Riding values increased at higher tiers (e.g., Rohan elite cavalry Riding 275 → 312)
- **Ranged**: Throwing redistributed — Dunland and Mordor elite troops buffed (up to 80), Isengard infantry zeroed
- **Rohan**: Cavalry buffed overall — TwoHanded significantly increased (55 → 160 at Tier 5), Athletics and Bow also raised
- **Elven factions (Rivendell, Mirkwood)**: Skills standardized to round values (300, 320, 325); Crossbow universally zeroed; Rivendell cavalry Riding boosted (45–60 → 300–320)
- **Rhun**: Infantry/cavalry split sharpened — infantry Riding zeroed (was 28–38), cavalry Riding boosted
- **Dol Guldur**: Riding added to many units (0 → 10–40), indicating potential mounted capability
- **Gundabad**: Riding increased across the board (0/5 → 10–20 on infantry)
- **General**: Moderate reductions in primary combat skills for lower-tier troops (e.g., Gondor recruit Athletics 38 → 35, OneHanded 38 → 30)

### New Troop

- **Iron Hills Arbalest** (Erebor) — New crossbow unit with upgrade path to Iron Hills Veteran Arbalest. Equipped with heavy dwarf crossbow, iron bolts, iron sword, and Iron Hills armor sets.

### Lords

- **Skills moved to templates**: All lord characters now use `skill_template` references (e.g., `SkillSet.spc_phalanx_skills`) instead of hardcoded individual skill blocks
- **Nazgul individualized** with canonical names from Tolkien's extended lore:
  - "Nazgul, the Tainted" → **Hoarmurath, the Iceking of Urd**
  - "Nazgul, the Shadow of Northmen" → **Adunabeth, the Golden King**
  - "Nazgul, the Shadow of Umbar" → **Dendra-Dwar, the Lord of Hounds**
- **Vorondir** renamed (was Vorondil), age adjusted 78 → 54

### Kingdoms

- **Mirkwood**: Renamed from "Kingdom of Lasgalen" → "Mirkwood Realm"; short name "Lasgalen" → "Mirkwood"
- **Lothlorien**: Added accent mark (Lothlorien → Lothlórien)
- **Banner keys**: Multiple kingdoms received custom-designed banner encodings replacing placeholder values
- **Diplomacy**: Simplified Umbar description; removed a war relationship entry; policy value adjustments

### Cultures

- **Civilian NPCs reverted to vanilla**: All cultures had faction-specific civilian NPC references (villagers, caravan masters, merchants, guards, notables) replaced with vanilla Bannerlord equivalents (e.g., `NPCCharacter.*_erebor` → `NPCCharacter.*_sturgia`)
- **Party templates**: Faction-specific party templates replaced with vanilla equivalents
- **Equipment rosters**: Custom civilian equipment rosters replaced with vanilla defaults
- **Wanderer/notable templates**: Custom faction notables replaced with vanilla `spc_notable_empire_*` equivalents

### XSLT Transforms

- **New: `spheroes.xslt`** — Adds lore backstory text to dead/historical lords via identity transform pattern
- **New: `splords.xslt`** — Extended lord renaming to LOTR equivalents with face/body properties and skill overrides
- **Updated: `lords.xslt`** — Refactored to cleaner attribute-preservation pattern; lord skill values updated
- **Updated: `spclans.xslt`** — Banner key overrides removed (now managed in XML data directly)
- **Updated: `spcultures.xslt`** — Culture NPC reference changes matching the vanilla revert
- **Updated: `spkingdoms.xslt`** — Minor kingdom transform adjustments

### Files Changed

- 20 modified files, 2 new files (22 total)
- 14 troop XMLs, 1 lords XML, 2 kingdom/culture XMLs, 7 XSLT transforms
