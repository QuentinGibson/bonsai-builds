## What to build

Allow build authors to drag-reorder BuildSets in the list. Dropping a BuildSet at a new position updates the `order` fields of the affected rows only — sibling Breakpoints and other BuildSets are not touched.

**Database:** None.

**Routes:** Add `buildSets.reorder` mutation — accepts `{id, newOrder}` (or an ordered array of ids) and patches the `order` field on affected rows only. Unrelated BuildSets are unchanged.

**UI:** Drag handle on each BuildSet folder row. On drop, calls `buildSets.reorder` and the list reorders optimistically.

## Acceptance criteria

- [ ] BuildSet rows have a drag handle
- [ ] Dragging a BuildSet to a new position and dropping updates the displayed order
- [ ] `buildSets.reorder` only patches `order` on the moved rows — other BuildSets are unaffected
- [ ] Reorder survives a page reload (order is persisted, not local state)

## Blocked by

- #002 (folder/file tree layout must exist first)
