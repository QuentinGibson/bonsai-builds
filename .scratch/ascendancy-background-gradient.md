# PRD: Ascendancy Background Radial Gradient

## Problem Statement

When a user selects an ascendancy class, the ascendancy cluster appears centred at the tree origin on the passive tree canvas. There is no visual treatment to distinguish the ascendancy area from the surrounding main tree — the cluster floats on the same plain dark background as the rest of the nodes, making it harder to read the ascendancy layout at a glance.

## Solution

Draw a radial gradient fill behind the ascendancy cluster directly on the static canvas layer before the ascendancy nodes are painted. The gradient is a dark, near-opaque centre that fades outward, with a subtle coloured ring at the cluster radius. No image assets are loaded; the effect is produced entirely with the Canvas 2D API `createRadialGradient` call.

## User Stories

1. As a build planner, I want the ascendancy cluster to have a distinct visual background, so that I can quickly tell where the ascendancy area begins and ends on the passive tree.
2. As a build planner, I want the background to appear automatically when I select an ascendancy class, so that I do not need to take any extra action to see it.
3. As a build planner, I want the background to disappear when no ascendancy is selected, so that the main tree is uncluttered when I have not chosen an ascendancy.
4. As a build planner, I want the gradient to be centred on the ascendancy cluster, so that it always frames the nodes correctly regardless of which ascendancy I pick.
5. As a build planner, I want the background to remain correctly positioned when I pan and zoom the tree, so that the visual treatment never drifts away from the cluster.
6. As a build planner, I want the background to redraw when I switch ascendancies, so that it always reflects my current selection.
7. As a build planner, I want the radial gradient to be dark at the centre and fade to transparent at the edge, so that it does not obscure adjacent main-tree nodes.
8. As a build planner, I want a subtle coloured ring at the outer edge of the gradient, so that the ascendancy area has a faint decorative border that distinguishes it without being visually noisy.
9. As a build planner, I want the background to render before the ascendancy nodes in the draw order, so that nodes are always drawn on top of the gradient and remain fully readable.
10. As a build planner, I want the background to be rendered on the static layer (not the dynamic hover layer), so that panning and zooming remain fast and the gradient does not flicker during interaction.
11. As a build planner, I want the background to scale correctly with zoom, so that it covers the same cluster area at all zoom levels.
12. As a build planner, I want the transition between the ascendancy background and the main tree background to be smooth and gradual, so that the edge of the gradient does not look like a hard border.
13. As a build planner, I want the gradient style to be consistent across all ascendancies (Deadeye, Pathfinder, Titan, Infernalist, etc.), so that the visual language is uniform.
14. As a build planner, I want the background to not require any network requests or asset loading, so that it appears immediately without waiting for images.

## Implementation Decisions

- **Render site:** The gradient is drawn inside `drawStatic()` on the static canvas layer, immediately after `ctx.setTransform` is applied and before the connection and node draw loops. This guarantees the background sits beneath all tree content in the paint order.
- **Coordinate space:** After `setAscendancy` applies the cluster transform (from `ascendancyConfig`), all active ascendancy nodes are centred around tree-space (0, 0). The gradient centre is therefore always (0, 0) in tree space — no additional per-ascendancy position lookup is needed at draw time.
- **Gradient parameters:** `ctx.createRadialGradient(0, 0, 0, 0, 0, outerRadius)` where `outerRadius` is a constant sized to comfortably contain the largest cluster. Colour stops: opaque dark fill at the inner stop, fully transparent at the outer stop, with an intermediate coloured stop (e.g. subtle gold or grey) just inside the outer edge to produce the ring effect.
- **Guard:** The gradient is only drawn when `activeAscendancyNodeIds` is non-empty and `activeAscendancyTransform` is non-null; it is skipped entirely otherwise.
- **New pure function:** Extract the gradient drawing logic into a new exported pure function (e.g. `drawAscendancyBackground(ctx, outerRadius, colorStops)`) so it can be tested without a full renderer instance. This follows the existing pattern of exporting pure helpers alongside the `CanvasTreeRenderer` class.
- **No new module:** The function lives in `canvasTreeRenderer` alongside the other static-layer helpers; no new file is needed.
- **No per-ascendancy colour variation:** A single gradient colour scheme is used for all ascendancies. Thematic per-ascendancy colours are explicitly out of scope (see ADR 0007).
- **No image assets:** The effect is entirely produced by the Canvas 2D gradient API. No `HTMLImageElement` loading path is touched.

## Testing Decisions

A good test for this feature verifies the observable outputs of the pure function — specifically that `createRadialGradient` is called with the expected centre coordinates and radius, and that `addColorStop` is called with the intended stops — without asserting on internal draw order (implementation detail).

- **Module under test:** The new `drawAscendancyBackground` pure function exported from `canvasTreeRenderer`.
- **Approach:** Unit test with a lightweight mock of `CanvasRenderingContext2D` (recording calls to `createRadialGradient` and `addColorStop`), consistent with the existing `computeIconDrawArgs` and `buildStatsHtml` tests in `canvasTreeRenderer.test.ts`.
- **Prior art:** `canvasTreeRenderer.test.ts` — all existing tests use plain Vitest `describe`/`it`/`expect` with no DOM; the same pattern applies here.
- **Cases to cover:**
  - Gradient centre is at (0, 0) in tree space.
  - Gradient outer radius matches the configured constant.
  - At least one opaque dark stop and one fully transparent stop are added.
  - The coloured ring stop is present between the inner and outer stops.

## Out of Scope

- Per-ascendancy thematic colours or artwork (ADR 0007).
- Any shared or per-ascendancy background image asset.
- Changes to the dynamic canvas layer.
- Changes to hit-testing, spatial index, or any interaction logic.
- Gradient animation or transitions between ascendancy switches.

## Further Notes

This feature is governed by ADR 0007 (ascendancy background painted with canvas radial gradient) and must remain consistent with ADR 0006 (canvas-only rendering, two-layer architecture). Any future desire for per-ascendancy artwork should produce a new ADR rather than expanding this feature incrementally.
