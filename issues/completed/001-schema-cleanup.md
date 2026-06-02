## What to build

Clean up the Convex schema to match the domain model before any other 0.5 work ships. This is the foundational change everything else depends on.

**Database:**
- Drop `level` from `breakpoints`
- Drop `selectedClass` from `breakpoints`
- Drop `ascendancy` from `buildSets`
- Upgrade `allocatedNodes` from `v.array(v.string())` to `v.array(v.object({ id: v.string(), weapon_set: v.optional(v.number()), additional_text: v.optional(v.string()) }))`
- Add `order: v.number()` to `buildSets`
- Add `order: v.number()` to `breakpoints`
- Clean the `marketplaceListings.breakpoints` snapshot to match: drop `level`, drop `selectedClass`, upgrade `allocatedNodes` to the same object shape

**Routes:**
- Remove the `resetAscendancy` mutation from `convex/breakpoints.ts`
- Update `breakpoints.add` and `breakpoints.update` args to accept the new `allocatedNodes` shape and reject `level` / `selectedClass`
- Update `buildSets.getAll`, `buildSets.get` return shapes to drop `level`, `selectedClass` from breakpoint rows and drop `ascendancy` from buildSet rows
- Update `marketplace.publish` and `marketplace.update` to use the cleaned snapshot shape

**UI:** No visible change — purely structural.

## Acceptance criteria

- [ ] `breakpoints` table has no `level` or `selectedClass` field
- [ ] `buildSets` table has no `ascendancy` field
- [ ] `allocatedNodes` stores objects `{id, weapon_set?, additional_text?}`, not bare strings
- [ ] Both `buildSets` and `breakpoints` have an `order: number` field
- [ ] `resetAscendancy` mutation is deleted
- [ ] `marketplace.publish` and `marketplace.update` accept and store the new breakpoint snapshot shape
- [ ] `breakpoints.add` rejects `level` and `selectedClass` in its args
- [ ] Convex type-checks pass

## Blocked by

None — can start immediately
