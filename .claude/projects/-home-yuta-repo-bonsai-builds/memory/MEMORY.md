# Project Memory

## Key Architecture Notes
- See [passive-tree-architecture.md](passive-tree-architecture.md) for full passive tree data flow, update checklist, and diff between current (outdated) and latest PoB data
- Passive tree authoritative source: `/home/yuta/repo/PathOfBuilding-PoE2/src/TreeData/0_4/tree.json` (4,701 nodes, 8 classes, 20 ascendancies)
- Bonsai's current data (`public/data_us.json`) is outdated (4,455 nodes, poe2db.tw source, DNT placeholders)
- Major changes in latest patch: Druid class added, ascendancies renamed/removed/added, ID scheme changed from `Warrior1` to actual names like `Titan`
- PoB also has rendering guides at `PathOfBuilding-PoE2/claude/web-canvas-skill-tree-guide.md`
