## What to build

Expose the `additional_text` field on passive nodes in the passive tree UI. Build authors can click an allocated node to open an inline note editor.

**Database:** None — `additional_text` lives on node objects in `passives` after #011.

**Routes:** No new mutations needed — `breakpoints.update` already accepts the full `passives` array. The UI patches the relevant node object in the array and calls `update`.

**UI:**
- Clicking an allocated passive node opens an inline or panel editor for `additional_text`
- The editor uses `<AdditionalTextEditor />` from #015 (markup textarea, live preview, tag toolbar)
- Saving patches the node object in `passives` (field absent when note is empty — not stored as `""`)
- Nodes with a note get a visual indicator on the tree (e.g. a small dot or highlight)

## Acceptance criteria

- [ ] Clicking an allocated passive node opens the `additional_text` editor
- [ ] Editor uses the shared markup textarea, live preview, and tag toolbar
- [ ] Saving a note updates the node's `additional_text` in the `passives` array
- [ ] Clearing a note removes `additional_text` from the node object entirely (no empty string stored)
- [ ] Nodes with a note are visually distinguishable on the passive tree
- [ ] Round-trips losslessly through export and import

## Blocked by

- #011 (passives field must be settled before patching node objects)
- #012 (AdditionalTextEditor component)
