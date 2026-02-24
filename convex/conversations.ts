import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getOrCreateDM = mutation({
  args: { otherClerkUserId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentClerkUserId = identity.subject;
    if (currentClerkUserId === args.otherClerkUserId) {
      throw new Error("Cannot start a conversation with yourself");
    }

    const myMemberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", currentClerkUserId)
      )
      .collect();

    for (const membership of myMemberships) {
      const conversation = await ctx.db.get(membership.conversationId);
      if (!conversation || conversation.isGroup) continue;

      const members = await ctx.db
        .query("conversationMembers")
        .withIndex("by_conversation_id", (q) =>
          q.eq("conversationId", membership.conversationId)
        )
        .collect();

      if (members.length !== 2) continue;

      const hasOtherMember = members.some(
        (member) => member.clerkUserId === args.otherClerkUserId
      );

      if (hasOtherMember) {
        return membership.conversationId;
      }
    }

    const now = Date.now();
    const conversationId = await ctx.db.insert("conversations", {
      isGroup: false,
      createdBy: currentClerkUserId,
      createdAt: now,
    });

    await ctx.db.insert("conversationMembers", {
      conversationId,
      clerkUserId: currentClerkUserId,
      role: "member",
      joinedAt: now,
      lastReadAt: now,
    });

    await ctx.db.insert("conversationMembers", {
      conversationId,
      clerkUserId: args.otherClerkUserId,
      role: "member",
      joinedAt: now,
      lastReadAt: now,
    });

    return conversationId;
  },
});

export const createGroup = mutation({
  args: {
    title: v.string(),
    memberClerkUserIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const trimmedTitle = args.title.trim();
    if (!trimmedTitle) {
      throw new Error("Group name required");
    }

    const uniqueMembers = new Set(args.memberClerkUserIds);
    uniqueMembers.add(identity.subject);

    if (uniqueMembers.size < 2) {
      throw new Error("Select at least one other member");
    }

    const now = Date.now();
    const conversationId = await ctx.db.insert("conversations", {
      isGroup: true,
      title: trimmedTitle,
      createdBy: identity.subject,
      createdAt: now,
    });

    await ctx.db.insert("conversationMembers", {
      conversationId,
      clerkUserId: identity.subject,
      role: "admin",
      joinedAt: now,
      lastReadAt: now,
    });

    for (const memberId of uniqueMembers) {
      if (memberId === identity.subject) continue;
      await ctx.db.insert("conversationMembers", {
        conversationId,
        clerkUserId: memberId,
        role: "member",
        joinedAt: now,
        lastReadAt: now,
      });
    }

    return conversationId;
  },
});

export const markConversationRead = mutation({
  args: { conversationId: v.id("conversations") },
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

    await ctx.db.patch(membership._id, { lastReadAt: Date.now() });
  },
});

export const listMyConversations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const currentClerkUserId = identity.subject;
    const myMemberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", currentClerkUserId)
      )
      .collect();

    const results = await Promise.all(
      myMemberships.map(async (membership) => {
        const conversation = await ctx.db.get(membership.conversationId);
        if (!conversation) return null;

        let otherUser: {
          name: string;
          imageUrl?: string;
          clerkUserId: string;
        } | null = null;

        let groupMemberCount: number | null = null;

        if (!conversation.isGroup) {
          const members = await ctx.db
            .query("conversationMembers")
            .withIndex("by_conversation_id", (q) =>
              q.eq("conversationId", membership.conversationId)
            )
            .collect();

          const otherMember = members.find(
            (member) => member.clerkUserId !== currentClerkUserId
          );

          if (otherMember) {
            const user = await ctx.db
              .query("users")
              .withIndex("by_clerk_user_id", (q) =>
                q.eq("clerkUserId", otherMember.clerkUserId)
              )
              .unique();

            if (user) {
              otherUser = {
                name: user.name,
                imageUrl: user.imageUrl,
                clerkUserId: user.clerkUserId,
              };
            }
          }
        }

        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversation_and_time", (q) =>
            q.eq("conversationId", membership.conversationId)
          )
          .order("desc")
          .take(50);

        const unreadCount = messages.filter(
          (message) => message.createdAt > membership.lastReadAt
        ).length;

        const preview =
          conversation.lastMessagePreview ??
          (messages[0]
            ? messages[0].deletedAt
              ? "Message deleted"
              : messages[0].body
            : null);

        const lastMessageAt =
          conversation.lastMessageAt ?? messages[0]?.createdAt ?? null;

        const lastMessageSenderId =
          conversation.lastMessageSenderId ?? messages[0]?.senderId ?? null;

        if (conversation.isGroup) {
          const memberCount = await ctx.db
            .query("conversationMembers")
            .withIndex("by_conversation_id", (q) =>
              q.eq("conversationId", membership.conversationId)
            )
            .collect();
          groupMemberCount = memberCount.length;
        }

        return {
          conversationId: membership.conversationId,
          isGroup: conversation.isGroup,
          title: conversation.title ?? null,
          otherUser,
          groupMemberCount,
          lastMessageAt,
          lastMessagePreview: preview,
          lastMessageSenderId,
          createdAt: conversation.createdAt,
          unreadCount,
        };
      })
    );

    return results
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => {
        const aTime = a.lastMessageAt ?? a.createdAt;
        const bTime = b.lastMessageAt ?? b.createdAt;
        return bTime - aTime;
      });
  },
});

export const getConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
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
      return null;
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      return null;
    }

    let otherUser: {
      name: string;
      imageUrl?: string;
      clerkUserId: string;
    } | null = null;
    let members: { clerkUserId: string; name: string; imageUrl?: string }[] =
      [];

    if (!conversation.isGroup) {
      const members = await ctx.db
        .query("conversationMembers")
        .withIndex("by_conversation_id", (q) =>
          q.eq("conversationId", args.conversationId)
        )
        .collect();

      const otherMember = members.find(
        (member) => member.clerkUserId !== identity.subject
      );

      if (otherMember) {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerk_user_id", (q) =>
            q.eq("clerkUserId", otherMember.clerkUserId)
          )
          .unique();

        if (user) {
          otherUser = {
            name: user.name,
            imageUrl: user.imageUrl,
            clerkUserId: user.clerkUserId,
          };
        }
      }
    }

    if (conversation.isGroup) {
      const membershipRecords = await ctx.db
        .query("conversationMembers")
        .withIndex("by_conversation_id", (q) =>
          q.eq("conversationId", args.conversationId)
        )
        .collect();

      const memberUsers = await Promise.all(
        membershipRecords.map(async (member) => {
          const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_user_id", (q) =>
              q.eq("clerkUserId", member.clerkUserId)
            )
            .unique();
          return {
            clerkUserId: member.clerkUserId,
            name: user?.name ?? "Unknown",
            imageUrl: user?.imageUrl,
          };
        })
      );

      members = memberUsers;
    }

    return {
      conversationId: args.conversationId,
      isGroup: conversation.isGroup,
      title: conversation.title ?? null,
      otherUser,
      members,
    };
  },
});
