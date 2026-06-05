## What to build

Wire up click allocation and deallocation on the canvas. At load time, build a grid spatial index mapping tree-space cells to node IDs. On click, compute the pointer's tree-space coordinate via the inverse transform and check the relevant grid cell to find the target node. Allocate or deallocate via BFS validation (reusing `passiveBFS.ts`). Redraw the static layer with correct colors — allocated nodes and connections visually distinct from unallocated ones. Skill point and ascendancy point counters update. Allocation state persists through `handleBreakpointChange`, `handleBuildSetChange`, and the other lifecycle methods. Clicks are no-ops when `isReadOnly` is true.

## Acceptance criteria

- [ ] Clicking a node within hit radius allocates it (if reachable)
- [ ] Clicking an allocated node deallocates it (and removes newly disconnected nodes)
- [ ] Allocated nodes render in a distinct color from unallocated nodes
- [ ] Connection lines reflect allocation state (allocated / unallocated)
- [ ] Skill point counter decrements on allocation and increments on deallocation
- [ ] Ascendancy point counter updates correctly for ascendancy nodes
- [ ] Allocation state survives `handleBreakpointChange` and `handleBuildSetChange`
- [ ] No interaction occurs when the tree is in read-only mode
- [ ] The grid spatial index is built once at load and not rebuilt on zoom or pan

## Blocked by

- #020
- #021
