import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getOrCreate = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (user) {
      return { isPremium: user.isPremium, premiumSince: user.premiumSince ?? null };
    }
    return { isPremium: false, premiumSince: null };
  },
});

export const setPremium = mutation({
  args: { userId: v.string(), isPremium: v.boolean() },
  handler: async (ctx, { userId, isPremium }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        isPremium,
        premiumSince: isPremium && !existing.isPremium ? Date.now() : existing.premiumSince,
      });
    } else {
      await ctx.db.insert("users", {
        userId,
        isPremium,
        premiumSince: isPremium ? Date.now() : undefined,
      });
    }
  },
});
