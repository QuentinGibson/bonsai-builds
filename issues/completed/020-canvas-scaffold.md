## What to build

Replace the `<svg>` element inside `#tree-container` with two stacked `<canvas>` elements (static layer + dynamic layer). Draw all non-hidden nodes as plain circles and connections as lines on the static layer. Wire up RAF-throttled drag pan, wheel zoom via `ctx.setTransform`, zoom widget integration (`treezoomchange` event), and a reset-camera button. `ScreenPassiveTree.tsx` is unchanged — the public API surface of `PassiveTreeManager` (`initialize`, zoom methods, etc.) remains the same.

This is the tracer bullet that proves the canvas approach end-to-end.

## Acceptance criteria

- [ ] Two stacked `<canvas>` elements appear where the `<svg>` was
- [ ] All nodes render as circles at correct tree-space positions
- [ ] Connection lines render between connected nodes
- [ ] Drag pan moves the tree smoothly (RAF-throttled)
- [ ] Wheel zoom scales the tree around the cursor
- [ ] `+` / `−` zoom buttons and zoom track still work (dispatch `treezoomchange`)
- [ ] Reset camera snaps back to the class start node
- [ ] No SVG elements remain in `#tree-container`
- [ ] `ScreenPassiveTree.tsx` has no changes

## Blocked by

None — can start immediately
