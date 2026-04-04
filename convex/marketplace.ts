import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const breakpointSnapshot = v.object({
  name: v.string(),
  level: v.number(),
  allocatedNodes: v.array(v.string()),
  allocatedAscendancyNodes: v.array(v.string()),
  selectedClass: v.optional(v.string()),
  selectedAscendancy: v.optional(v.string()),
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const listings = await ctx.db
      .query("marketplaceListings")
      .order("desc")
      .collect();
    return listings.map((l) => ({
      id: l._id as string,
      authorId: l.authorId,
      authorName: l.authorName,
      name: l.name,
      description: l.description,
      className: l.className,
      ascendancy: l.ascendancy ?? null,
      likeCount: l.likeCount,
      downloadCount: l.downloadCount,
      ratingCount: l.ratingCount,
      averageRating: l.ratingCount > 0 ? l.ratingSum / l.ratingCount : 0,
      createdAt: l.createdAt,
    }));
  },
});

export const get = query({
  args: { id: v.id("marketplaceListings") },
  handler: async (ctx, { id }) => {
    const l = await ctx.db.get(id);
    if (!l) return null;
    const comments = await ctx.db
      .query("marketplaceComments")
      .withIndex("by_listing", (q) => q.eq("listingId", id))
      .order("asc")
      .collect();
    return {
      id: l._id as string,
      authorId: l.authorId,
      authorName: l.authorName,
      name: l.name,
      description: l.description,
      className: l.className,
      ascendancy: l.ascendancy ?? null,
      breakpoints: l.breakpoints,
      likeCount: l.likeCount,
      downloadCount: l.downloadCount,
      ratingCount: l.ratingCount,
      averageRating: l.ratingCount > 0 ? l.ratingSum / l.ratingCount : 0,
      createdAt: l.createdAt,
      comments: comments.map((c) => ({
        id: c._id as string,
        parentId: (c.parentId as string | undefined) ?? null,
        authorId: c.authorId,
        authorName: c.authorName,
        body: c.body,
        score: c.score,
        createdAt: c.createdAt,
      })),
    };
  },
});

export const publish = mutation({
  args: {
    authorId: v.string(),
    authorName: v.string(),
    name: v.string(),
    description: v.string(),
    className: v.optional(v.string()),
    ascendancy: v.optional(v.string()),
    breakpoints: v.array(breakpointSnapshot),
  },
  handler: async (ctx, args) => {
    if (args.authorId === "anon") throw new Error("Not authorized");
    const now = Date.now();
    const id = await ctx.db.insert("marketplaceListings", {
      ...args,
      likeCount: 0,
      downloadCount: 0,
      ratingCount: 0,
      ratingSum: 0,
      createdAt: now,
      updatedAt: now,
    });
    return id as string;
  },
});

export const update = mutation({
  args: {
    id: v.id("marketplaceListings"),
    userId: v.string(),
    name: v.string(),
    description: v.string(),
    className: v.string(),
    ascendancy: v.optional(v.string()),
    breakpoints: v.array(breakpointSnapshot),
  },
  handler: async (ctx, { id, userId, ...fields }) => {
    const listing = await ctx.db.get(id);
    if (!listing || listing.authorId !== userId) throw new Error("Not authorized");
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("marketplaceListings"), userId: v.string() },
  handler: async (ctx, { id, userId }) => {
    const listing = await ctx.db.get(id);
    if (!listing || listing.authorId !== userId) throw new Error("Not authorized");
    const [comments, ratings, likes] = await Promise.all([
      ctx.db.query("marketplaceComments").withIndex("by_listing", (q) => q.eq("listingId", id)).collect(),
      ctx.db.query("marketplaceRatings").withIndex("by_listing_user", (q) => q.eq("listingId", id)).collect(),
      ctx.db.query("marketplaceLikes").withIndex("by_listing_user", (q) => q.eq("listingId", id)).collect(),
    ]);
    const [commentVotes, hiddenComments] = await Promise.all([
      Promise.all(
        comments.map((c) =>
          ctx.db.query("marketplaceCommentVotes")
            .withIndex("by_comment_user", (q) => q.eq("commentId", c._id))
            .collect()
        )
      ).then((r) => r.flat()),
      Promise.all(
        comments.map((c) =>
          ctx.db.query("marketplaceHiddenComments")
            .withIndex("by_user_comment", (q) => q.eq("commentId", c._id))
            .collect()
        )
      ).then((r) => r.flat()),
    ]);
    await Promise.all([
      ...comments.map((c) => ctx.db.delete(c._id)),
      ...commentVotes.map((v) => ctx.db.delete(v._id)),
      ...hiddenComments.map((h) => ctx.db.delete(h._id)),
      ...ratings.map((r) => ctx.db.delete(r._id)),
      ...likes.map((l) => ctx.db.delete(l._id)),
    ]);
    await ctx.db.delete(id);
  },
});

export const incrementDownload = mutation({
  args: { id: v.id("marketplaceListings"), userId: v.string() },
  handler: async (ctx, { id, userId }) => {
    const [listing, existing] = await Promise.all([
      ctx.db.get(id),
      ctx.db
        .query("marketplaceDownloads")
        .withIndex("by_listing_user", (q) => q.eq("listingId", id).eq("userId", userId))
        .unique(),
    ]);
    if (!listing || existing) return;
    await ctx.db.insert("marketplaceDownloads", { listingId: id, userId });
    await ctx.db.patch(id, { downloadCount: listing.downloadCount + 1 });
  },
});

export const getUserLike = query({
  args: { listingId: v.id("marketplaceListings"), userId: v.string() },
  handler: async (ctx, { listingId, userId }) => {
    const like = await ctx.db
      .query("marketplaceLikes")
      .withIndex("by_listing_user", (q) => q.eq("listingId", listingId).eq("userId", userId))
      .unique();
    return !!like;
  },
});

export const toggleLike = mutation({
  args: { listingId: v.id("marketplaceListings"), userId: v.string() },
  handler: async (ctx, { listingId, userId }) => {
    if (userId === "anon") throw new Error("Not authorized");
    const [existing, listing] = await Promise.all([
      ctx.db.query("marketplaceLikes").withIndex("by_listing_user", (q) => q.eq("listingId", listingId).eq("userId", userId)).unique(),
      ctx.db.get(listingId),
    ]);
    if (!listing) return false;
    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(listingId, { likeCount: Math.max(0, listing.likeCount - 1) });
      return false;
    } else {
      await ctx.db.insert("marketplaceLikes", { listingId, userId });
      await ctx.db.patch(listingId, { likeCount: listing.likeCount + 1 });
      return true;
    }
  },
});

export const getUserRating = query({
  args: { listingId: v.id("marketplaceListings"), userId: v.string() },
  handler: async (ctx, { listingId, userId }) => {
    const rating = await ctx.db
      .query("marketplaceRatings")
      .withIndex("by_listing_user", (q) => q.eq("listingId", listingId).eq("userId", userId))
      .unique();
    return rating?.value ?? null;
  },
});

export const setRating = mutation({
  args: {
    listingId: v.id("marketplaceListings"),
    userId: v.string(),
    value: v.number(),
  },
  handler: async (ctx, { listingId, userId, value }) => {
    if (userId === "anon") throw new Error("Not authorized");
    const [existing, listing] = await Promise.all([
      ctx.db.query("marketplaceRatings").withIndex("by_listing_user", (q) => q.eq("listingId", listingId).eq("userId", userId)).unique(),
      ctx.db.get(listingId),
    ]);
    if (!listing) return;
    if (existing) {
      await ctx.db.patch(existing._id, { value });
      await ctx.db.patch(listingId, { ratingSum: listing.ratingSum - existing.value + value });
    } else {
      await ctx.db.insert("marketplaceRatings", { listingId, userId, value });
      await ctx.db.patch(listingId, {
        ratingCount: listing.ratingCount + 1,
        ratingSum: listing.ratingSum + value,
      });
    }
  },
});

export const addComment = mutation({
  args: {
    listingId: v.id("marketplaceListings"),
    parentId: v.optional(v.id("marketplaceComments")),
    authorId: v.string(),
    authorName: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.authorId === "anon") throw new Error("Not authorized");
    const id = await ctx.db.insert("marketplaceComments", {
      ...args,
      score: 0,
      createdAt: Date.now(),
    });
    return id as string;
  },
});

export const voteComment = mutation({
  args: {
    commentId: v.id("marketplaceComments"),
    userId: v.string(),
    value: v.number(), // 1, -1, or 0 (remove vote)
  },
  handler: async (ctx, { commentId, userId, value }) => {
    if (userId === "anon") throw new Error("Not authorized");
    const [existing, comment] = await Promise.all([
      ctx.db
        .query("marketplaceCommentVotes")
        .withIndex("by_comment_user", (q) => q.eq("commentId", commentId).eq("userId", userId))
        .unique(),
      ctx.db.get(commentId),
    ]);
    if (!comment) return;
    const prev = existing?.value ?? 0;
    const delta = value - prev;
    if (existing) {
      if (value === 0) {
        await ctx.db.delete(existing._id);
      } else {
        await ctx.db.patch(existing._id, { value });
      }
    } else if (value !== 0) {
      await ctx.db.insert("marketplaceCommentVotes", { commentId, userId, value });
    }
    if (delta !== 0) {
      await ctx.db.patch(commentId, { score: comment.score + delta });
    }
  },
});

export const getUserCommentVotes = query({
  args: { listingId: v.id("marketplaceListings"), userId: v.string() },
  handler: async (ctx, { listingId, userId }) => {
    if (userId === "anon") return {} as Record<string, number>;
    const comments = await ctx.db
      .query("marketplaceComments")
      .withIndex("by_listing", (q) => q.eq("listingId", listingId))
      .collect();
    const votes: Record<string, number> = {};
    await Promise.all(
      comments.map(async (c) => {
        const vote = await ctx.db
          .query("marketplaceCommentVotes")
          .withIndex("by_comment_user", (q) => q.eq("commentId", c._id).eq("userId", userId))
          .unique();
        if (vote) votes[c._id as string] = vote.value;
      })
    );
    return votes;
  },
});

export const toggleHideComment = mutation({
  args: { commentId: v.id("marketplaceComments"), userId: v.string() },
  handler: async (ctx, { commentId, userId }) => {
    const existing = await ctx.db
      .query("marketplaceHiddenComments")
      .withIndex("by_user_comment", (q) => q.eq("userId", userId).eq("commentId", commentId))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }
    await ctx.db.insert("marketplaceHiddenComments", { userId, commentId });
    return true;
  },
});

export const getUserHiddenComments = query({
  args: { listingId: v.id("marketplaceListings"), userId: v.string() },
  handler: async (ctx, { listingId, userId }) => {
    if (userId === "anon") return [] as string[];
    const comments = await ctx.db
      .query("marketplaceComments")
      .withIndex("by_listing", (q) => q.eq("listingId", listingId))
      .collect();
    const results = await Promise.all(
      comments.map(async (c) => {
        const h = await ctx.db
          .query("marketplaceHiddenComments")
          .withIndex("by_user_comment", (q) => q.eq("userId", userId).eq("commentId", c._id))
          .unique();
        return h ? (c._id as string) : null;
      })
    );
    return results.filter(Boolean) as string[];
  },
});

export const reportContent = mutation({
  args: {
    reporterId: v.string(),
    targetId: v.string(),
    targetType: v.union(v.literal("comment"), v.literal("listing")),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.reporterId === "anon") throw new Error("Not authorized");
    const existing = await ctx.db
      .query("marketplaceReports")
      .withIndex("by_reporter_target", (q) =>
        q.eq("reporterId", args.reporterId).eq("targetId", args.targetId)
      )
      .unique();
    if (existing) return false; // already reported
    await ctx.db.insert("marketplaceReports", { ...args, createdAt: Date.now() });
    return true;
  },
});

export const deleteComment = mutation({
  args: { id: v.id("marketplaceComments"), userId: v.string() },
  handler: async (ctx, { id, userId }) => {
    const comment = await ctx.db.get(id);
    if (!comment || comment.authorId !== userId) throw new Error("Not authorized");
    await ctx.db.delete(id);
  },
});
