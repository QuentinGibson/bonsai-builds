# Bonsai Builds — Domain Glossary

## BuildSet
A named container grouping one or more Breakpoints for the same character. Represents a full build guide. Not directly exportable on its own. Stores `className` (e.g. `"Warrior"`) as a BuildSet-level field — class is immutable across all Breakpoints in the set (a Warrior stays a Warrior). `ascendancy` is stored per-Breakpoint and may differ (e.g. a Warrior can be a Smith of Kitava in one Breakpoint and a Berserker in another). Both are combined into the `.build` format's `"Warrior3"` string only at export time.

Rendered in the UI as a **folder**. BuildSets have an `order` field and can be drag-reordered in the list. Breakpoints within a BuildSet can also be drag-reordered. Moving a Breakpoint between BuildSets is out of scope.

## Breakpoint
A named snapshot of a build at a specific stage (e.g., "Acts 1–5", "Endgame"). Each Breakpoint is independently exportable as a `.build` file. A BuildSet holds multiple Breakpoints. Each Breakpoint owns its own passives, skills, and inventory slots. No numeric level field — name is the only identifier.

Rendered in the UI as a **file** inside its parent BuildSet folder. Has an `order` field and can be drag-reordered within its BuildSet.

Creating a new Breakpoint copies all data from the previous Breakpoint as a starting point.

Multiple imported `.build` files can be combined into a single BuildSet as individual Breakpoints.

**Section-level copy-paste:** any of the three sections — passives, skills, or inventory — can be copied from one Breakpoint and pasted into another, replacing that section entirely. Cross-BuildSet paste is allowed, but only between BuildSets with the same `className`. The paste action is disabled if classes differ.

## .build File
The canonical POE2 build format — a flat JSON document encoding a single build state: passives, skills, and inventory slots. Each Breakpoint maps 1:1 to a `.build` file.

## Marketplace Listing
A publicly shared BuildSet — all Breakpoints included, with their full passives, skills, and inventory slots. Class and ascendancy are recorded at the BuildSet level. Updated in 0.5 alongside the core schema rewrite.

Publishing is open to any logged-in user. A premium tier exists in the schema (`isPremium` on users) but gates no features at launch — reserved for a future version.

## Import
Loading a `.build` file into the app. Always prompts the user to choose between creating a new BuildSet or appending the file as a new Breakpoint to an existing BuildSet.

**Filename parsing:** Bonsai-exported files use the convention `{BuildSet name}~{Breakpoint name}.build`. On import, if the filename contains `~`, the left side becomes the BuildSet name and the right side becomes the Breakpoint name. If no `~` is present (e.g. a third-party export from Path of Building), the full filename (minus `.build`) becomes the BuildSet name and the single Breakpoint is named `"Default"`.

## Game Folder Panel
A persistent UI panel that reads the Overwolf file system to list all `.build` files currently in the game's `Preferences/BuildPlanner` directory. Files can be imported directly from this panel using filename-based parsing (see Import). The panel stays open so users can import multiple builds over a session.

## Export
Serializing a Breakpoint to a `.build` file. Two modes:
- **Export to computer** — blob download to the user's Downloads folder.
- **Export to game** — uses the Overwolf file system API to write directly to `Preferences/BuildPlanner`. Filename follows the `{BuildSet name}~{Breakpoint name}.build` convention.

## Ad Container
A shared layout wrapper that renders a video ad in the bottom-right corner on every screen. Always on top (high z-index). All new UI — skills, items, import/export, breakpoint editor — must be designed to not cover it. The wrapper is already implemented; new screens get it automatically by existing inside it.

## Schema Migration
Not applicable — the app is pre-launch. The Convex schema is rewritten from scratch with no data preservation.

## Gem Database
A bundled JSON of all valid skill and support gem IDs and display names, extracted from the `PathOfBuilding-PoE2` repo via a `generate_gems.py` script (same pattern as `generate_tree.py`). Shipped as `public/gems.json`. Powers the searchable gem picker in the skills UI. Updated by pulling the PoB repo and re-running the script.

## Passive Node
A node allocated on the passive skill tree. Stored as `{id: string, weapon_set?: number, additional_text?: string}`. `weapon_set` distinguishes nodes specific to weapon set 1 or 2 (absent = applies to both). `additional_text` is part of the POE2 `.build` format's `BuildPassive` object and round-trips losslessly through import/export. Ascendancy nodes are stored in the same array as regular nodes — distinguished in the UI by ID prefix (`"Ascendancy..."`), not by separate storage.

**Node ID format:** The `id` field is the game's **PassiveSkills table ID** — a string like `"melee17"` or `"AscendancyWarrior3Start"`. This is distinct from Path of Building's internal numeric `skill` integer. The mapping is sourced from `poe2-skilltree-export/data.json` at tree-generation time; the SVG and all stored data use the string table ID exclusively.

Weapon-set nodes are always visible simultaneously, color-coded by set (matching in-game presentation). No toggle.

## Node Type
The visual and mechanical tier of a passive node, determined by its SVG circle radius. Three tiers exist on the main tree: **Normal** (r=100, small stat nodes), **Notable** (r=140, named nodes with larger effects), and **Keystone** (r=200, major build-defining nodes). **Ascendancy** nodes are a fourth visual category, identified by their ID prefix (`"Ascendancy..."`), regardless of radius. Node type governs border weight, color, and glow intensity on the canvas renderer.

## Skill
A skill gem assigned to a build, including its support gems and the level range it is active (`level_interval`). Displayed as a flat list — main gem as a row, support gems listed beneath it. `level_interval` is editable via a simple two-number range input. Skills are selected from a searchable picker backed by a bundled gem database (not free-text ID entry).

## Additional Text
A freeform notes field (`additional_text`) supported on Inventory Slots, Skills, Support Gems, and Passive Nodes. Uses POE2's tag markup syntax. Default (untagged) text renders as white.

### Markup syntax
`<tag>{ content }` — tags can nest. Examples:
- Font: `<b>`, `<i>`, `<u>`, `<s>` (small), `<m>` (medium), `<l>` (large), `<r>` (regular)
- Named colors: `<red>`, `<orange>`, `<yellow>`, `<green>`, `<blue>`, `<indigo>`, `<violet>`, `<black>`, `<white>`, `<grey>`, `<bronze>`, `<silver>`, `<gold>`, `<unique>`
- Custom color: `<rgb(255, 255, 255)>`
- Newlines: `\n`

The editor renders a live preview with colors applied. A toolbar lets users insert tags without memorizing syntax.

Notes are supported on all four object types: Inventory Slots, Skills, Support Gems, and Passive Nodes.

## Inventory Slot
An item equipped in a specific gear slot, identified by `inventory_id` (e.g., `"Weapon1"`, `"BodyArmour1"`). Includes freeform notes (`additional_text`) and a level range (`level_interval`).

The primary editing UI is a **flat list** of slots — each expandable for note editing. A separate **Equipment Preview overlay** shows the visual character layout (slot positions driven by `slot_x`/`slot_y`) but is not the editing surface.

### Item editing flow
1. User selects a **base item** from a searchable picker (sourced from `public/items.json`)
2. User adds **mods** — each mod is chosen from a searchable mod picker (sourced from `public/mods.json`), then the user enters the value(s) for that mod manually
3. The assembled base + mods render into `additional_text` using the POE2 markup format

Both `items.json` and `mods.json` are extracted from the `PathOfBuilding-PoE2` repo via `generate_items.py`.

## Second Desktop Window
A second Overwolf window rendering the same build editor UI as the primary desktop window. Designed to live on a second monitor while the user plays — giving them build reference without alt-tabbing. Generates additional ad revenue (each window has its own ad container). Shares the same Convex data as the primary window. Registered as a separate window in `manifest.json`.

Opens automatically when the game launches (via Overwolf game event detection) and can also be toggled via a registered hotkey. Both the primary desktop header and the second desktop header display a note indicating the hotkey so users know it exists.
