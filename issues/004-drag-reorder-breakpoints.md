## What to build

Allow build authors to drag-reorder Breakpoints within their parent BuildSet. A Breakpoint cannot be dragged into a different BuildSet — cross-folder movement is out of scope.

**Database:** None.

**Routes:** Add `breakpoints.reorder` mutation — accepts `{id, newOrder}` and patches the `order` field on affected rows within a single BuildSet. Rows in other BuildSets are not touched.

**UI:** Drag handle on each Breakpoint file row. On drop within the same BuildSet, calls `breakpoints.reorder`. Dragging across BuildSet boundaries is not supported (drop target is confined to the parent folder).

## Acceptance criteria

- [ ] Breakpoint rows have a drag handle
- [ ] Dragging a Breakpoint within its BuildSet updates the displayed order
- [ ] `breakpoints.reorder` only patches `order` on affected rows — other Breakpoints and other BuildSets are unchanged
- [ ] Dropping a Breakpoint outside its parent BuildSet has no effect
- [ ] Reorder survives a page reload

## Blocked by

- #002 (folder/file tree layout must exist first)
