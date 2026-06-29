## What to build

Inside `CanvasTreeRenderer.drawStatic()`, call `drawAscendancyBackground` immediately after `ctx.setTransform` is applied and before the connection and node draw loops. Guard the call so it only executes when `activeAscendancyNodeIds` is non-empty and `activeAscendancyTransform` is non-null — otherwise skip entirely, leaving the canvas unchanged for builds with no ascendancy selected. Because `setAscendancy` already centres all active ascendancy nodes around tree-space (0, 0), the gradient centre requires no per-ascendancy position lookup at draw time.

## Acceptance criteria

- [ ] Selecting an ascendancy class causes a radial gradient to appear behind the ascendancy cluster on the static canvas layer
- [ ] The gradient is dark at the centre and fades to transparent at the outer edge, not obscuring adjacent main-tree nodes
- [ ] A subtle coloured ring is visible at the outer edge of the gradient
- [ ] The gradient is centred on the ascendancy cluster regardless of which ascendancy is selected
- [ ] The gradient remains correctly positioned when panning and zooming
- [ ] When no ascendancy is selected, no gradient is drawn and the canvas is unaffected
- [ ] Switching ascendancies redraws the gradient for the new selection
- [ ] Ascendancy nodes are drawn on top of the gradient (gradient is below nodes in paint order)
- [ ] The gradient is rendered on the static canvas layer, not the dynamic hover layer
- [ ] All existing tests continue to pass (`npx vitest run`)

## Blocked by

#026
