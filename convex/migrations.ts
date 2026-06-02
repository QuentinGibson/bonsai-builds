import { internalMutation } from "./_generated/server";

// Migration complete — breakpoints.passives is now required in the schema.
// These are kept as no-ops so any scheduled invocations don't error.
export const backfillBreakpointPassives = internalMutation({
  args: {},
  handler: async (_ctx) => {
    // no-op: passives field is now required; all documents already have it
  },
});

export const backfillMarketplacePassives = internalMutation({
  args: {},
  handler: async (_ctx) => {
    // no-op: marketplace breakpoint snapshots already use passives
  },
});
