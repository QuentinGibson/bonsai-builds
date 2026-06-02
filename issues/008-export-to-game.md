## What to build

Add a one-click "Export to game" action per Breakpoint that writes the `.build` file directly to the game's `Preferences/BuildPlanner` directory via the Overwolf file system API. This is distinct from the existing "Export to computer" blob download, which stays unchanged.

**Database:** None.

**Routes:** Overwolf FS adapter — `writeToGameFolder(filename, payload)` wraps the Overwolf file system write call with the correct base path (`Preferences/BuildPlanner`). Filename is constructed as `{BuildSet name}~{Breakpoint name}.build` with `~` stripped from both name components before joining.

**UI:** "Export to game" button on each Breakpoint row (or in its context menu), alongside the existing "Export to computer" option. On success, show a brief confirmation. On failure (Overwolf API unavailable, e.g. desktop browser), surface a clear error.

## Acceptance criteria

- [ ] "Export to game" button is present per Breakpoint
- [ ] Clicking it writes `{BuildSet}~{Breakpoint}.build` to `Preferences/BuildPlanner` (with `~` stripped from both name segments)
- [ ] Existing "Export to computer" blob download is unaffected
- [ ] Overwolf FS adapter is tested with a mocked Overwolf global — adapter tests never touch the real file system
- [ ] A clear error is shown when the Overwolf API is unavailable

## Blocked by

None — can start immediately
