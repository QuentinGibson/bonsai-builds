## What to build

Export a new pure function `drawAscendancyBackground(ctx, outerRadius, colorStops)` from `canvasTreeRenderer.ts`, placed in the pure-function section alongside the existing helpers (`computeIconDrawArgs`, `buildStatsHtml`, etc.). The function calls `ctx.createRadialGradient(0, 0, 0, 0, 0, outerRadius)` and adds colour stops: an opaque dark fill at the inner stop, a subtle coloured ring stop just inside the outer edge, and fully transparent at the outer edge. It then fills a circle of radius `outerRadius` with the resulting gradient. No image assets are loaded; the effect is produced entirely with the Canvas 2D gradient API.

Unit tests live in `canvasTreeRenderer.test.ts` using a lightweight mock of `CanvasRenderingContext2D` that records calls to `createRadialGradient` and `addColorStop`, consistent with the existing test pattern (plain Vitest `describe`/`it`/`expect`, no DOM).

## Acceptance criteria

- [ ] Function is exported from `canvasTreeRenderer.ts` and importable in tests without instantiating the renderer class
- [ ] `createRadialGradient` is called with centre at (0, 0) for both inner and outer circles
- [ ] `createRadialGradient` is called with the configured `outerRadius` as the outer radius
- [ ] At least one fully opaque dark colour stop is added via `addColorStop`
- [ ] At least one fully transparent colour stop is added via `addColorStop`
- [ ] A coloured ring stop is added at a position between the inner opaque stop and the outer transparent stop
- [ ] All tests pass (`npx vitest run`)

## Blocked by

None — can start immediately
