# Passive Tree Architecture

## Authoritative Source for Updates

The latest tree data lives in **`/home/yuta/repo/PathOfBuilding-PoE2/src/TreeData/0_4/`**:
- `tree.json` (1.8MB) — extracted from GGPK game files via `src/Export/Scripts/passivetree.lua`
- `tree.lua` (2.3MB) — same data in Lua format
- 100+ `.dds.zst` / `.png` files — node icons, frames, backgrounds
- **4,701 nodes** across **1,497 groups**, **8 classes**, **20 ascendancies**
- No API needed — all data is pre-extracted and shipped with that repo
- See `PathOfBuilding-PoE2/claude/passive-skill-tree-data-pipeline.md` for the full extraction pipeline
- See `PathOfBuilding-PoE2/claude/web-canvas-skill-tree-guide.md` for canvas rendering guide (node positioning, connectors, BFS, etc.)

## Bonsai Core Files (What Needs Updating)

### 1. `public/data_us.json` (~1.5MB, currently 4,455 nodes — OUTDATED)
Primary data source. Currently sourced from **poe2db.tw** (all icon URLs point to `cdn.poe2db.tw`). Many ascendancy names have `[DNT-UNUSED]` placeholders. Should be replaced with data from PoB's `tree.json`.

**Key structural differences from PoB's tree.json:**
- PoB has `constants.orbitRadii`, `constants.skillsPerOrbit`, `constants.orbitAnglesByOrbit` — needed to calculate node x/y positions
- PoB uses `.dds` icon paths; bonsai uses `cdn.poe2db.tw` `.webp` URLs → needs icon path remapping
- PoB has `groups` with x/y centers; bonsai's current data also has groups but node positions may differ

### 2. `public/poe2snippet.html` (~1.7MB — OUTDATED, needs regeneration)
Pre-baked SVG containing all `<circle>` elements (nodes, IDs `n{id}`) and `<line>`/`<path>` elements (connections, IDs `c{id1}-{id2}`). Node positions are baked into this SVG.

**To regenerate:** Must compute node positions from PoB data using:
```
node.x = group.x + sin(angle) * orbitRadii[orbit]
node.y = group.y - cos(angle) * orbitRadii[orbit]
```
Then generate SVG circles at those positions and line/arc connections between linked nodes.

### 3. `src/components/ScreenPassiveTree/passiveTreeLogic.ts` (OUTDATED hardcoded data)
Contains hardcoded ascendancy data that must be rebuilt from PoB's tree.json:

- **`ascendancyData`** (lines 54-91): Node ID lists + SVG transform offsets per ascendancy. Currently uses old `Warrior1`/`Warrior2` ID scheme — PoB now uses actual names like `Titan`/`Warbringer`.
- **`classAscendancies`** (lines 93-101): Class→ascendancy mapping. MAJOR CHANGES (see below).
- **`ascendancyNames`** (lines 103-125): Display names. Old scheme `Warrior1→Titan` no longer needed if using real names.
- **`ascendancyStartNodes`** (lines 127-149): Starting node per ascendancy. Values from PoB listed below.
- **`maxPoints`** = 123, **`maxAscendancyPoints`** = 8

### 4. `public/images/passives/` (~75+ PNGs)
Locally cached node icons. `applyNodeImages()` (line 263) maps icon URLs to local paths. Will need new icons for new nodes.

## Current vs Updated Ascendancy Data

### Classes Changed
| Old (bonsai) | New (PoB 0_4) |
|---|---|
| 7 classes: Warrior, Witch, Ranger, Huntress, Mercenary, Sorceress, Monk | 8 classes: Ranger, Huntress, Warrior, Mercenary, **Druid**, Witch, Sorceress, Monk |
| Old had Marauder/Duelist/Shadow/Templar with `[DNT-UNUSED]` ascendancies | Those are gone — replaced by proper classes |

### Ascendancy Changes
| Class | Old Ascendancies | New Ascendancies |
|---|---|---|
| Ranger | Deadeye, **Arcane Archer**, Pathfinder | Deadeye, Pathfinder (only 2) |
| Huntress | Amazon, **Beastmaster**, Ritualist | Amazon, Ritualist (only 2) |
| Warrior | Titan, Warbringer, Smith of Kitava | Titan, Warbringer, Smith of Kitava (same) |
| Mercenary | Tactician, Witchhunter, Gemling Legionnaire | Tactician, Witchhunter, Gemling Legionnaire (same) |
| **Druid** | *(DNT placeholders)* | **Oracle, Shaman** (NEW) |
| Witch | Infernalist, Blood Mage, **Necromancer** | Infernalist, Blood Mage, **Lich, Abyssal Lich** (4 ascendancies!) |
| Sorceress | Stormweaver, Chronomancer, **Disciple of the Djinn** | Stormweaver, Chronomancer, **Disciple of Varashta** (renamed) |
| Monk | **Martial Artist**, Invoker, Acolyte of Chayula | Invoker, Acolyte of Chayula (only 2) |

### Ascendancy Start Nodes (from PoB 0_4)
```
Titan: 32534          Warbringer: 33812       Smith of Kitava: 5852
Infernalist: 32699    Blood Mage: 59822       Lich: 23710            Abyssal Lich: (check Witch4 data)
Deadeye: 46990        Pathfinder: 1583
Amazon: 41736         Ritualist: 36365
Tactician: 36252      Witchhunter: 7120       Gemling Legionnaire: 55536
Stormweaver: 40721    Chronomancer: 22147     Disciple of Varashta: 8305
Invoker: 9994         Acolyte of Chayula: 74
Oracle: 42761         Shaman: 35535
```

### Class Start Nodes (from PoB 0_4)
```
44683: Shadow/Monk
47175: Marauder/Warrior
50459: Ranger/Huntress
50986: Duelist/Mercenary
54447: Witch/Sorceress
61525: Templar/Druid
```

## ID Scheme Change
Old bonsai used `Warrior1`/`Warrior2`/`Warrior3` as ascendancy IDs mapped to display names. PoB 0_4 uses the actual ascendancy names directly (e.g., `ascendancyName: "Titan"`). The `passiveTreeLogic.ts` hardcoded maps will need to be restructured accordingly.
