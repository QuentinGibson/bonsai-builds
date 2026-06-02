import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { passiveNodeValidator, skillValidator, inventorySlotValidator } from "./schema";

export const add = mutation({
  args: {
    buildSetId: v.id("buildSets"),
    name: v.string(),
    order: v.optional(v.number()),
    passives: v.array(passiveNodeValidator),
    skills: v.optional(v.array(skillValidator)),
    inventory_slots: v.optional(v.array(inventorySlotValidator)),
    selectedAscendancy: v.optional(v.string()),
  },
  handler: async (ctx, { buildSetId, order, ...data }) => {
    let resolvedOrder = order;
    if (resolvedOrder === undefined) {
      const existing = await ctx.db
        .query("breakpoints")
        .withIndex("by_build", (q) => q.eq("buildSetId", buildSetId))
        .collect();
      resolvedOrder = existing.length === 0 ? 0 : Math.max(...existing.map((bp) => bp.order)) + 1;
    }
    const id = await ctx.db.insert("breakpoints", {
      buildSetId,
      order: resolvedOrder,
      ...data,
      createdAt: Date.now(),
    });
    await ctx.db.patch(buildSetId, { updatedAt: Date.now() });
    return id as string;
  },
});

export const update = mutation({
  args: {
    id: v.id("breakpoints"),
    buildSetId: v.id("buildSets"),
    name: v.optional(v.string()),
    order: v.optional(v.number()),
    passives: v.optional(v.array(passiveNodeValidator)),
    skills: v.optional(v.array(skillValidator)),
    inventory_slots: v.optional(v.array(inventorySlotValidator)),
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
