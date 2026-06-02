Status: ready-for-agent

# PRD: 0.5 Build File Schema — Full `.build` Alignment

## Problem Statement

Users want to create, edit, save, and share complete Path of Exile 2 build guides in Bonsai Builds. The app currently only models the passive skill tree inside a Breakpoint — Skills (skill gems + supports + level ranges) and Inventory Slots (gear items + mods + notes) are entirely absent. The passive node representation itself is also misaligned: the `.build` format stores nodes as `{id, weapon_set?}` objects in a single array, but the current schema splits them into two bare string arrays (`allocatedNodes` and `allocatedAscendancyNodes`). There is no import or export path. A user cannot currently take a build they've assembled and get a `.build` file out of the app, nor can they load an existing community build to reference while playing.

## Solution

Rewrite the Convex schema to model the full `.build` file structure inside each Breakpoint — passives, skills, and inventory slots — exactly as the format expects them. Implement `.build` import (parsing a dropped or loaded file and creating a Breakpoint from it) and export (serializing a Breakpoint to a downloadable `.build` file). Build the Skills editor UI (gem picker backed by a bundled `gems.json`) and the Inventory Slots editor UI (item picker backed by `items.json`, mod picker backed by `mods.json`, additional-text notes editor with live preview). Update the Marketplace Listing schema to reflect the new richer Breakpoint shape.

## User Stories

1. As a build guide author, I want to import an existing `.build` file into the app, so that I can build on top of a community build without re-entering everything manually.
2. As a build guide author, I want to choose whether an imported `.build` becomes a new BuildSet or an additional Breakpoint on an existing BuildSet, so that I can organize related stages of the same build under one guide.
3. As a build guide author, I want to add skill gems to a Breakpoint and search for them by name, so that I don't have to remember or type raw gem metadata IDs.
4. As a build guide author, I want to add support gems to each skill gem, so that I can model the exact gem links a player should use at each stage.
5. As a build guide author, I want to set a level range on each skill and support gem, so that players know exactly when to start using that gem link.
6. As a build guide author, I want to remove a skill gem or support gem from a Breakpoint, so that I can correct mistakes without starting over.
7. As a build guide author, I want to add items to each inventory slot (weapon, offhand, body armour, gloves, boots, helm, rings, amulet, belt, flasks), so that players know what gear to target at each stage.
8. As a build guide author, I want to search for a base item by name when assigning an item to a slot, so that I can quickly find the right base without scrolling a long list.
9. As a build guide author, I want to add mods to an item slot and set their values manually, so that I can specify the exact stat thresholds that matter for the build.
10. As a build guide author, I want to add freeform notes to any inventory slot using POE2's markup syntax (colors, font sizes, newlines), so that I can annotate items with contextual guidance for players.
11. As a build guide author, I want a live preview of my markup notes that renders the colors and formatting, so that I can verify the notes look correct before publishing.
12. As a build guide author, I want a toolbar that inserts markup tags for me, so that I don't have to memorize the tag syntax.
13. As a build guide author, I want to add notes to individual skill gems and support gems, so that I can explain specific gem choices.
14. As a build guide author, I want to add notes to individual passive nodes, so that I can annotate key pathing decisions.
15. As a build guide author, I want passive nodes to carry a weapon-set tag when applicable, so that the exported build correctly separates weapon-set-1 and weapon-set-2 nodes.
16. As a build guide author, I want ascendancy nodes to be stored in the same passives array as regular nodes, so that export produces a valid `.build` file.
17. As a build guide author, I want to export any Breakpoint to a `.build` file that downloads to my computer, so that I can use it in-game via Path of Building or the game's own build planner.
18. As a build guide author, I want the class and ascendancy fields combined into the `.build` format's single `ascendancy` string (e.g. `"Warrior3"`) only at export time, so that the app can keep them as separate readable fields internally.
19. As a marketplace viewer, I want to download a community listing as a `.build` file, so that I can load it into my game.
20. As a marketplace viewer, I want to see the skills and inventory slots for each Breakpoint in a listing, so that I can evaluate a build without downloading it.
21. As a player using the Overwolf app during a session, I want to reference skill gem assignments and gear targets for my current breakpoint, so that I know what to equip without alt-tabbing.
22. As a player, I want the second desktop window to show the same build data including skills and items, so that I can refer to my build on a second monitor.

## Implementation Decisions

- **Schema rewrite (no migration):** The app is pre-launch. The existing `breakpoints` table is dropped and recreated. The new Breakpoint schema stores the full `.build` body: `passives` as an array of `{id: string, weapon_set?: 0 | 1, additional_text?: string}`, `skills` as an array of `{id: string, level_interval: [number, number], additional_text?: string, support_skills: [{id: string, level_interval: [number, number], additional_text?: string}]}`, and `inventory_slots` as an array of `{inventory_id: string, level_interval: [number, number], slot_x: number, slot_y: number, additional_text: string}`. The `level`, `allocatedNodes`, `allocatedAscendancyNodes`, `selectedClass`, and `selectedAscendancy` top-level fields on Breakpoint are removed.

- **Class/ascendancy encoding:** BuildSet continues to store `className` and `ascendancy` as separate string fields. The combined `"Warrior3"`-style string is produced only at export time by a pure serialization function. Import parses the combined string back into the two separate fields.

- **`.build` import:** A pure `parseBuildFile(json: string): BreakpointData` function reads the `.build` JSON and produces the internal Breakpoint shape. The importer is called from a file input or drop target in the UI. After parsing, the import flow prompts the user: "Create new BuildSet" or "Add as Breakpoint to existing BuildSet" (matching the import flow defined in CONTEXT.md).

- **`.build` export:** A pure `serializeBuildFile(breakpoint: BreakpointData, buildSet: BuildSetMeta): string` function produces a valid `.build` JSON string. Triggered by an "Export to computer" button per Breakpoint, which fires a blob download. The function must produce output that round-trips cleanly through any POE2 build tool that reads the format.

- **Gem database:** A `gems.json` file bundled in `public/` provides the searchable set of valid skill and support gem IDs and display names. The gem picker in the Skills editor searches this list. Gem entries in the schema store the raw metadata `id` (e.g. `"Metadata/Items/Gem/SkillGemShieldWall"`) — the gem database maps these to display names for the UI.

- **Item and mod databases:** `items.json` and `mods.json` bundled in `public/` back the item base picker and mod picker respectively. Items are indexed by slot (`inventory_id`). The mod picker lets a user select a mod and then enter a value; the assembled `additional_text` string for the slot is the serialized form of the base + mods in POE2 markup format.

- **Additional Text editor:** Shared across Inventory Slots, Skills, Support Gems, and Passive Nodes. Consists of a textarea for raw markup entry, a live preview panel that renders the markup using POE2's tag syntax, and a toolbar for inserting common tags (colors, font sizes, newline). No rich-text editing — the source of truth is the raw markup string.

- **Marketplace Listing update:** The embedded `breakpoints` array in `marketplaceListings` mirrors the new Breakpoint shape (passives, skills, inventory_slots). The old `level`, `allocatedNodes`, `allocatedAscendancyNodes`, `selectedClass`, `selectedAscendancy` fields are removed from the snapshot. The listing schema is rewritten in lockstep with the breakpoints table, with no migration needed.

- **Ad Container constraint:** All new UI panels (Skills editor, Inventory editor, Additional Text editor, Import modal) must be laid out to avoid covering the bottom-right Ad Container. The Ad Container renders at high z-index and must remain visible at all times.

## Testing Decisions

Good tests for this feature assert on observable outputs (the serialized `.build` JSON, the parsed Breakpoint object, what the user sees in the UI) — not on internal state or intermediate representations.

**Highest-seam tests (pure functions):**
- `parseBuildFile` — given the raw JSON of a known `.build` file (like `warrior-shield-build.build`), assert that the returned Breakpoint shape has the expected passives count, correct weapon-set tags, correct skill ids, correct inventory slot additional_text. Round-trip test: `parseBuildFile(serializeBuildFile(bp))` should equal the original Breakpoint.
- `serializeBuildFile` — given a hand-constructed Breakpoint, assert the output JSON is valid and matches the expected structure. Specifically assert that ascendancy nodes are interleaved in `passives`, that the combined `ascendancy` string is correctly formed, and that the output is accepted by a JSON schema derived from the official POE2 build planner docs.

**Convex mutation tests:**
- `breakpoints.add` with the new schema shape — assert the returned document matches the input, including nested arrays.
- `breakpoints.update` for partial updates to `skills` and `inventory_slots` — assert only the updated field changes.

**Prior art for test patterns:** Look at any existing Convex mutation tests in the codebase for the shape of test setup. The pure-function tests have no prior art yet; they are unit tests and do not need a test harness.

## Out of Scope

- **Export to game (Overwolf file system API):** Mentioned in the 0.5 objectives as optional. The "Export to computer" blob download is in scope; writing directly to `Preferences/BuildPlanner` is not.
- **Gem level fields on individual gems:** The `.build` format stores `level_interval` (a range the gem is active) but not the gem's actual level. Gem leveling is out of scope.
- **Jewel sockets:** Jewel slot passive nodes are stored as regular passive nodes by ID. Configuring jewels themselves is out of scope.
- **Flask slot configuration:** Flask items have their own `inventory_id`s but finer flask configuration (prefix/suffix mods on flasks) is out of scope.
- **Premium features:** Marketplace publishing gating behind `isPremium` is not changed by this work.
- **Second desktop window layout:** The window already mirrors the primary UI. No separate layout work is tracked here beyond verifying existing components work with the new data shape.
- **Additional Text on Passive Nodes in the UI:** The schema will store `additional_text` on passive nodes to stay format-compatible, but no editing UI for per-node notes is committed to in this PRD.

## Further Notes

The reference `.build` file at `build-examples/warrior-shield-build.build` should be used as the primary test fixture for both import and export correctness. It covers weapon-set nodes, ascendancy nodes, multiple skill links with support gems, and inventory slots with multi-line `additional_text`.

The POE2 official build planner documentation (linked in `objectives/0.5-update.md`) is the authoritative spec for the `.build` JSON structure. Any field not modeled by the app must pass through losslessly on import/export — the app must not silently drop unknown fields from a loaded `.build` file.

Class/ascendancy string mapping (e.g. `"Warrior3"` → `{className: "Warrior", ascendancy: "Titan"}`) needs a lookup table; derive it from Path of Building or the official docs. This table should live as a static constant, not be computed dynamically.
