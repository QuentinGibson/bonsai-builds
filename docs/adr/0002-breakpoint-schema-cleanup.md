# Breakpoint schema cleanup

The `breakpoints` table (and its marketplace snapshot) needs several corrections before the 0.5 schema rewrite ships. These were discovered during a domain review against the `.build` file format and the existing glossary.

## Decisions

### 1. Remove `level` from `breakpoints` and marketplace snapshot

`level: number` exists in both tables but has no defined purpose — the glossary states "no numeric level field; name is the only identifier." It is not part of the Breakpoint's identity and is not used by any current feature. Removed from `breakpoints`, `marketplaceListings.breakpoints`, and all mutation args.

### 2. `className` belongs to `BuildSet`, not `Breakpoint`

A character's base class cannot change mid-build — a Warrior stays a Warrior across all Breakpoints. `selectedClass` on individual Breakpoints creates a consistency hazard (two Breakpoints in the same BuildSet could disagree on class). `className` is a BuildSet-level field only.

`selectedAscendancy` remains per-Breakpoint. Ascendancy *can* change between stages of a build (e.g. Smith of Kitava → Berserker is a legitimate progression choice).

`resetAscendancy` on the breakpoints module is removed — it reset all Breakpoints in a BuildSet to the same ascendancy simultaneously, which was only sensible when ascendancy was BuildSet-level. With per-Breakpoint ascendancy, the caller controls each one individually.

### 3. `allocatedNodes` stores objects, not bare strings

The glossary defines Passive Nodes as `{id: string, weapon_set?: number, additional_text?: string}`. The schema stored them as `v.array(v.string())`. The schema is corrected to match the glossary and the POE2 `.build` format's `BuildPassive` object, which natively supports all three fields.

### 4. Add `order` to `buildSets` and `breakpoints`

The UI renders BuildSets as folders and Breakpoints as files, both drag-reorderable. Neither table had an `order` field. Added to both. Cross-folder Breakpoint movement is out of scope — reordering is within-container only.

## Considered Options

**Keep `level` as optional display metadata** — rejected. Optional fields with no defined semantics become tech debt magnets. If a character level display is ever needed, it can be added with a clear purpose.

**Per-Breakpoint `className` with validation** — rejected. Enforcing class consistency at write time is safer than allowing inconsistent state and validating on read. Storing it once at the BuildSet level eliminates the problem entirely.

## Consequences

All existing `breakpoints` rows with a `level` field need migration (drop the field). All existing rows with `allocatedNodes` as strings need migration to objects — at minimum `{id: string}` with `weapon_set` and `additional_text` absent. The app is pre-launch so no user data preservation is required; the schema can be rewritten from scratch.
