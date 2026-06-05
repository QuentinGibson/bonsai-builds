## What to build

On `mousemove`, resolve the hovered node from the grid spatial index and update the existing `#node-tooltip` DOM element with that node's name and stats. Position the tooltip relative to the cursor via CSS transform. Clear the tooltip when the cursor is not over any node.

## Acceptance criteria

- [ ] Hovering a node shows its name and stat lines in the tooltip
- [ ] The tooltip tracks the cursor position
- [ ] Moving off a node hides the tooltip
- [ ] Tooltip content matches what the SVG implementation showed

## Blocked by

- #022
