## What to build

Add skills to the Breakpoint data model and build the Skills editor — gem picker, support gems, level ranges, and per-gem notes.

**Database:**
- Finalize `skills` on `breakpoints`: `v.array(v.object({ id: v.string(), level_interval: v.array(v.number()), additional_text: v.optional(v.string()), support_skills: v.array(v.object({ id: v.string(), level_interval: v.array(v.number()), additional_text: v.optional(v.string()) })) }))` (was optional stub in #011, now required shape)
- Update `marketplaceListings.breakpoints` snapshot to include `skills`
- Ship `public/gems.json` — `Array<{id, name, isSupport}>` generated from PathOfBuilding-PoE2 repo

**Routes:**
- `breakpoints.add` and `breakpoints.update` accept `skills`
- `marketplace.publish` and `marketplace.update` include `skills` in the snapshot

**UI:**
- `<AdditionalTextEditor value onChange />` — shared component used here and in #013 and #007: markup textarea + live preview (POE2 color/font tags, `\n` as line break) + tag-insertion toolbar
- Skills section in the Breakpoint detail view: skill gem rows (name, level range, additional text, remove), support gem sub-rows, "Add skill" / "Add support" buttons that open a searchable gem picker (name substring, `isSupport` filtered)

**Tests:**
- `renderMarkup(raw)` pure function: color tag → correct CSS; `\n` → line break; unknown tag → passthrough

## Acceptance criteria

- [ ] `skills` field is stored and returned correctly by `buildSets.get`
- [ ] Marketplace snapshot includes `skills`
- [ ] Gem picker correctly filters skill vs support gems
- [ ] Level range and additional text persist per skill and per support gem
- [ ] Live preview renders color and font tags correctly
- [ ] `renderMarkup` unit tests pass

## Blocked by

- #011 (passives schema settled; stub `skills` field exists)
