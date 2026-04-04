import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    userId: v.string(),
    isPremium: v.boolean(),
    premiumSince: v.optional(v.number()),
  }).index("by_userId", ["userId"]),

  marketplaceListings: defineTable({
    authorId: v.string(),
    authorName: v.string(),
    name: v.string(),
    description: v.string(),
    className: v.string(),
    ascendancy: v.optional(v.string()),
    breakpoints: v.array(v.object({
      name: v.string(),
      level: v.number(),
      allocatedNodes: v.array(v.string()),
      allocatedAscendancyNodes: v.array(v.string()),
      selectedClass: v.optional(v.string()),
      selectedAscendancy: v.optional(v.string()),
    })),
    likeCount: v.number(),
    downloadCount: v.number(),
    ratingCount: v.number(),
    ratingSum: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_author", ["authorId"])
    .index("by_createdAt", ["createdAt"]),

  marketplaceComments: defineTable({
    listingId: v.id("marketplaceListings"),
    parentId: v.optional(v.id("marketplaceComments")),
    authorId: v.string(),
    authorName: v.string(),
    body: v.string(),
    score: v.number(),
    createdAt: v.number(),
  }).index("by_listing", ["listingId"]),

  marketplaceCommentVotes: defineTable({
    commentId: v.id("marketplaceComments"),
    userId: v.string(),
    value: v.number(),
  }).index("by_comment_user", ["commentId", "userId"]),

  marketplaceRatings: defineTable({
    listingId: v.id("marketplaceListings"),
    userId: v.string(),
    value: v.number(),
  }).index("by_listing_user", ["listingId", "userId"]),

  marketplaceLikes: defineTable({
    listingId: v.id("marketplaceListings"),
    userId: v.string(),
  }).index("by_listing_user", ["listingId", "userId"]),

  marketplaceDownloads: defineTable({
    listingId: v.id("marketplaceListings"),
    userId: v.string(),
  }).index("by_listing_user", ["listingId", "userId"]),

  marketplaceHiddenComments: defineTable({
    userId: v.string(),
    commentId: v.id("marketplaceComments"),
  }).index("by_user_comment", ["userId", "commentId"]),

  marketplaceReports: defineTable({
    reporterId: v.string(),
    targetId: v.string(),
    targetType: v.union(v.literal("comment"), v.literal("listing")),
    reason: v.string(),
    createdAt: v.number(),
  }).index("by_reporter_target", ["reporterId", "targetId"]),

  feedback: defineTable({
    userId: v.string(),
    contact: v.string(),
    message: v.string(),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),

  bugReports: defineTable({
    userId: v.string(),
    contact: v.string(),
    message: v.string(),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),

  buildSets: defineTable({
    userId: v.string(),
    name: v.string(),
    className: v.optional(v.string()),
    ascendancy: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  breakpoints: defineTable({
    buildSetId: v.id("buildSets"),
    name: v.string(),
    level: v.number(),
    allocatedNodes: v.array(v.string()),
    allocatedAscendancyNodes: v.array(v.string()),
    selectedClass: v.optional(v.string()),
    selectedAscendancy: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_build", ["buildSetId"]),
});
