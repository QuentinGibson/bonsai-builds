Status: ready-for-agent

# PRD: Build Management Overhaul

## Problem Statement

Build authors have no way to manage their builds as a structured collection. BuildSets and Breakpoints live in a flat list with no visual hierarchy and no way to reorder them. There is no way to reuse a passive setup, skill layout, or gear configuration across related Breakpoints without rebuilding it by hand. Passive nodes cannot have notes added in the UI even though the `.build` format natively supports it. Exporting a Breakpoint requires leaving the app to manually move the file into the game folder, and importing from the game folder requires navigating a file picker for each file. The schema has stale and incorrect fields (`level`, `selectedClass` per Breakpoint, bare-string `allocatedNodes`) that contradict the domain model and create consistency hazards. Marketplace publishing is blocked behind a premium gate even though no premium tier exists at launch.

## Solution

Render BuildSets as folders and Breakpoints as files in a drag-reorderable UI. Add section-level copy-paste between Breakpoints so authors can reuse passives, skills, or inventory across stages. Add per-node note editing for passive nodes. Introduce a persistent Game Folder Panel that connects directly to the game's build directory for one-click export and multi-file import. Clean up the schema to match the actual domain model. Remove the premium gate from Marketplace publishing.

## User Stories

1. As a build author, I want my builds displayed as folders and my breakpoints displayed as files inside them, so that I can understand the structure of my guide at a glance.
2. As a build author, I want to drag-reorder my builds in the list, so that I can keep my most active guides at the top.
3. As a build author, I want to drag-reorder breakpoints within a build, so that I can arrange them in progression order (e.g. Acts 1–5 before Endgame).
4. As a build author, I want to copy the passives section from one breakpoint and paste it into another, so that I can reuse a passive tree layout across multiple stages without re-selecting every node.
5. As a build author, I want to copy the skills section from one breakpoint and paste it into another, so that I can propagate a gem setup across breakpoints.
6. As a build author, I want to copy the inventory section from one breakpoint and paste it into another, so that I can reuse a gear configuration across stages.
7. As a build author, I want cross-build section paste to only work between builds of the same class, so that I never accidentally paste Warrior passives into a Sorceress build.
8. As a build author, I want the paste action to be visually disabled when classes don't match, so that I understand immediately why I can't paste.
9. As a build author, I want to add a note to a specific passive node from the UI, so that I can explain why that node is taken at that stage of the build.
10. As a build author, I want passive node notes to support the full POE2 markup syntax with a live preview, so that my notes render consistently with item and skill notes.
11. As a build author, I want a tag toolbar when editing passive node notes, so that I don't have to memorize the markup syntax.
12. As a build author, I want to publish my build to the Marketplace without needing a premium account, so that I can share guides with the community from day one.
13. As a player, I want to export a breakpoint directly to my game's build folder in one click, so that I can load it in-game without manually moving files.
14. As a player, I want the exported filename to follow the `{build}~{breakpoint}.build` convention, so that reimporting it into Bonsai reconstructs the correct folder and file structure automatically.
15. As a player, I want to open a Game Folder Panel that lists all `.build` files currently in my game directory, so that I can see available builds without switching windows.
16. As a player, I want the Game Folder Panel to remain open after I import a file, so that I can import multiple builds in a single session.
17. As a player, I want to import a build directly from the Game Folder Panel, so that I don't have to use a file picker for each file.
18. As a player, I want a Bonsai-exported file to automatically map to the correct build and breakpoint on reimport, so that my folder structure is preserved across export and import cycles.
19. As a player, I want a third-party `.build` file with no `~` in the name to import as a new build with a single breakpoint named "Default", so that the import works even when the file didn't come from Bonsai.
20. As a build author, I want the ascendancy to be settable independently per breakpoint, so that I can document a build that transitions from one ascendancy to another across stages.
21. As a build author, I want the base class to be fixed at the build level and not editable per breakpoint, so that I can never create a breakpoint with an inconsistent class.

## Implementation Decisions

### Schema cleanup (ADR 0002)

- **Remove `level` from `breakpoints` and marketplace snapshot.** The field has no defined purpose. The glossary states name is the only Breakpoint identifier. Removed from the table, the marketplace listing's embedded snapshot, and all mutation arguments.
- **Remove `selectedClass` from `breakpoints`.** Class is a BuildSet-level property — it cannot differ between Breakpoints. `className` lives on `buildSets` only. The `selectedClass` field is removed from the `breakpoints` table and from the marketplace snapshot.
- **Remove `resetAscendancy`.** This mutation reset all Breakpoints in a BuildSet to the same ascendancy simultaneously. That was only coherent when ascendancy was BuildSet-level. Ascendancy is now per-Breakpoint; each is edited independently.
- **Upgrade `allocatedNodes` from `array<string>` to `array<{id, weapon_set?, additional_text?}>`.** The POE2 `.build` format's `BuildPassive` object natively supports all three fields. Storing bare strings loses weapon-set and note data on export. The schema is corrected to match both the glossary and the format spec. `additional_text` on nodes round-trips losslessly through import/export.
- **Add `order: number` to `buildSets` and `breakpoints`.** Required for drag-to-reorder. Both tables get an `order` field. Reordering is within-container only — Breakpoints cannot be dragged between BuildSets.

### Folder/file UI

BuildSets render as expandable folder rows. Breakpoints render as indented file rows inside their parent folder. Both support drag-to-reorder within their container. The reorder operation updates only the `order` fields of the affected rows in their respective table. Cross-folder Breakpoint movement is not supported.

### Section-level copy-paste

Three clipboard operations per Breakpoint context menu: **Copy Passives**, **Copy Skills**, **Copy Inventory**. Each copies the full contents of that section into an in-memory clipboard. Paste replaces the corresponding section in the target Breakpoint entirely. Cross-build paste is gated on `className` equality between source and target BuildSet — the paste action is disabled (not hidden) when classes differ. Paste is available from the target Breakpoint's context menu, showing the source Breakpoint name for confirmation.

### Passive node note editing

The `additional_text` field on node objects is exposed in the passive tree UI. Clicking a node opens an inline or panel editor using the same markup textarea, live preview, and tag toolbar already built for Inventory Slot and Skill notes. On save the node object is patched in the `allocatedNodes` array. Nodes with no note have `additional_text` absent from the object — not stored as an empty string.

### Overwolf export-to-game

An "Export to game" button per Breakpoint triggers a write via the Overwolf file system API to `Preferences/BuildPlanner`. Filename is `{BuildSet name}~{Breakpoint name}.build` with `~` stripped from both names at write time. This is distinct from "Export to computer" (blob download), which remains unchanged.

### Game Folder Panel

A persistent side panel (not a modal) that enumerates all `.build` files in `Preferences/BuildPlanner` via the Overwolf file system API. The list updates when the panel is opened. Each file shows its filename and an Import button. Import parses the filename: if it contains `~`, the left part becomes the BuildSet name and the right part the Breakpoint name; if not, the full filename (minus `.build`) is the BuildSet name and the Breakpoint is named `"Default"`. The panel stays open after import. The panel must not cover the Ad Container.

### Filename convention

- **Write:** strip `~` from both names, then write `{BuildSet name}~{Breakpoint name}.build`.
- **Read:** split on the first `~`. If no `~` present, treat the full filename (minus `.build`) as the BuildSet name and use `"Default"` for the Breakpoint name.

### Marketplace publishing

Remove any UI gate that checks `isPremium` before allowing a user to publish. The `isPremium` field stays in the `users` table for future use. The `publish` mutation in `convex/marketplace.ts` already only blocks anonymous users — no server-side change needed.

## Testing Decisions

Good tests check observable behavior at the highest stable seam. They do not assert on internal state or intermediate representations.

**Filename parser — pure function**
- Input: `"ColdSnap~Endgame.build"` → `{buildSetName: "ColdSnap", breakpointName: "Endgame"}`
- Input: `"TornadoShot.build"` (no `~`) → `{buildSetName: "TornadoShot", breakpointName: "Default"}`
- Input: `"My~Build~Act1.build"` (multiple `~`) → split on first `~` only
- Input: export of a BuildSet named `"My~Build"` → tilde stripped → filename `"MyBuild~Endgame.build"` → reimport resolves correctly

**Convex mutation tests — real Convex test environment**
- `buildSets.reorder` — assert `order` fields update correctly for affected rows only; unrelated BuildSets unchanged
- `breakpoints.reorder` — same, within a single BuildSet
- `breakpoints.add` with new shape — assert `allocatedNodes` accepts objects, `level` and `selectedClass` are rejected
- Section copy mutation — assert the target Breakpoint's section is fully replaced; other sections unchanged; cross-class paste returns an error

**Overwolf FS adapter — mock Overwolf global**
- Assert list/read/write calls pass the correct path and payload through to the Overwolf API
- All tests above this layer mock the adapter — they never touch the real file system

## Out of Scope

- **Moving a Breakpoint between BuildSets** — cross-folder drag is not supported. Breakpoints can only be reordered within their own BuildSet.
- **Item-level copy-paste** — copying individual passive nodes, individual skills, or individual inventory slots rather than whole sections.
- **Real-time Game Folder sync** — the panel is a snapshot on open, not a live file watcher.
- **Premium tier features** — `isPremium` stays in schema; no feature is gated by it at launch.
- **Any `.build` format version other than POE2 0.5.**

## Further Notes

See ADR 0001 (`.build` file as canonical format) and ADR 0002 (Breakpoint schema cleanup) for the rationale behind the schema decisions covered here.

The `additional_text` field on passive nodes is part of the official POE2 `BuildPassive` spec — it is not a Bonsai extension. Notes on nodes round-trip through import and export with no special handling required.

The app is pre-launch. No user data migration is required — the schema can be rewritten from scratch.
