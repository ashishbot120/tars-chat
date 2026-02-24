import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const heartbeat = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { online: true, lastSeenAt: now });
    } else {
      await ctx.db.insert("presence", {
        clerkUserId: identity.subject,
        online: true,
        lastSeenAt: now,
      });
    }
  },
});

export const listPresence = query({
  args: { clerkUserIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const presence = await Promise.all(
      args.clerkUserIds.map(async (clerkUserId) => {
        const record = await ctx.db
          .query("presence")
          .withIndex("by_clerk_user_id", (q) =>
            q.eq("clerkUserId", clerkUserId)
          )
          .unique();

        if (!record) {
          return {
            clerkUserId,
            online: false,
            lastSeenAt: null as number | null,
          };
        }

        return {
          clerkUserId,
          online: record.online,
          lastSeenAt: record.lastSeenAt,
        };
      })
    );

    return presence;
  },
});
