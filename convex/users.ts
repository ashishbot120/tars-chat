import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsertUserFromClerk = mutation({
  args: {
    clerkUserId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const nameLower = args.name.trim().toLowerCase();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .unique();

    if (existing) {
      const updates: {
        name: string;
        nameLower: string;
        email?: string;
        imageUrl?: string;
      } = { name: args.name, nameLower };

      if (args.email !== undefined) {
        updates.email = args.email;
      }

      if (args.imageUrl !== undefined) {
        updates.imageUrl = args.imageUrl;
      }

      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }

    const userId = await ctx.db.insert("users", {
      clerkUserId: args.clerkUserId,
      name: args.name,
      nameLower,
      email: args.email,
      imageUrl: args.imageUrl,
      createdAt: Date.now(),
    });

    return userId;
  },
});

export const getUserByClerkId = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .unique();
  },
});

export const listUsers = query({
  args: {
    excludeClerkUserId: v.string(),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const users = await ctx.db
      .query("users")
      .withIndex("by_name_lower")
      .order("asc")
      .collect();

    const normalizedSearch = args.search?.trim().toLowerCase();

    return users
      .filter((user) => user.clerkUserId !== args.excludeClerkUserId)
      .filter((user) => {
        if (!normalizedSearch) return true;
        const lower = user.nameLower ?? user.name.toLowerCase();
        return lower.includes(normalizedSearch);
      });
  },
});

export const backfillNameLower = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const users = await ctx.db.query("users").collect();
    let updated = 0;

    for (const user of users) {
      if (!user.nameLower) {
        await ctx.db.patch(user._id, { nameLower: user.name.toLowerCase() });
        updated += 1;
      }
    }

    return { updated };
  },
});
