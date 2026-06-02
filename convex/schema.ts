import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const passiveNodeValidator = v.object({
  id: v.string(),
  weapon_set: v.optional(v.number()),
  additional_text: v.optional(v.string()),
});

export const supportSkillValidator = v.object({
  id: v.string(),
  level_interval: v.array(v.number()),
  additional_text: v.optional(v.string()),
});

export const skillValidator = v.object({
  id: v.string(),
  level_interval: v.array(v.number()),
  additional_text: v.optional(v.string()),
  support_skills: v.array(supportSkillValidator),
});

export const inventorySlotValidator = v.object({
  inventory_id: v.string(),
  level_interval: v.array(v.number()),
  slot_x: v.number(),
  slot_y: v.number(),
  additional_text: v.string(),
});

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
      order: v.number(),
      passives: v.array(passiveNodeValidator),
      skills: v.optional(v.array(skillValidator)),
      inventory_slots: v.optional(v.array(inventorySlotValidator)),
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
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  breakpoints: defineTable({
    buildSetId: v.id("buildSets"),
    name: v.string(),
    order: v.number(),
    passives: v.array(passiveNodeValidator),
    skills: v.optional(v.array(skillValidator)),
    inventory_slots: v.optional(v.array(inventorySlotValidator)),
    selectedAscendancy: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_build", ["buildSetId"]),
});
