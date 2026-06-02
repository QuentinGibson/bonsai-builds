## What to build

Move ascendancy editing to the individual Breakpoint level. Each Breakpoint gets its own ascendancy selector. The BuildSet-level ascendancy reset control is removed.

**Database:** None — `selectedAscendancy` is already per-Breakpoint after #001. The BuildSet-level `ascendancy` field is dropped in #001.

**Routes:** Remove any remaining call sites that invoked `resetAscendancy` (the mutation itself is deleted in #001).

**UI:**
- Ascendancy selector appears in each Breakpoint's edit form (not on the BuildSet)
- Any UI control that previously called `resetAscendancy` or set ascendancy at the BuildSet level is removed
- Base class (`className`) remains fixed at the BuildSet level and is not editable per-Breakpoint

## Acceptance criteria

- [ ] Each Breakpoint has its own ascendancy selector
- [ ] Changing one Breakpoint's ascendancy does not affect siblings
- [ ] No UI control for BuildSet-level ascendancy reset remains
- [ ] `className` is not editable at the Breakpoint level

## Blocked by

- #001 (removes `resetAscendancy` and drops BuildSet-level `ascendancy`)
