## What to build

On every `mousemove`, clear the dynamic canvas layer and redraw the BFS shortest path from the nearest allocated node to the hovered unallocated node in an intermediate "preview" color. Preview nodes and their connecting edges are drawn on the dynamic layer only — the static layer is not touched. When the cursor leaves the tree or hovers an allocated node, the dynamic layer is cleared.

## Acceptance criteria

- [ ] Hovering an unallocated node draws a preview path from the closest allocated node to it
- [ ] Preview nodes appear in a color distinct from both allocated and unallocated nodes
- [ ] Preview connection lines match the preview node color
- [ ] Moving the cursor updates the preview path immediately (no perceptible lag)
- [ ] Hovering an allocated node clears the dynamic layer (no preview shown)
- [ ] The static layer is not redrawn on `mousemove`

## Blocked by

- #022
