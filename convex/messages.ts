import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";

function truncatePreview(text: string) {
  const trimmed = text.trim();
  if (trimmed.length <= 120) return trimmed;
  return `${trimmed.slice(0, 117)}...`;
}

export const listMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", args.conversationId).eq(
          "clerkUserId",
          identity.subject
        )
      )
      .unique();

    if (!membership) {
      return [];
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_and_time", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();

    const messageIds = messages.map((message) => message._id);
    const reactionsByMessage = new Map<Id<"messages">, Doc<"reactions">[]>();

    for (const messageId of messageIds) {
      const reactions = await ctx.db
        .query("reactions")
        .withIndex("by_message_id", (q) => q.eq("messageId", messageId))
        .collect();
      reactionsByMessage.set(messageId, reactions);
    }

    const identitySubject = identity.subject;

    const enriched = messages.map((message) => {
      const reactions = reactionsByMessage.get(message._id);

      const counts = new Map<string, number>();
      const userReacted = new Set<string>();

      for (const reaction of reactions ?? []) {
        counts.set(reaction.emoji, (counts.get(reaction.emoji) ?? 0) + 1);
        if (reaction.clerkUserId === identitySubject) {
          userReacted.add(reaction.emoji);
        }
      }

      return {
        ...message,
        reactionCounts: Array.from(counts.entries()).map(([emoji, count]) => ({
          emoji,
          count,
          reacted: userReacted.has(emoji),
        })),
      };
    });

    return enriched;
  },
});

export const sendMessage = mutation({
  args: { conversationId: v.id("conversations"), body: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", args.conversationId).eq(
          "clerkUserId",
          identity.subject
        )
      )
      .unique();

    if (!membership) {
      throw new Error("Not a member of this conversation");
    }

    const trimmed = args.body.trim();
    if (!trimmed) {
      throw new Error("Message cannot be empty");
    }

    const now = Date.now();
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: identity.subject,
      body: trimmed,
      createdAt: now,
    });

    await ctx.db.patch(args.conversationId, {
      lastMessageAt: now,
      lastMessagePreview: truncatePreview(trimmed),
      lastMessageSenderId: identity.subject,
    });

    return messageId;
  },
});

export const deleteMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    if (message.senderId !== identity.subject) {
      throw new Error("Not allowed");
    }

    if (message.deletedAt) {
      return;
    }

    await ctx.db.patch(args.messageId, { deletedAt: Date.now(), body: "" });

    const conversation = await ctx.db.get(message.conversationId);
    if (!conversation) {
      return;
    }

    if (conversation.lastMessageSenderId === identity.subject) {
      await ctx.db.patch(message.conversationId, {
        lastMessagePreview: "Message deleted",
      });
    }
  },
});

export const toggleReaction = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    const existing = await ctx.db
      .query("reactions")
      .withIndex("by_message_and_user", (q) =>
        q.eq("messageId", args.messageId).eq(
          "clerkUserId",
          identity.subject
        )
      )
      .collect();

    for (const reaction of existing) {
      if (reaction.emoji === args.emoji) {
        await ctx.db.delete(reaction._id);
        return { reacted: false };
      }
    }

    for (const reaction of existing) {
      await ctx.db.delete(reaction._id);
    }

    await ctx.db.insert("reactions", {
      messageId: args.messageId,
      clerkUserId: identity.subject,
      emoji: args.emoji,
      createdAt: Date.now(),
    });

    return { reacted: true };
  },
});
