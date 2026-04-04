# Ethereal Navigator — Style Rules

## Theme
Migrating from BonsaiBuilds warm amber → cool teal. Layout/content unchanged, only colors and fonts change.

## CSS Variables (defined in src/styles/globals.css)
Use these — never hardcode hex values:
- `--bg-canvas: #080C12` (replaces warm #0D0B09)
- `--bg-panel: #111927` (replaces #1A1410)
- `--bg-card: #151F2E`
- `--accent-primary: #00D4B4` (replaces amber #C8952A everywhere)
- `--text-primary: #E8EEF5` (replaces warm #E8D9B5)
- `--text-label: #4A6580` (uppercase labels)
- `--color-ascendancy: #A87BE8`
- `--color-negative: #E85D5D`
- `--node-default: #1E3D56` (replaces #3D2A14)

## Fonts
- Display/headings/stats: `font-family: var(--font-display)` → Rajdhani 700
- Labels (uppercase): `font-family: var(--font-mono)` → Share Tech Mono
- Body: `font-family: var(--font-body)` → Inter

## Rules Claude must follow
- NEVER use old amber hex values (#C8952A, #C8952A, #1A1410, #0D0B09, etc.)
- NEVER use Georgia or serif fonts for UI elements
- Active nav: border-left 2px solid var(--accent-primary), NOT background highlight
- Passive points stat: color var(--accent-primary)
- Ascendancy stat: color var(--color-ascendancy)
- Optimize Build button: outline style (transparent bg + teal border), NOT filled
- Uppercase labels: Share Tech Mono, tracking 0.15em
```

**Step 2 — Reference the full HTML guide for deep dives:**

When you need Claude Code to look at the full spec for a specific component, just say it inline:
```
implement the stat weights panel — see style-guide.html for the exact pattern
```

Claude Code will read the file from your project directory if it's checked in.

---

**Two other patterns that work well:**

If you keep the style guide in the repo (e.g. `docs/style-guide.html`), you can also reference it ad-hoc:
```
# in your CLAUDE.md
## Reference
Full visual spec: docs/style-guide.html — check this when implementing new components.
```

And for one-off sessions where you want Claude Code focused on a specific migration task, you can just start with:
```
read docs/style-guide.html, then restyle src/components/StatCard.tsx to match the Ethereal Navigator spec
