# Bonsai Builds — Pre-Submission TODO

## Blockers
- [x] Set `"open_dev_tools": false` in manifest.json
- [x] Update manifest version from `0.0.1` to match changelog (0.4.0)
- [x] Fill in manifest `"description"` field (required for Overwolf store)

## Backend / Features
- [x] Wire up bug report — create `bugReports` table in Convex schema, add mutation, update `BugReport.tsx` to call it directly (same pattern as `Feedback.tsx`)
- [x] Complete premium flow — single ad-free plan, Overwolf Subscriptions API wired up (set `kPremiumPlanId` + `kSubscriptionUrl` in `constants.ts` once registered)
- [ ] Post-release: unhide premium nav button, set up Tebex store + contact Overwolf to link credentials

## Store Submission Assets
- [x] Create `/store/` directory with required Overwolf store assets
- [x] Update README.md to describe the actual app (features, changelog, setup)

## Lower Priority
- [x] Expand changelog — rewritten as a welcome/intro for the first release
- [x] Harden FTUE — DOM selectors in `FTUE.tsx` can silently fail if elements are missing
