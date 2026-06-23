#!/bin/bash
# Sync XML data from TAOM repo to website src/data/
# Run this after making changes to TAOM mod data
#
# Usage: ./sync-data.sh [path-to-TAOM-ModuleData] [path-to-LOTRLOME_Armory-ModuleData]

set -e

TAOM_DIR="${1:-E:/Steam/steamapps/common/Mount & Blade II Bannerlord/Modules/TAOM/ModuleData}"
LOTRLOME_ARMORY="${2:-E:/Steam/steamapps/common/Mount & Blade II Bannerlord/Modules/LOTRLOME_Armory/ModuleData}"
DATA_DIR="src/data"

if [ ! -d "$TAOM_DIR" ]; then
  echo "Error: TAOM directory not found at $TAOM_DIR"
  echo "Usage: ./sync-data.sh [path-to-TAOM-ModuleData] [path-to-LOTRLOME_Armory-ModuleData]"
  exit 1
fi

if [ ! -d "$LOTRLOME_ARMORY" ]; then
  echo "Error: LOTRLOME_Armory directory not found at $LOTRLOME_ARMORY"
  echo "Usage: ./sync-data.sh [path-to-TAOM-ModuleData] [path-to-LOTRLOME_Armory-ModuleData]"
  exit 1
fi

echo "Syncing from TAOM:           $TAOM_DIR"
echo "Syncing from LOTRLOME_Armory: $LOTRLOME_ARMORY"

# --- Pre-clean: prune stale files so anything removed from the mod disappears here too ---
# Preserves: src/data/faction-troops.ts, src/data/patreon-posts.json,
#           src/data/armory/vanilla_weapons.xml, src/data/armory/vanilla_crafting_pieces.xml
echo "Cleaning stale files..."
mkdir -p "$DATA_DIR/troops" "$DATA_DIR/characters" "$DATA_DIR/armory"
rm -f "$DATA_DIR"/troops/troops_*.xml
rm -f "$DATA_DIR"/characters/*.xml
rm -f "$DATA_DIR"/*.xslt
rm -f "$DATA_DIR"/taom_spcultures.xml "$DATA_DIR"/taom_spkingdoms.xml
# Armory: remove all per-culture dirs and LOTR* files, keep vanilla_*.xml
find "$DATA_DIR/armory" -mindepth 1 -maxdepth 1 -type d -exec rm -rf {} +
rm -f "$DATA_DIR"/armory/LOTR*.xml
rm -f "$DATA_DIR"/armory/weapon_descriptions.xslt

# --- TAOM main mod data ---
# Troops (required)
shopt -s nullglob
troop_files=("$TAOM_DIR"/troops/troops_*.xml)
shopt -u nullglob
if [ ${#troop_files[@]} -eq 0 ]; then
  echo "Error: No troops_*.xml files found in $TAOM_DIR/troops/"
  exit 1
fi
cp "${troop_files[@]}" "$DATA_DIR/troops/"
echo "  Copied ${#troop_files[@]} troop files"

# Characters (NPCs required; lords/heroes/clans optional)
shopt -s nullglob
npc_files=("$TAOM_DIR"/characters/npcs_*.xml)
shopt -u nullglob
if [ ${#npc_files[@]} -eq 0 ]; then
  echo "Error: No npcs_*.xml files found in $TAOM_DIR/characters/"
  exit 1
fi
cp "${npc_files[@]}" "$DATA_DIR/characters/"
cp "$TAOM_DIR"/characters/lords.xml "$DATA_DIR/characters/" 2>/dev/null || true
cp "$TAOM_DIR"/characters/heroes.xml "$DATA_DIR/characters/" 2>/dev/null || true
cp "$TAOM_DIR"/characters/clans.xml "$DATA_DIR/characters/" 2>/dev/null || true
echo "  Copied ${#npc_files[@]} NPC files + lords/heroes/clans"

# XSLT transformations
cp "$TAOM_DIR"/*.xslt "$DATA_DIR/"
echo "  Copied XSLT files"

# Custom culture/kingdom definitions
cp "$TAOM_DIR"/taom_spcultures.xml "$DATA_DIR/"
cp "$TAOM_DIR"/taom_spkingdoms.xml "$DATA_DIR/" 2>/dev/null || true
echo "  Copied custom definitions"

# --- LOTRLOME_Armory: armor, weapons, shields, horses, crafting pieces ---
# Per-culture armor folders (arnor, dol_guldur, dunland, erebor, gondor, gundabad, harad,
# iron_hills, isengard, mercenary, mirkwood, mordor, rhun, rivendell, rohan, thenn, troll, etc.)
for dir in "$LOTRLOME_ARMORY"/LOTRLOME_items/*/; do
  if [ -d "$dir" ]; then
    cp -r "$dir" "$DATA_DIR/armory/"
  fi
done
echo "  Copied per-culture armor folders"

# Top-level armory XMLs (weapons, shields, horses, crafting pieces)
cp "$LOTRLOME_ARMORY"/LOTRLOME_items/LOTRAOM_*.xml "$DATA_DIR/armory/" 2>/dev/null || true
cp "$LOTRLOME_ARMORY"/LOTRLOME_crafting_pieces.xml "$DATA_DIR/armory/" 2>/dev/null || true
echo "  Copied armory weapon/shield/horse/crafting files"

# Optional armory XSLT
cp "$LOTRLOME_ARMORY"/weapon_descriptions.xslt "$DATA_DIR/armory/" 2>/dev/null || true

# --- Vanilla weapon data for comparison ---
GAME_DIR="${BANNERLORD_GAME_DIR:-E:/Steam/steamapps/common/Mount & Blade II Bannerlord}"
if [ -d "$GAME_DIR" ]; then
  cp "$GAME_DIR/Modules/SandBoxCore/ModuleData/Items/weapons.xml" "$DATA_DIR/armory/vanilla_weapons.xml" 2>/dev/null || true
  cp "$GAME_DIR/Modules/Native/ModuleData/crafting_pieces.xml" "$DATA_DIR/armory/vanilla_crafting_pieces.xml" 2>/dev/null || true
  echo "  Copied vanilla weapon/crafting data"
else
  echo "  Warning: Bannerlord not found at $GAME_DIR — skipping vanilla data"
fi

# Strip stray backup/swap files (e.g. *.bak, *.bak-predaleshields, *~) left in mod source.
# Run after ALL copies so we catch backups in any subdirectory regardless of arrival order.
find "$DATA_DIR" -type f \( -name '*.bak*' -o -name '*~' -o -name '*.swp' -o -name '*.tmp' \) -delete

echo "Done! Run 'npm run build' to regenerate the site."
