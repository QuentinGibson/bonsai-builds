## What to build

Add inventory slots to the Breakpoint data model and build the Inventory Slots editor — item base picker, mod picker, level ranges, and per-slot notes.

**Database:**
- Finalize `inventory_slots` on `breakpoints`: `v.array(v.object({ inventory_id: v.string(), level_interval: v.array(v.number()), slot_x: v.number(), slot_y: v.number(), additional_text: v.string() }))` (was optional stub in #011, now required shape)
- Update `marketplaceListings.breakpoints` snapshot to include `inventory_slots`
- Ship `public/items.json` — `Array<{id, name, inventory_id}>` and `public/mods.json` — `Array<{id, name}>` generated from PathOfBuilding-PoE2 repo

**Routes:**
- `breakpoints.add` and `breakpoints.update` accept `inventory_slots`
- `marketplace.publish` and `marketplace.update` include `inventory_slots` in the snapshot

**UI:**
- Inventory section in the Breakpoint detail view: flat list of all standard slot IDs (Weapon1, Weapon2, BodyArmour1, Gloves1, Boots1, Helm1, Ring1, Ring2, Amulet1, Belt1, Flask1–5), each row expandable
- Each slot: base item picker (searchable, filtered to slot's `inventory_id`), mod picker (searchable, user enters value after selection; assembled into `additional_text`), `<AdditionalTextEditor />` for direct markup editing, level range inputs
- `slot_x`/`slot_y` populated from a static lookup table — not user-editable

## Acceptance criteria

- [ ] `inventory_slots` field is stored and returned correctly by `buildSets.get`
- [ ] Marketplace snapshot includes `inventory_slots`
- [ ] Item picker filters to slot-appropriate bases
- [ ] Mod picker + value assembles into `additional_text` correctly
- [ ] Level range persists; `slot_x`/`slot_y` populated from static lookup
- [ ] Ad Container is never covered

## Blocked by

- #011 (stub `inventory_slots` field exists)
- #012 (AdditionalTextEditor component)
