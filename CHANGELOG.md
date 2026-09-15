# Changelog

All notable changes to the TAOM website data and features are documented here.

## [2026-09-14] — Mod Data Sync

### Weapons — Gondor / Rhûn / Númenórean Rebalance

- **329 custom melee weapons** (was 344); shields 224 → 226.
- **Gondor** trimmed from 48 to 34 melee weapons: the Lossarnach axe line collapsed from ten variants to two (`_1h_axe_light`, `_2h_axe_light`), `wm_gondor_sword_a04`–`a10` removed, `wm_gondor_spear` replaced by `wm_gondor_light_spear`, and a Lamedon heavy bastard sword added. Average swing 95 → 91.
- **Rhûn** grew from 33 to 45: each of the Khamûl, Dragon and Lôke-rim lines gained a second spear and three two-handed swords (`sm_*_sword_2h_a/b/c`). Average swing 91 → 110 — now the highest of any implemented culture.
- **Númenórean** (cultureless) two-handers restructured: the 26 `numenorean_sword_2h_a`–`z` variants were replaced by a 14-piece set — bastard and greatsword at medium/heavy/elite in a/b, plus two poleaxes.
- **Harad** lost the two misattributed `easterling_spear`/`easterling_sword` items (6 melee, no two-handers).
- Crafting pieces grew 509 KB → 553 KB to back the new blades.

### Troops

- **901 unique troops** (was 899). Erebor gained two Iron Pass units: `ironpass_ram_herder` (L16) and `ironpass_ram_marshal` (L41). No cultures added or removed, no upgrade paths changed.
- **Dol Guldur Uruk line pushed up a tier.** Eleven `dg_uruk_*` troops moved +5 levels — Fighter 13 → 16, Skirmisher and Warrior 16 → 21, Swordsman and Bowman 21 → 26, Fell Infantry / Fell Archer / Fell Fang 26 → 31, Black Guard / Black Sharpshooter / Black Slayer 31 → 36. The line now spans T2–T7.
- **Gondor Blackroot Vale ranged line renamed in place**: Ranger → Shadowbow, Shadowbow → Shadowhunter, Shadowhunter → Vanguard (ids unchanged).
- **Skill re-roles on elite ranged and skirmish units.** Gondor (12 troops): Throwing +15 to +130, Polearm +15 to +80, Two-Handed +15 to +70, with Bow cut by up to 150 on units moved to melee. Rhûn (4 troops): Throwing +15 to +170, Polearm +15 to +155, Bow cut by up to 215. Mordor (10 troops): Two-Handed +23 to +85, Crossbow/Throwing/Polearm +15 to +45. Isengard and Dale: two troops each +15 across all eight skills.
- **Equipment refresh** on 153 Gondor troops, 51 Rhûn, 18 Mordor, 13 Dale and 12 Dol Guldur — largely tracking the weapon rebalance above.

### Armour — Protection Rebalance

- No items added or removed (2,904), but **2,476 items had stat changes** — the largest armour pass since March.
- **Buffed**: Erebor (body +16 avg, arm +12), Iron Hills (head +16, body +16, arm +13), Gondor (head +12, body +11, arm +7), Arnor (body +9, head +8, arm +7), Rhûn (head +9, body +7, arm +7), Rivendell (body +9, arm +6), Gundabad (head +9), Mirkwood (head +9).
- **Trimmed**: Dunland (head −10, leg −5), Dale (leg −11), Rohan (leg −9, body −3), Dol Guldur (leg −5, arm −3), Isengard (arm −3, leg −3), Thenn (body −8), Mordor (leg −7). Leg armour came down almost everywhere.
- Net effect: Iron Hills is now the best non-Elven body armour (55.3 avg, just under Rivendell 56.8 and Mirkwood 55.5); Rhûn and Gondor sit level at 43.7 / 43.2; Erebor has the highest head armour of any culture (56.1).
- Two new Gondor shields, `sm_gd_shield_b1` and `sm_gd_shield_b2`. Horses unchanged.

### Armoury — New Generated Item Sets (Excluded)

- The mod now ships two generated, non-merchandise files in each culture folder that are **not** player-facing armour:
  - `ranged_ladder.xml` — an AI missile-speed ladder of bow/crossbow clones (13 cultures, 15 per culture).
  - `starter_kit.xml` — stat-floored twins of the player's starting loadout, mixing armour, shields, bows and crafted weapons (14 cultures).
- `parse-armory.ts` now skips both files and any `<Item>` without an `<Armor>` component, so `/armoury` stays at **2,904** real items. `starter_armors.xml` (purchasable starter sets) is unaffected and still feeds the Starter tab.

### Vanilla References

- `vanilla_weapons.xml` and `vanilla_crafting_pieces.xml` refreshed from the current Bannerlord install.

### Known Data Issues

- `bluecraig_bolgs_ironfang` and `mistymountainorcs_bolgs_ironfang` remain defined twice (in `troops_goblin.xml` and their own faction files). Counts use unique ids.

## [2026-09-02] — Full Mod Data Sync

### New Factions

- **Blue Craig** (`troops_bluecraig.xml`, `npcs_bluecraig.xml`) — 23 goblin troops, levels 11–36, infantry and ranged branches. Previously the faction page borrowed Goblin-town's roster; it now renders its own.
- **Lindon** (`troops_lindon.xml`, `npcs_lindon.xml`) — 30 Falathrim troops, levels 11–51. The deepest tier spread of any roster and the only Elven culture fielding both cavalry and horse archers. Previously borrowed Rivendell's roster.

### Troops — New Lines, Mercenaries, and Skill Rebalance

- Roster grew to **899 unique troops** across 18 troop-fielding cultures (was 802). 97 added, none removed, no upgrade paths changed.
- **Mordor — Black Númenórean line** (14 troops): Initiate (L26) → Infantry / Archer / Cavalry (L31) → Veteran Infantry / Archer / Cavalry (L36) → Warden / Knight / Marksman (L41) → Temple Guard / Temple Knight / Temple Shadowbow (L46).
- **Gondor — Lossarnach Noble line** (5): Noble (L16) → Noble Veteran (L21) → Noble Sergeant (L26) → Noble Warden (L31) → Noble Captain (L36).
- **Erebor — Ironpass ram cavalry** (4): Ram Rider (L21) → Goatback Charger (L26) → Ram-Breaker (L31) → Ram Vanguard (L36). Erebor's first mounted line.
- **Harad — Mûmakil Rider** (L51).
- **21 hired mercenary variants** (`*_merc`) across Dol Guldur, Erebor, Goblin-town, Gondor (3), Gundabad (2), Harad, Rivendell (2), Isengard (3), Mirkwood, Misty Mountain Orcs, Mordor (4) and Umbar — recruitable copies of existing troops for the mercenary pool.
- **Skill rebalance:**
  - **Dale**: every one of its 35 troops re-statted — Two-Handed +100 avg (+30 to +222), Polearm +50, One-Handed +40, Throwing +31, Crossbow +27. The roster was effectively unfinished before this pass.
  - **Mordor** (29 troops): Polearm +41, Two-Handed +34, One-Handed +23, Bow +18.
  - **Gondor** (35 troops): Two-Handed +44; eleven units re-roled from bow to crossbow (Crossbow +56, Bow −50).
  - **Rhûn** (24 troops): Two-Handed +26; six archers Bow +118.
  - **Erebor** (8 troops): Polearm +100, Two-Handed +97, One-Handed +82, Athletics +26.
  - **Dol Guldur** (14 troops): Two-Handed +41, Polearm +28, Athletics +12.
  - **Isengard**: two troops swapped Bow → Crossbow (−90 / +90).
- **Equipment changed** on 140 Gondor troops, 28 Rhûn, 21 Dale, 8 Erebor, 3 Gundabad, 3 Mordor, 2 Isengard, 1 Dol Guldur.
- `erebor_warriors_boss` renamed "[Erebor] Warrior Captain" → "Blacklock Chieftain".
- **Dale is now visible.** Its 35 troops use `Culture.sturgia`, which was in `HIDDEN_CULTURES` and filtered every Dale troop and lord off `/troops` and `/lords`.
- Ten culture ids new to the data were added to `CULTURE_DISPLAY_NAMES`: `bluecraig`, `lindon`, and the minor/raider cultures `dunland_raiders`, `erebor_warriors`, `gondor_soldiers`, `gundabad_raiders`, `harad_raiders`, `mirkwood_stalkers`, `rhun_raiders`, `umbar_corsairs`. Without entries these rendered as raw ids (`Gondor_soldiers`).

### Armour — Regional Sets, Black Númenórean Kit, Legacy Cleanup

- **2,904 items** across 18 culture sets: 276 added, 160 removed, and 1,910 existing items re-statted.
- **Mordor — Black Númenórean armour** (78 pieces, `sm_md_num_*` / `sk_md_num_*`) to equip the new troop line above. 18 legacy pieces removed.
- **Gondor — six regional sets** (120 pieces): Dol Amroth (33), Linhir (22), Pinnath Gelin (21), Blackroot Vale (20), Lossarnach (18), Lond-Galen (10). 44 older generic pieces removed.
- **Erebor**: 57 legacy `sk_dwarf_*` pieces removed (the roster shrank 34% by file size). **Rhûn**: 16 legacy `easterling_*` pieces removed, twelve of them helmets.
- **Starter kits added** — 12 new `starter_armors.xml` files (six purchasable sets per culture, 78 items) in cultures that previously had none. `/armoury` gained a **Starter** tab; these items were otherwise reachable only under "All".
- **Stat pass**: Iron Hills buffed hard (body +23 avg, leg +22, arm +14, head +14); Mirkwood head +17; Rivendell body +10; Rohan body +8, head +8; Dunland leg +11; Dale +5 to +6 across every slot; Thenn body +23. Mordor trimmed slightly (body −5, arm −5). `material_type` reassigned on roughly 800 items and weight retuned on most.

### Weapons, Shields & Mounts

- 636 weapons/shields/bows: **344 melee**, 38 ranged, 30 ammunition, 224 shields.
- **Mordor — Black Númenórean weapons** (9): bows a/b, lance, one-handed swords a/b/c, two-handed swords a/b/c. Three Rohan spears (`wm_rohan_spear_c/d/f`) removed.
- **Shields**: ten added — four Gondor (`sm_gd_shield_a1`–`a4`) and six Black Númenórean (infantry and cavalry, medium and heavy); twelve legacy Gondor / Easterling shields and the Rhûn tournament sparring shield removed.
- **Mounts doubled, 24 → 44**: Mûmakil; two war rams with eight ram bardings (light / medium / heavy / elite, a/b); fell warg, albino / brown / dark wargs and a warg saddle; Rhûn and imperial chariot armour; two Khamûl bardings. These back the new Ironpass, Mûmakil Rider and warg-rider troops.

### Lords, Heroes & Clans

- **1,580 lords and heroes**, 232 clans. `lords.xml` grew 2.55 MB → 2.73 MB.
- Newer kingdoms (`goblin`, `mistymountainorcs`, `bluecraig`, `lindon`, `abanissa`, `shaghana`) were missing from `KINGDOM_ID_TO_NAME`, so their ids leaked raw into the Kingdom column on `/lords`.

### Mod Info

- Per-faction and headline counts on the troop, armour, weapon and overview balancing pages were recomputed from the XML — several had been stale since March (e.g. "545 troops", "2,368 armour items", "300 melee weapons").
- Added cards for Dale, Lindon, Goblins, Misty Mountain Orcs and Blue Craig. Cultural skill modifiers are applied by the mod at runtime and are not present in the culture XML, so those cards carry counts, races, groups and tier ranges but no modifier table.

### Known Data Issues

- `bluecraig_bolgs_ironfang` and `mistymountainorcs_bolgs_ironfang` are each defined **twice** — once in `troops_goblin.xml` and once in their own faction file. The site counts unique ids (899); a raw element count reports 901.

## [2026-06-22] — Mod Data Sync (Goblin-town, Misty Mountain Orcs, Dale)

_Recorded retroactively on 2026-09-14; this sync (`f338c8c`) shipped without a changelog entry._

### New Factions

- **Goblin-town** (`troops_goblin.xml`, 22 troops) and **Misty Mountain Orcs** (`troops_mistymountainorcs.xml`, 22 troops) — two new orc cultures, each with infantry and ranged branches.
- **Dale** (`troops_dale.xml`, 35 troops, culture id `sturgia`) — first full roster for Dale, with its own `dale` armoury folder. Its `sturgia` id was still in `HIDDEN_CULTURES` at this point, so the roster did not appear on `/troops` or `/lords` until 2026-09-02.
- Kingdom, clan and faction pages wired for Goblins, Misty Mountain Orcs, Blue Craig and Lindon. Blue Craig and Lindon had no rosters yet and temporarily borrowed Goblin-town's and Rivendell's.

### Troops

- **802 unique troops** (was 707): 98 added, 3 removed.
- **Mordor — Morannon line** (10): Recruit → Scout / Skirmisher / Fighter → Infantry / Spearman / Archer / Warrior → Heavy Infantry / Heavy Spearman.
- **Harad — Elephant Rider.**
- **Eight minor-culture bandit bosses**, one each: `gondor_soldiers`, `erebor_warriors`, `mirkwood_stalkers`, `gundabad_raiders`, `harad_raiders`, `rhun_raiders`, `dunland_raiders`, `umbar_corsairs`.
- Removed: Dol Guldur Giant Spider Rider, Isengard Chosen Marksman and Hunter.
- Equipment changed on 13 Rhûn, 9 Gondor and 4 Harad troops. No skill pass.

### Armour

- **2,788 items** (was 2,544): 246 added, 2 removed, nothing re-statted.
- **Dale — full culture set** (154 pieces): Lake-town mariner kit (36) plus chest (24), boots (24), helmets (24), gauntlets (24) and shoulders (22).
- **Mordor — Morannon set** (92 pieces, `sk_md_mor_*`) to equip the new line.
- Isengard: two Uruk-scout pieces removed.

### Weapons, Shields & Mounts

- **Dale weapons** (17): three war axes, two winged spears, war spear, spears a/b, halberd, sword, longbow and matching pieces. **Dale shields** (15, `wm_dale_shield_*`).
- **Mounts**: war elephant with elephant armour, a Rhûn chariot; the three Dol Guldur spider mount variants consolidated into one.

## [2026-05-25] — Mod Data Sync (Âbanissa, Shaghâna, Roster Rebuilds)

_Recorded retroactively on 2026-09-14; this sync (`dc8b431`) shipped without a changelog entry._

### New Factions

- **Âbanissa** and **Shaghâna** — two Harad sub-kingdoms with their own kingdoms, clans, lords and NPCs (`npcs_abanissa.xml`, `npcs_shaghana.xml`). They field Harad's troop roster.

### Troops — Four Rosters Rebuilt

- **707 unique troops** (was 683): 128 added, 104 removed, 50 level changes.
- **Erebor rebuilt** (−43 / +54): the Iron Hills line reworked (23 → 21 troops), plus a new **Erebor Noble line** (13), a regular line (8), Oathsworn (3) and the first Ironpass infantry and veterans (3).
- **Rhûn rebuilt** (−27 / +25): the legacy `troops_rhun.xml` was removed in favour of `troops_rhun_new.xml`. New **Black Sun line** (11, including Chosen Marksman), **Darkhûn line** (6) and Balcoth horse archers; Easterling Bloodsworn, Pillar, Scout and Dragon Knight removed.
- **Mordor** (−13 / +20): the Uruk line cut from ten troops to five; Orc line rebuilt (9 — Archer, Fighter, Hunter, Impaler…); six Warg riders.
- **Isengard** (+13): a new **Orc line** (Grunt, Brawler, Butcher, Berserker…) alongside the Uruk-hai.
- **Dol Guldur rebuilt** (−12 / +12): the old `dg_uruk_*` berserker/howler/butcher line and the archer/warden/initiate/disciple units replaced by **Khamûl's line** (8), Goblin Harrier / Impaler / Fellbow (3) and a Giant Spider Rider.
- Gondor: five Lossarnach troops removed, three added. Gundabad: four removed, one added.
- **Equipment changed** on 151 Gondor, 91 Rhûn, 23 Dol Guldur and 17 Gundabad troops.

### Armour — Gondor Regional Sets, Orc Kits, Stat Pass

- **2,544 items** (was 2,368): 377 added, 201 removed, **2,090 re-statted**.
- **Gondor** (+211 / −194): regional sets for Anórien (49), Lamedon (24), Serelond (22), Osgiliath (16) and Anfalas (13) replaced the legacy Swan Knight (30 pieces), Pelargir Marine helmet, Dol Amroth and Lord Marine sets.
- **Mordor** (+104): two orc kits, `sk_md_orc_*` (61) and `sk_gn_orc_*` (42).
- **Rhûn** (+22): Lôke-rim set. **Dol Guldur** (+19) and **Isengard** (+15): orc kits. **Iron Hills** (+5). Erebor: six legacy dwarf pieces removed.
- **Stat pass**: Rhûn trimmed across the board (head −6, body −5, leg −5); Rivendell buffed (arm +16, leg +10, head +9); Erebor head +17; Mordor arm +11, body −7; Iron Hills leg −10; Dunland leg −13.

### Weapons, Shields & Mounts

- **+31 / −21 weapons.** Added: an 18-step **Elven arrow quality ladder** (`wm_elven_arrow_q1`–`q4`, `v2`–`v4`), the **Gondor Lossarnach axe line** (8 — one- and two-handed in black ash, silver and silver-full), two Swan Knight lances, a Gondor bow, a Gondor knight spear and a Pinnath Gelin spear. Removed: all twenty tiered `rhun_1h_sword_a*` variants and `gond_spear2`.
- **Shields** +7 / −2: three Gondor, two Pelargir, a pavise and Boromir's shield added; two legacy Gondor shields removed.
- **Mounts** +4: three Dol Guldur spider mounts and a Gondor starter cavalry horse.

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
