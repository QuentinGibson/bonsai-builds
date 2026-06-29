## Context

Issue 025 asked for 13 missing passive node icons. We pivoted to a sprite-sheet approach using `poe2-skilltree-export` assets for performance (1-2 HTTP requests instead of ~500).

## What was built

### New files
- `src/data/passiveIconFrames.ts` — 530-entry lookup: `iconName → [x, y, w, h]` from `skills.json` (active sprite)
- `src/data/passiveIconFramesDisabled.ts` — 530-entry lookup from `skills-disabled.json` (disabled sprite)
- `src/services/passiveIconSprite.ts` — exports `getActiveFrame(iconName)` and `getDisabledFrame(iconName)`
- `src/services/passiveIconSprite.test.ts` — 8 passing tests
- `public/images/skills.webp` — 426KB active sprite sheet (copied from `../poe2-skilltree-export/assets/`)
- `public/images/skills-disabled.webp` — 281KB disabled sprite sheet

### Modified files
- `passiveTreeLogic.ts` `applyNodeImages()` — now creates **two** SVG `<image>` elements per sprite-covered node:
  - `.node-icon-active` (href=`skills.webp`) — hidden by default via CSS, shown when circle has `.allocated`
  - `.node-icon node-icon-disabled` (href=`skills-disabled.webp`) — visible by default
  - Falls back to single `.node-icon` individual PNG for ~51 mastery icons not in sprite
- `ScreenPassiveTree.scss` — CSS sibling selectors toggle the two images based on `.allocated` class

### Sprite coordinate math
For a frame `{x, y, w, h}` displayed at `imgSize = r * 1.8` centered at `(cx, cy)`:
```
s = imgSize / frame.w
image.x = (cx - imgSize/2) - frame.x * s
image.y = (cy - imgSize/2) - frame.y * s
image.width  = SPRITE_SHEET_W * s   // 1029
image.height = SPRITE_SHEET_H * s   // 1508
```
The existing circular clipPath clips the full sprite sheet down to just the node icon.

## Bug: icons not showing after build

After running the build script, **no icons appear** on the passive tree (including ones that were working before).

## Suspected causes to investigate

1. **CSS `display: none` on `.node-icon-active`** — check if it's accidentally hiding `.node-icon-disabled` too, or if the SCSS scope (`.primary`) isn't matching the SVG elements correctly.

2. **Disabled sprite coordinates wrong** — `archonofundeathnode` in `passiveIconFramesDisabled.ts` is `[306, 0, 34, 34]` — same coords as active sheet. Verify `skills-disabled.json` has distinct inactive coords (the active and disabled sheets may share the same layout).

3. **`skills-disabled.webp` path not found in Overwolf** — the href `/assets-static/images/skills-disabled.webp` may fail silently if the file didn't copy correctly. Check build output.

4. **Overwolf SVG `href` vs `xlink:href`** — the Overwolf embedded browser may require `xlink:href` on SVG `<image>` elements. The old individual-PNG code also used `href` (not `xlink:href`), so this is lower priority.

5. **Sibling selector broken** — the CSS `circle:not(.allocated) + .node-icon-active { display: none }` may not compile correctly inside the SCSS `.primary {}` scope. Inspect compiled CSS in devtools.

## Key files to read

```
src/components/ScreenPassiveTree/passiveTreeLogic.ts   lines 286-400  (applyNodeImages)
src/components/ScreenPassiveTree/ScreenPassiveTree.scss lines 96-135  (node-icon CSS)
src/services/passiveIconSprite.ts
src/data/passiveIconFrames.ts                          (first few lines to sanity-check)
src/data/passiveIconFramesDisabled.ts                  (first few lines)
```

## Quickest way to confirm root cause

In Overwolf devtools (F12 on the passive tree window):
1. Inspect a node circle — check what sibling `<image>` elements follow it
2. Check `getComputedStyle(imageEl).display` on the `.node-icon-disabled` image
3. Check if `imageEl.getAttribute('href')` resolves (try `fetch('/assets-static/images/skills-disabled.webp')`)
4. Temporarily set `imageEl.style.display = 'block'` to see if the image renders
