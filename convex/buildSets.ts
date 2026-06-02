import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const sets = await ctx.db
      .query("buildSets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return Promise.all(
      sets.map(async (s) => {
        const breakpoints = await ctx.db
          .query("breakpoints")
          .withIndex("by_build", (q) => q.eq("buildSetId", s._id))
          .collect();
        return {
          id: s._id as string,
          name: s.name,
          className: s.className ?? "",
          order: s.order,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          breakpoints: breakpoints.map((bp) => ({
            id: bp._id as string,
            name: bp.name,
            order: bp.order,
            passives: bp.passives,
            selectedAscendancy: bp.selectedAscendancy ?? null,
            createdAt: bp.createdAt,
          })),
        };
      })
    );
  },
});

export const get = query({
  args: { id: v.id("buildSets") },
  handler: async (ctx, { id }) => {
    const s = await ctx.db.get(id);
    if (!s) return null;
    const breakpoints = await ctx.db
      .query("breakpoints")
      .withIndex("by_build", (q) => q.eq("buildSetId", id))
      .collect();
    return {
      id: s._id as string,
      name: s.name,
      className: s.className ?? "",
      order: s.order,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      breakpoints: breakpoints.map((bp) => ({
        id: bp._id as string,
        name: bp.name,
        order: bp.order,
        passives: bp.passives,
        selectedAscendancy: bp.selectedAscendancy ?? null,
        createdAt: bp.createdAt,
      })),
    };
  },
});

export const create = mutation({
  args: { userId: v.string(), name: v.string(), className: v.optional(v.string()), order: v.optional(v.number()) },
  handler: async (ctx, { userId, name, className, order }) => {
    const now = Date.now();
    const id = await ctx.db.insert("buildSets", {
      userId,
      name,
      ...(className ? { className } : {}),
      order: order ?? 0,
      createdAt: now,
      updatedAt: now,
    });
    return id as string;
  },
});

// Pass empty string for className to clear the field.
export const update = mutation({
  args: {
    id: v.id("buildSets"),
    name: v.optional(v.string()),
    className: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, { id, name, className, order }) => {
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (name !== undefined) patch.name = name;
    if (className !== undefined) patch.className = className || undefined;
    if (order !== undefined) patch.order = order;
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("buildSets") },
  handler: async (ctx, { id }) => {
    const bps = await ctx.db
      .query("breakpoints")
      .withIndex("by_build", (q) => q.eq("buildSetId", id))
      .collect();
    await Promise.all(bps.map((bp) => ctx.db.delete(bp._id)));
    await ctx.db.delete(id);
  },
});
