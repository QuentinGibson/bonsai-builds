## What to build

Replace the passive node fields with the `.build`-aligned `passives` array and ship the import/export flows that make a Breakpoint a first-class `.build` file.

**Database:**
- Replace `allocatedNodes` + `allocatedAscendancyNodes` with `passives: v.array(v.object({ id: v.string(), weapon_set: v.optional(v.number()), additional_text: v.optional(v.string()) }))` — ascendancy nodes live here too, identified by ID prefix
- Add stub optional fields `skills: v.optional(v.array(...))` and `inventory_slots: v.optional(v.array(...))` so the schema is forward-compatible with #012 and #013
- Update `marketplaceListings.breakpoints` snapshot: replace `allocatedNodes`/`allocatedAscendancyNodes` with `passives`

**Routes:**
- Update `breakpoints.add` and `breakpoints.update` args to accept `passives`; reject `allocatedNodes`, `allocatedAscendancyNodes`
- Update `buildSets.getAll` / `buildSets.get` return shapes
- Update `marketplace.publish` and `marketplace.update` snapshot shape
- Add pure functions (no Convex runtime needed): `parseBuildFile(json)`, `serializeBuildFile(breakpoint, buildSet)`, `parseFilename(filename)` — backed by a static `class-ascendancy-map.ts` (e.g. `"Warrior3"` ↔ `{className, ascendancy}`)

**UI:**
- Import: file picker + drop target in the build list → calls `parseBuildFile` → prompts user: **Create new BuildSet** or **Add as Breakpoint to existing** (dropdown filtered to matching `className`)
- Export: "Export to computer" button per Breakpoint → `serializeBuildFile` → blob download as `{BuildSet}~{Breakpoint}.build`

**Tests:**
- `parseBuildFile` on `build-examples/warrior-shield-build.build` → correct passives count, weapon-set tags
- Round-trip: `parseBuildFile(serializeBuildFile(bp, meta))` equals original
- `parseFilename`: single `~`, no `~`, multiple `~` (split on first only)

## Acceptance criteria

- [ ] `breakpoints` table has `passives`; no `allocatedNodes` or `allocatedAscendancyNodes`
- [ ] `breakpoints.add` accepts `passives`; Convex type-checks pass
- [ ] Marketplace snapshot updated
- [ ] Import flow creates a BuildSet or appends a Breakpoint correctly
- [ ] "Export to computer" downloads a valid `.build` file
- [ ] Round-trip and filename parser tests pass

## Blocked by

- #001 (schema cleanup complete)
