## What to build

On the static canvas layer, hide mastery placeholder nodes and draw only the active ascendancy group at its configured coordinate offset. Nodes from non-matching ascendancies are skipped entirely. The ascendancy panel uses the same transform offsets defined in `ascendancyConfig.ts`.

## Acceptance criteria

- [ ] Mastery placeholder nodes are not drawn on the canvas
- [ ] The active ascendancy group appears offset from the main tree
- [ ] Only the ascendancy matching the selected class is drawn
- [ ] Switching ascendancy class redraws the static layer with the correct group
- [ ] No other ascendancy groups are visible

## Blocked by

- #020
