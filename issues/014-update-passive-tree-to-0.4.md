## What to build

Update the passive skill tree to match the 0.4 version of Path of Exile 2. The source of truth is the Path of Building community repo at `/home/yuta/repo/PathOfBuilding-PoE2/src/TreeData/0_4/` — `tree.json` (4,701 nodes) and the bundled `.png` icons. The hardcoded data in `passiveTreeLogic.ts` is largely updated already, but two static assets are stale and one ascendancy (Abyssal Lich) is entirely missing.

**Database:** None.

**Routes:** None.

**Assets:**

Replace `public/data_us.json` (currently 4,455 nodes sourced from poe2db.tw) with a new file derived from `tree.json`. The new file must:
- Include all 4,701 nodes
- Map each node's icon to a local path under `public/images/passives/` (not the old poe2db CDN URLs)
- Carry `name`, `stats`, `isKeystone`, `isNotable` for each node (same shape as today)

Regenerate `public/poe2snippet.html` from the 0_4 node positions. Node x/y coordinates are computed as:
```
node.x = group.x + sin(angle) * constants.orbitRadii[orbit]
node.y = group.y - cos(angle) * constants.orbitAnglesByOrbit[orbit][skillIndex]
```
The SVG must contain one `<circle id="n{id}">` per node and one `<line id="c{id1}-{id2}">` or `<path>` per connection, matching the IDs that `passiveTreeLogic.ts` looks up.

Copy any new `.png` node icons from `PathOfBuilding-PoE2/src/TreeData/0_4/` into `public/images/passives/`.

**passiveTreeLogic.ts — Abyssal Lich:**

`Witch` in `classAscendancies` is missing `"Abyssal Lich"`. Add it (Witch should have 4 ascendancies: Infernalist, Blood Mage, Lich, Abyssal Lich).

Add `"Abyssal Lich"` to:
- `ascendancyData` — node ID list and SVG transform, sourced from the `ascendancyName: "Abyssal Lich"` nodes in `tree.json`
- `ascendancyNames` — `"Abyssal Lich": "Abyssal Lich"`
- `ascendancyStartNodes` — start node from `tree.json` (the node with `isAscendancyStart: true` in the Abyssal Lich group)

Verify that the existing ascendancy node lists in `ascendancyData` are still complete and correct against the 0_4 tree (node IDs may differ from older versions).

## Acceptance criteria

- [ ] `public/data_us.json` contains 4,701 nodes with no poe2db.tw icon URLs
- [ ] `public/poe2snippet.html` is regenerated from 0_4 node positions; all node and connection IDs match the new `data_us.json`
- [ ] New node icons are present in `public/images/passives/` and resolve correctly
- [ ] Witch shows all four ascendancy options: Infernalist, Blood Mage, Lich, Abyssal Lich
- [ ] Abyssal Lich start node is correctly entered and the ascendancy tree is clickable/allocatable
- [ ] Existing ascendancy node lists in `ascendancyData` have been verified against 0_4 (no stale node IDs that no longer exist in the tree)
- [ ] All 8 class start nodes load without errors
- [ ] No visible regression on existing ascendancies (Titan, Deadeye, etc.)

## Blocked by

None — can start immediately
