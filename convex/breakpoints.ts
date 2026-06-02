import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
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

export const reorder = mutation({
  args: {
    updates: v.array(v.object({ id: v.id("breakpoints"), order: v.number() })),
  },
  handler: async (ctx, { updates }) => {
    await Promise.all(updates.map(({ id, order }) => ctx.db.patch(id, { order })));
  },
});

export const copySection = mutation({
  args: {
    sourceId: v.id("breakpoints"),
    targetId: v.id("breakpoints"),
    section: v.union(v.literal("passives"), v.literal("skills"), v.literal("inventory")),
  },
  handler: async (ctx, { sourceId, targetId, section }) => {
    const source = await ctx.db.get(sourceId);
    const target = await ctx.db.get(targetId);
    if (!source || !target) throw new ConvexError("Breakpoint not found");

    const sourceBuildSet = await ctx.db.get(source.buildSetId);
    const targetBuildSet = await ctx.db.get(target.buildSetId);
    if (!sourceBuildSet || !targetBuildSet) throw new ConvexError("BuildSet not found");

    if ((sourceBuildSet.className ?? "") !== (targetBuildSet.className ?? "")) {
      throw new ConvexError("Cannot paste section between builds with different classes");
    }

    const patch: Record<string, unknown> = {};
    if (section === "passives") patch.passives = source.passives;
    else if (section === "skills") patch.skills = source.skills ?? [];
    else patch.inventory_slots = source.inventory_slots ?? [];

    await ctx.db.patch(targetId, patch);
    await ctx.db.patch(target.buildSetId, { updatedAt: Date.now() });
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
