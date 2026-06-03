## What to build

Increase passive node circle radii in `generate_tree.py` to match the official PoE2 build planner, then regenerate `public/poe2snippet.html`.

Current `CIRCLE_RADII`: `{normal: 40, notable: 56, keystone: 104}`
Target `CIRCLE_RADII`: `{normal: 100, notable: 140, keystone: 200}`

After changing the constant, re-run `python3 scripts/generate_tree.py` to write the new SVG. Only `poe2snippet.html` changes — `data_us.json` is unaffected by this slice.

Visual change only. Verified by inspection: normal nodes are clearly larger, notable and keystone nodes are visually distinct by size.

## Acceptance criteria

- [ ] `CIRCLE_RADII` in `generate_tree.py` updated to `{normal: 100, notable: 140, keystone: 200}`
- [ ] `public/poe2snippet.html` regenerated with the new radii
- [ ] Normal, notable, and keystone nodes are visually distinct by size at default zoom
- [ ] No regression in tree layout or connection rendering

## Blocked by

None — can start immediately
