---
name: culture_mapping
description: Bannerlord vanilla culture IDs to LOTR faction name mapping — critical for data pipeline and CSS
type: reference
---

The mod reuses Bannerlord's vanilla culture system with LOTR names. This mapping is defined in `src/lib/parse-xml.ts` as `CULTURE_DISPLAY_NAMES` and mirrored in CSS `data-culture` attributes in `src/styles/culture-colors.css`.

| Vanilla ID | LOTR Faction | Notes |
|-----------|-------------|-------|
| aserai | Harad | |
| khuzait | Rhun | |
| battania | Khand | |
| empire | Dunland | Also aliased as `dunland` in armory |
| vlandia | Rohan | Also aliased as `rohan` in armory |
| sturgia | Dale | Hidden culture |
| gondor | Gondor | Native LOTR ID |
| mordor | Mordor | Native LOTR ID |
| erebor | Erebor | Native LOTR ID |
| isengard | Isengard | Native LOTR ID |
| gundabad | Gundabad | Native LOTR ID |
| mirkwood | Mirkwood | Native LOTR ID |
| rivendell | Rivendell | Native LOTR ID |
| umbar | Umbar | Native LOTR ID |
| dolguldur | Dol Guldur | Also aliased as `dol_guldur` |
| lothlorien | Lothlorien | Hidden culture |
| thenn | Mercenary | |
| iron_hills | Iron Hills | |
| arnor | Arnor | |
| troll | Troll | |
