## What to build

Render the build list as a folder/file tree. BuildSets appear as expandable folder rows. Breakpoints appear as indented file rows inside their parent BuildSet. Layout is static (no drag yet — that is #003 and #004). Rows are ordered by the `order` field added in #001.

**Database:** None — reads `order` from schema added in #001.

**Routes:** None — `buildSets.getAll` already returns breakpoints nested under each BuildSet.

**UI:**
- BuildSet rows render with a folder icon and expand/collapse toggle
- Breakpoint rows render indented beneath their parent, with a file icon
- List is sorted by `order` ascending within each container
- Collapsed BuildSets hide their Breakpoint rows

## Acceptance criteria

- [ ] BuildSets render as expandable folder rows with a collapse toggle
- [ ] Breakpoints render as indented file rows inside the correct BuildSet
- [ ] Both are sorted by `order` ascending
- [ ] Collapsing a BuildSet hides its Breakpoints
- [ ] Expanding restores them

## Blocked by

- #001 (schema cleanup — needs `order` field and clean shape)
