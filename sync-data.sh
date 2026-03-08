#!/bin/bash
# Sync XML data from TAOM repo to website src/data/
# Run this after making changes to TAOM mod data

TAOM_DIR="${1:-../TAOM/Main/_Module/ModuleData}"
DATA_DIR="src/data"

if [ ! -d "$TAOM_DIR" ]; then
  echo "Error: TAOM directory not found at $TAOM_DIR"
  echo "Usage: ./sync-data.sh [path-to-TAOM-ModuleData]"
  exit 1
fi

echo "Syncing from: $TAOM_DIR"

# Troops
mkdir -p "$DATA_DIR/troops"
cp "$TAOM_DIR"/troops/troops_*.xml "$DATA_DIR/troops/"
echo "  Copied troop files"

# Characters (NPCs, lords, heroes)
mkdir -p "$DATA_DIR/characters"
cp "$TAOM_DIR"/characters/npcs_*.xml "$DATA_DIR/characters/"
cp "$TAOM_DIR"/characters/lords.xml "$DATA_DIR/characters/" 2>/dev/null
cp "$TAOM_DIR"/characters/heroes.xml "$DATA_DIR/characters/" 2>/dev/null
echo "  Copied character files"

# XSLT transformations
cp "$TAOM_DIR"/*.xslt "$DATA_DIR/"
echo "  Copied XSLT files"

# Custom culture/kingdom definitions
cp "$TAOM_DIR"/taom_spcultures.xml "$DATA_DIR/"
cp "$TAOM_DIR"/taom_spkingdoms.xml "$DATA_DIR/" 2>/dev/null
echo "  Copied custom definitions"

echo "Done! Run 'npm run build' to regenerate the site."
