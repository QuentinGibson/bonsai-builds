## What to build

Remove the `isPremium` check that gates the Marketplace publish action in the UI. Any logged-in user can publish at launch. The `isPremium` field stays in the `users` table for future use but gates nothing.

**Database:** None — `isPremium` remains on `users`, unused by any feature at launch.

**Routes:** None — `marketplace.publish` already only blocks `authorId === "anon"`. No server-side change needed.

**UI:** Find and remove any conditional that checks `isPremium` before showing or enabling the Publish button or the publish flow in the Marketplace screen.

## Acceptance criteria

- [ ] A logged-in user who is not premium can open and complete the publish flow
- [ ] No `isPremium` check gates the Publish button or any step of the publish modal
- [ ] `isPremium` is still present in the `users` table schema (not removed)
- [ ] Anonymous users still cannot publish (existing `authorId === "anon"` guard is untouched)

## Blocked by

None — can start immediately
