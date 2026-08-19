import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const fields = {
  serviceId: v.string(),
  title: v.string(),
  description: v.string(),
  heroDescription: v.string(),
  features: v.array(v.string()),
  technologies: v.array(v.object({ name: v.string(), icon: v.string() })),
  startingPrice: v.string(),
  deliveryTime: v.string(),
  imageId: v.optional(v.id("_storage")),
  imageUrl: v.optional(v.string()),
  cloudinaryPublicId: v.optional(v.string()),
  cloudinarySecureUrl: v.optional(v.string()),
  benefits: v.array(v.string()),
  process: v.array(
    v.object({ step: v.number(), title: v.string(), description: v.string() })
  ),
  faqs: v.array(v.object({ question: v.string(), answer: v.string() })),
  teamMembers: v.array(v.string()),
  isActive: v.boolean(),
  order: v.number(),
};

async function resolve(ctx: any, svc: any) {
  let resolvedImageUrl = svc.cloudinarySecureUrl ?? svc.imageUrl ?? null;
  if (!resolvedImageUrl && svc.imageId) {
    resolvedImageUrl = await ctx.storage.getUrl(svc.imageId);
  }
  return { ...svc, resolvedImageUrl };
}

export const listAll = query({
  handler: async (ctx) => {
    const list = await ctx.db.query("services").collect();
    return Promise.all(list.map((s) => resolve(ctx, s)));
  },
});

export const listActive = query({
  handler: async (ctx) => {
    const list = await ctx.db
      .query("services")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    return Promise.all(list.map((s) => resolve(ctx, s)));
  },
});

export const getActiveById = query({
  args: { serviceId: v.string() },
  handler: async (ctx, { serviceId }) => {
    const svc = await ctx.db
      .query("services")
      .withIndex("by_serviceId", (q) => q.eq("serviceId", serviceId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
    if (!svc) return null;
    return resolve(ctx, svc);
  },
});

export const create = mutation({
  args: { ...fields, token: v.optional(v.string()) },
  handler: async (ctx, { token, ...args }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    return ctx.db.insert("services", args);
  },
});

export const update = mutation({
  args: { id: v.id("services"), ...fields, token: v.optional(v.string()) },
  handler: async (ctx, { id, token, ...args }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    const existing = await ctx.db.get(id);
    if (existing?.imageId && args.imageId !== existing.imageId) {
      await ctx.storage.delete(existing.imageId);
    }
    await ctx.db.patch(id, args);
  },
});

export const toggleActive = mutation({
  args: { id: v.id("services"), token: v.optional(v.string()) },
  handler: async (ctx, { id, token }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    const svc = await ctx.db.get(id);
    if (!svc) throw new Error("Not found");
    await ctx.db.patch(id, { isActive: !svc.isActive });
  },
});

export const remove = mutation({
  args: { id: v.id("services"), token: v.optional(v.string()) },
  handler: async (ctx, { id, token }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    const svc = await ctx.db.get(id);
    if (svc?.imageId) {
      await ctx.storage.delete(svc.imageId);
    }
    await ctx.db.delete(id);
  },
});
