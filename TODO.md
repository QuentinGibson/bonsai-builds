# Bonsai Builds — Pre-Submission TODO

## Blockers
- [ ] Set `"open_dev_tools": false` in manifest.json
- [ ] Update manifest version from `0.0.1` to match changelog (0.4.0)
- [ ] Fill in manifest `"description"` field (required for Overwolf store)

## Backend / Features
- [x] Wire up bug report — create `bugReports` table in Convex schema, add mutation, update `BugReport.tsx` to call it directly (same pattern as `Feedback.tsx`)
- [ ] Complete premium flow — replace placeholder "Plan A / B / C" with real pricing and integrate Overwolf Subscriptions API
- [ ] Implement breakpoint save/load TODOs in `passiveTreeLogic.ts` (~lines 1090–1097)

## Store Submission Assets
- [ ] Create `/store/` directory with required Overwolf store assets:
  - App icon variants
  - Banner image
  - Gameplay screenshots
  - Marketing copy / app description
- [ ] Update README.md to describe the actual app (features, changelog, setup)

## Lower Priority
- [ ] Expand changelog — currently only has 2 entries (0.4.0c/d)
- [ ] Harden FTUE — DOM selectors in `FTUE.tsx` can silently fail if elements are missing
