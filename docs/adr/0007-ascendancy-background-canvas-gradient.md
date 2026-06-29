# Ascendancy background painted with canvas radial gradient

The ascendancy cluster area needs a visual background to distinguish it from the main tree. We draw a radial gradient dark fill with a subtle colored ring directly on the static canvas layer rather than loading a per-ascendancy (or shared) image asset.

## Decision

No background image assets. The background is a canvas `createRadialGradient` call rendered before the ascendancy nodes on the static layer.

## Considered Options

**Per-ascendancy artwork** — thematic images unique to each ascendancy (e.g., Deadeye ranger backdrop). Rejected: requires sourcing or creating 20+ images; proprietary game assets can't be used directly.

**Single shared background image** — one panel image behind all ascendancy clusters. Rejected: still requires sourcing/creating an asset and wiring image loading into the renderer.

**Canvas radial gradient** — chosen. Zero new assets, consistent with the canvas-only rendering strategy (ADR 0006), and renders in the same draw call as everything else on the static layer.
