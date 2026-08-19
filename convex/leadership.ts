import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const fields = {
  name: v.string(),
  role: v.string(),
  initials: v.string(),
  experience: v.string(),
  specialization: v.string(),
  vision: v.string(),
  message: v.string(),
  profileImageId: v.optional(v.id("_storage")),
  profileImageUrl: v.optional(v.string()),
  cloudinaryPublicId: v.optional(v.string()),
  cloudinarySecureUrl: v.optional(v.string()),
  profileSlug: v.optional(v.string()),
  linkedinUrl: v.optional(v.string()),
  isActive: v.boolean(),
  order: v.number(),
};

async function resolve(ctx: any, leader: any) {
  let resolvedImageUrl = leader.cloudinarySecureUrl ?? leader.profileImageUrl ?? null;
  if (!resolvedImageUrl && leader.profileImageId) {
    resolvedImageUrl = await ctx.storage.getUrl(leader.profileImageId);
  }
  return { ...leader, resolvedImageUrl };
}

export const listAll = query({
  handler: async (ctx) => {
    const list = await ctx.db.query("leadership").collect();
    list.sort((a, b) => a.order - b.order);
    return Promise.all(list.map((l) => resolve(ctx, l)));
  },
});

export const listActive = query({
  handler: async (ctx) => {
    const list = await ctx.db
      .query("leadership")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    list.sort((a, b) => a.order - b.order);
    return Promise.all(list.map((l) => resolve(ctx, l)));
  },
});

export const create = mutation({
  args: { ...fields, token: v.optional(v.string()) },
  handler: async (ctx, { token, ...args }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    return ctx.db.insert("leadership", args);
  },
});

export const update = mutation({
  args: { id: v.id("leadership"), ...fields, token: v.optional(v.string()) },
  handler: async (ctx, { id, token, ...args }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    const existing = await ctx.db.get(id);
    if (existing?.profileImageId && args.profileImageId !== existing.profileImageId) {
      await ctx.storage.delete(existing.profileImageId);
    }
    await ctx.db.patch(id, args);
  },
});

export const toggleActive = mutation({
  args: { id: v.id("leadership"), token: v.optional(v.string()) },
  handler: async (ctx, { id, token }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    const item = await ctx.db.get(id);
    if (!item) throw new Error("Not found");
    await ctx.db.patch(id, { isActive: !item.isActive });
  },
});

export const remove = mutation({
  args: { id: v.id("leadership"), token: v.optional(v.string()) },
  handler: async (ctx, { id, token }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    const item = await ctx.db.get(id);
    if (item?.profileImageId) await ctx.storage.delete(item.profileImageId);
    await ctx.db.delete(id);
  },
});
