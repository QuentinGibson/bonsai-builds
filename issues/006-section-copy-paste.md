## What to build

Let build authors copy an entire section (passives, skills, or inventory) from one Breakpoint and paste it into another, replacing that section entirely. Cross-BuildSet paste is allowed only between BuildSets with the same `className`.

**Database:** None.

**Routes:** Add `breakpoints.copySection` mutation — args: `{ sourceId, targetId, section: "passives" | "skills" | "inventory" }`. Reads the source Breakpoint's section, writes it to the target, leaves all other sections on the target untouched. Returns an error if the source and target BuildSets have different `className` values.

**UI:**
- Context menu on each Breakpoint row: **Copy Passives**, **Copy Skills**, **Copy Inventory**
- Paste action appears in the context menu showing the source Breakpoint name (e.g. "Paste Passives from Act 1")
- Paste is **disabled** (not hidden) when the source and target BuildSets have different classes; a tooltip explains why
- In-memory clipboard holds one section at a time; copying a new section replaces the previous clipboard contents

## Acceptance criteria

- [ ] Copying a section stores it in the in-app clipboard
- [ ] Pasting replaces only the named section on the target Breakpoint; other sections are unchanged
- [ ] Paste is disabled when source and target BuildSets have different `className`
- [ ] Disabled paste shows a tooltip explaining the class mismatch
- [ ] Paste works cross-BuildSet when classes match
- [ ] `breakpoints.copySection` returns an error for cross-class paste attempts (server-side guard)

## Blocked by

- #013 (all three sections — passives, skills, inventory_slots — must be settled before section copy-paste can work across all of them)
