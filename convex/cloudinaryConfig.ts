import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const get = query({
  handler: async (ctx) => {
    return ctx.db.query("cloudinaryConfig").first();
  },
});

export const getInternal = internalQuery({
  handler: async (ctx) => {
    return ctx.db.query("cloudinaryConfig").first();
  },
});

export const save = mutation({
  args: {
    cloudName: v.string(),
    apiKey: v.string(),
    token: v.optional(v.string()),
  },
  handler: async (ctx, { cloudName, apiKey, token }) => {
    if (token) {
      const session = await ctx.runQuery(internal.authHelpers.validateSession, { token });
      if (!session) throw new Error("Unauthorized");
    }
    const existing = await ctx.db.query("cloudinaryConfig").first();
    if (existing) {
      await ctx.db.patch(existing._id, { cloudName, apiKey, isConfigured: true });
    } else {
      await ctx.db.insert("cloudinaryConfig", { cloudName, apiKey, isConfigured: true });
    }
  },
});
