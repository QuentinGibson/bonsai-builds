## What to build

Increase the passive tree tooltip font sizes in `ScreenPassiveTree.scss` to match the official PoE2 build planner. Currently `.tooltip-title` is 14px and `.tooltip-stats div` is 12px; both are too small to read at a glance.

Target sizes:
- `.tooltip-title` → ~18px
- `.tooltip-stats div` → ~14px

Visual change only. Verified by inspection against reference screenshots.

## Acceptance criteria

- [ ] `.tooltip-title` renders at approximately 18px
- [ ] `.tooltip-stats div` renders at approximately 14px
- [ ] No other tooltip layout or styling is affected

## Blocked by

None — can start immediately
