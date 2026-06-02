## What to build

Add a persistent Game Folder Panel that lists all `.build` files currently in the game's `Preferences/BuildPlanner` directory. Players can import any file directly from the panel without using a file picker. The panel stays open across imports so multiple builds can be imported in one session.

**Database:** None.

**Routes:**
- Overwolf FS adapter — `listGameFolder()` returns all `.build` filenames in `Preferences/BuildPlanner`; `readFromGameFolder(filename)` returns the file contents
- Filename parser (pure function) — splits on the first `~`: left side → BuildSet name, right side → Breakpoint name. If no `~`, full filename (minus `.build`) → BuildSet name, Breakpoint name → `"Default"`. Multiple `~` chars: split on the first only
- All layers above the adapter mock it — no real file system access in tests

**UI:**
- Persistent side panel (not a modal); opens via a toolbar button or navigation item
- Panel lists all `.build` files found on open; each row shows the filename and an Import button
- Importing a file runs the filename parser, then creates or appends to the matching BuildSet as a new Breakpoint
- Panel stays open after import
- Panel must not cover the Ad Container

## Acceptance criteria

- [ ] Panel is persistent (not a modal) and can stay open while navigating
- [ ] Panel lists all `.build` files in `Preferences/BuildPlanner` when opened
- [ ] Each file has an Import button; clicking it imports without a file picker
- [ ] `"ColdSnap~Endgame.build"` → BuildSet `"ColdSnap"`, Breakpoint `"Endgame"`
- [ ] `"TornadoShot.build"` → BuildSet `"TornadoShot"`, Breakpoint `"Default"`
- [ ] `"My~Build~Act1.build"` → BuildSet `"My"`, Breakpoint `"Build~Act1"` (split on first `~` only)
- [ ] Panel stays open after each import
- [ ] Panel does not cover the Ad Container
- [ ] Filename parser is tested as a pure function with no Overwolf dependency

## Blocked by

None — can start immediately (shares Overwolf FS adapter with #008, but can be developed in parallel)
