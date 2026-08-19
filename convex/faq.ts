import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const fields = {
  question: v.string(),
  answer: v.string(),
  category: v.optional(v.string()),
  isActive: v.boolean(),
  order: v.number(),
};

export const listAll = query({
  handler: async (ctx) => {
    return ctx.db.query("faq").collect();
  },
});

export const listActive = query({
  handler: async (ctx) => {
    return ctx.db
      .query("faq")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const create = mutation({
  args: { ...fields, token: v.optional(v.string()) },
  handler: async (ctx, { token, ...args }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    return ctx.db.insert("faq", args);
  },
});

export const update = mutation({
  args: { id: v.id("faq"), ...fields, token: v.optional(v.string()) },
  handler: async (ctx, { id, token, ...args }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    await ctx.db.patch(id, args);
  },
});

export const toggleActive = mutation({
  args: { id: v.id("faq"), token: v.optional(v.string()) },
  handler: async (ctx, { id, token }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    const item = await ctx.db.get(id);
    if (!item) throw new Error("Not found");
    await ctx.db.patch(id, { isActive: !item.isActive });
  },
});

export const remove = mutation({
  args: { id: v.id("faq"), token: v.optional(v.string()) },
  handler: async (ctx, { id, token }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    await ctx.db.delete(id);
  },
});
