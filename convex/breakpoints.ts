import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const add = mutation({
  args: {
    buildSetId: v.id("buildSets"),
    name: v.string(),
    level: v.number(),
    allocatedNodes: v.array(v.string()),
    allocatedAscendancyNodes: v.array(v.string()),
    selectedClass: v.optional(v.string()),
    selectedAscendancy: v.optional(v.string()),
  },
  handler: async (ctx, { buildSetId, ...data }) => {
    const id = await ctx.db.insert("breakpoints", {
      buildSetId,
      ...data,
      createdAt: Date.now(),
    });
    await ctx.db.patch(buildSetId, { updatedAt: Date.now() });
    return id as string;
  },
});

// Pass empty string for selectedClass/selectedAscendancy to clear the field.
export const update = mutation({
  args: {
    id: v.id("breakpoints"),
    buildSetId: v.id("buildSets"),
    name: v.optional(v.string()),
    level: v.optional(v.number()),
    allocatedNodes: v.optional(v.array(v.string())),
    allocatedAscendancyNodes: v.optional(v.array(v.string())),
    selectedClass: v.optional(v.string()),
    selectedAscendancy: v.optional(v.string()),
  },
  handler: async (ctx, { id, buildSetId, ...updates }) => {
    const patch: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined) {
        patch[key] = val === "" ? undefined : val;
      }
    }
    await ctx.db.patch(id, patch);
    await ctx.db.patch(buildSetId, { updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("breakpoints"), buildSetId: v.id("buildSets") },
  handler: async (ctx, { id, buildSetId }) => {
    await ctx.db.delete(id);
    await ctx.db.patch(buildSetId, { updatedAt: Date.now() });
  },
});

export const clearAll = mutation({
  args: { buildSetId: v.id("buildSets") },
  handler: async (ctx, { buildSetId }) => {
    const bps = await ctx.db
      .query("breakpoints")
      .withIndex("by_build", (q) => q.eq("buildSetId", buildSetId))
      .collect();
    await Promise.all(bps.map((bp) => ctx.db.delete(bp._id)));
    await ctx.db.patch(buildSetId, { updatedAt: Date.now() });
  },
});

export const resetAscendancy = mutation({
  args: {
    buildSetId: v.id("buildSets"),
    ascendancy: v.union(v.string(), v.null()),
  },
  handler: async (ctx, { buildSetId, ascendancy }) => {
    const bps = await ctx.db
      .query("breakpoints")
      .withIndex("by_build", (q) => q.eq("buildSetId", buildSetId))
      .collect();
    await Promise.all(
      bps.map((bp) =>
        ctx.db.patch(bp._id, {
          selectedAscendancy: ascendancy ?? undefined,
          allocatedAscendancyNodes: [],
        })
      )
    );
    await ctx.db.patch(buildSetId, { updatedAt: Date.now() });
  },
});
