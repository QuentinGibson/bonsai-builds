# POE2 `.build` file as the canonical build format

The app's internal data model is designed around the POE2 `.build` file format rather than a custom schema. Each Breakpoint maps 1:1 to a `.build` document (passives, skills, inventory slots), and export is a direct serialization with no transformation layer. We chose this over a richer custom format because the `.build` file is what the game actually reads — users' ultimate goal is a file that works in-game, not a Bonsai-specific artifact. Building around it means import and export are lossless by construction, and the app stays compatible with Path of Building and any other tool that speaks the same format.

## Considered Options

**Custom schema with `.build` as an export target** — store builds in a richer internal format (e.g., structured mod objects, tier data, named breakpoints with level fields) and serialize to `.build` on demand. Rejected because it creates two sources of truth: any field the custom schema supports that `.build` doesn't silently vanishes on export, and any `.build` field we don't model is lost on import. The impedance mismatch compounds over time.

## Consequences

The `.build` format's limitations become our limitations. Fields like `additional_text` are plain markup strings — we can't store structured data there without breaking compatibility. New POE2 format versions require updating the app's data model. Bonsai-specific metadata (breakpoint names, build guide text) lives outside the `.build` file and is stored separately in Convex.
