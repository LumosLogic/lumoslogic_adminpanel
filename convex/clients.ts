import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const fields = {
  name: v.string(),
  logoUrl: v.optional(v.string()),
  logoImageId: v.optional(v.id("_storage")),
  cloudinaryPublicId: v.optional(v.string()),
  cloudinarySecureUrl: v.optional(v.string()),
  websiteUrl: v.optional(v.string()),
  isActive: v.boolean(),
  order: v.number(),
};

export const listAll = query({
  handler: async (ctx) => {
    const list = await ctx.db.query("clients").collect();
    list.sort((a, b) => a.order - b.order);
    return list;
  },
});

export const listActive = query({
  handler: async (ctx) => {
    const list = await ctx.db
      .query("clients")
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
    return ctx.db.insert("clients", args);
  },
});

export const update = mutation({
  args: { id: v.id("clients"), ...fields, token: v.optional(v.string()) },
  handler: async (ctx, { id, token, ...args }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    const existing = await ctx.db.get(id);
    if (existing?.logoImageId && existing.logoImageId !== args.logoImageId && !args.cloudinaryPublicId) {
      await ctx.storage.delete(existing.logoImageId);
    }
    return ctx.db.patch(id, args);
  },
});

export const toggleActive = mutation({
  args: { id: v.id("clients"), token: v.optional(v.string()) },
  handler: async (ctx, { id, token }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    const item = await ctx.db.get(id);
    if (!item) throw new Error("Not found");
    await ctx.db.patch(id, { isActive: !item.isActive });
  },
});

export const remove = mutation({
  args: { id: v.id("clients"), token: v.optional(v.string()) },
  handler: async (ctx, { id, token }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    const item = await ctx.db.get(id);
    if (item?.logoImageId && !item.cloudinaryPublicId) {
      await ctx.storage.delete(item.logoImageId);
    }
    return ctx.db.delete(id);
  },
});
