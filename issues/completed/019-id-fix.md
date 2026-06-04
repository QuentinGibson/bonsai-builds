## What to build

Translate all passive node IDs from PoB's numeric `skill` integers to the game's PassiveSkills table string IDs (e.g. `"marauder594"`, `"AscendancyDruid1Start"`) at tree-generation time. This fixes exported `.build` files loading with no passive nodes allocated in-game.

`generate_tree.py` gains a lookup step: before emitting any ID, it maps the node's numeric `skill` integer to its string `id` field using `poe2-skilltree-export/data.json` (which carries both). Nodes whose `id` is `null` are skipped. SVG circle IDs become `n{tableId}`, connection IDs become `c{tableId1}-{tableId2}`, and `data_us.json` keys become the bare string table IDs.

After regenerating assets, update the static config in the app:
- `CLASS_START_NODES` in `PassiveTreeManager` — values become string table IDs (e.g. `"Warrior": "marauder594"`)
- `ascendancyData` node arrays and `ascendancyStartNodes` in `ascendancyConfig.ts` — all IDs become string table IDs (printed by `generate_tree.py`)
- `ascendancyConfig.test.ts` — remove the `/^\d+$/` guard on start-node entries; the existing "all ascendancy node IDs exist in `data_us.json`" test provides end-to-end verification once assets are regenerated

The `connectionGraph` in `PassiveTreeManager` is keyed by string table IDs by construction (it is built from SVG element IDs at runtime), so no runtime translation is needed anywhere.

## Acceptance criteria

- [ ] `generate_tree.py` maps `skill` integers to string table IDs via `poe2-skilltree-export/data.json`
- [ ] Regenerated `poe2snippet.html` uses `n{tableId}` circle IDs and `c{tableId1}-{tableId2}` connection IDs
- [ ] Regenerated `data_us.json` keys are string table IDs (no numeric keys)
- [ ] `CLASS_START_NODES` uses string table IDs
- [ ] `ascendancyData` node arrays and `ascendancyStartNodes` use string table IDs
- [ ] `ascendancyConfig.test.ts` passes with no `/^\d+$/` assertion
- [ ] Exporting a Breakpoint and loading it in-game allocates the correct passive nodes
- [ ] No regression on existing ascendancies (Titan, Deadeye, etc.)

## Blocked by

- issues/016-testable-bfs-extraction.md
- issues/018-node-scale.md
