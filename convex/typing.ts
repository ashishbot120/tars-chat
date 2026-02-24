import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const TYPING_WINDOW_MS = 2_000;

export const updateTyping = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const existing = await ctx.db
      .query("typing")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", args.conversationId).eq(
          "clerkUserId",
          identity.subject
        )
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { lastTypedAt: now });
    } else {
      await ctx.db.insert("typing", {
        conversationId: args.conversationId,
        clerkUserId: identity.subject,
        lastTypedAt: now,
      });
    }
  },
});

export const listTyping = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const now = Date.now();
    const records = await ctx.db
      .query("typing")
      .withIndex("by_conversation_id", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    return records
      .filter((record) => record.clerkUserId !== identity.subject)
      .filter((record) => now - record.lastTypedAt <= TYPING_WINDOW_MS);
  },
});
