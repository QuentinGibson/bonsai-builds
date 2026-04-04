import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const submit = mutation({
  args: {
    userId: v.string(),
    contact: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("bugReports", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
