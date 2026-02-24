import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    name: v.string(),
    nameLower: v.optional(v.string()),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_clerk_user_id", ["clerkUserId"])
    .index("by_name", ["name"])
    .index("by_name_lower", ["nameLower"]),
  conversations: defineTable({
    isGroup: v.boolean(),
    title: v.optional(v.string()),
    createdBy: v.optional(v.string()),
    createdAt: v.number(),
    lastMessageAt: v.optional(v.number()),
    lastMessagePreview: v.optional(v.string()),
    lastMessageSenderId: v.optional(v.string()),
  }),
  conversationMembers: defineTable({
    conversationId: v.id("conversations"),
    clerkUserId: v.string(),
    role: v.optional(v.string()),
    joinedAt: v.number(),
    lastReadAt: v.number(),
  })
    .index("by_clerk_user_id", ["clerkUserId"])
    .index("by_conversation_id", ["conversationId"])
    .index("by_conversation_and_user", ["conversationId", "clerkUserId"]),
  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.string(),
    body: v.string(),
    createdAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_conversation_id", ["conversationId"])
    .index("by_conversation_and_time", ["conversationId", "createdAt"]),
  presence: defineTable({
    clerkUserId: v.string(),
    online: v.boolean(),
    lastSeenAt: v.number(),
  }).index("by_clerk_user_id", ["clerkUserId"]),
  typing: defineTable({
    conversationId: v.id("conversations"),
    clerkUserId: v.string(),
    lastTypedAt: v.number(),
  })
    .index("by_conversation_id", ["conversationId"])
    .index("by_conversation_and_user", ["conversationId", "clerkUserId"]),
  reactions: defineTable({
    messageId: v.id("messages"),
    clerkUserId: v.string(),
    emoji: v.string(),
    createdAt: v.number(),
  })
    .index("by_message_id", ["messageId"])
    .index("by_message_and_user", ["messageId", "clerkUserId"]),
});
