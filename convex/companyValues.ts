import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const fields = {
  title: v.string(),
  description: v.string(),
  icon: v.string(),
  isActive: v.boolean(),
  order: v.number(),
};

export const listAll = query({
  handler: async (ctx) => {
    const list = await ctx.db.query("companyValues").collect();
    list.sort((a, b) => a.order - b.order);
    return list;
  },
});

export const listActive = query({
  handler: async (ctx) => {
    const list = await ctx.db
      .query("companyValues")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    list.sort((a, b) => a.order - b.order);
    return list;
  },
});

export const create = mutation({
  args: { ...fields, token: v.optional(v.string()) },
  handler: async (ctx, { token, ...args }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    return ctx.db.insert("companyValues", args);
  },
});

export const update = mutation({
  args: { id: v.id("companyValues"), ...fields, token: v.optional(v.string()) },
  handler: async (ctx, { id, token, ...args }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    return ctx.db.patch(id, args);
  },
});

export const toggleActive = mutation({
  args: { id: v.id("companyValues"), token: v.optional(v.string()) },
  handler: async (ctx, { id, token }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    const item = await ctx.db.get(id);
    if (!item) throw new Error("Not found");
    await ctx.db.patch(id, { isActive: !item.isActive });
  },
});

export const remove = mutation({
  args: { id: v.id("companyValues"), token: v.optional(v.string()) },
  handler: async (ctx, { id, token }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    return ctx.db.delete(id);
  },
});
