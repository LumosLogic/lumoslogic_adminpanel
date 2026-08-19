import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const fields = {
  caseId: v.string(),
  title: v.string(),
  client: v.string(),
  category: v.string(),
  type: v.string(),
  description: v.string(),
  fullDescription: v.string(),
  technologies: v.array(v.string()),
  results: v.array(v.object({ metric: v.string(), description: v.string() })),
  year: v.string(),
  duration: v.string(),
  link: v.optional(v.string()),
  featured: v.boolean(),
  imageIds: v.array(v.id("_storage")),
  cloudinaryImages: v.optional(v.array(v.object({ publicId: v.string(), secureUrl: v.string() }))),
  isActive: v.boolean(),
  order: v.number(),
};

async function resolve(ctx: any, cs: any) {
  let imageUrls: (string | null)[] = [];
  if (cs.cloudinaryImages && cs.cloudinaryImages.length > 0) {
    imageUrls = cs.cloudinaryImages.map((img: any) => img.secureUrl);
  } else if (cs.imageIds && cs.imageIds.length > 0) {
    imageUrls = await Promise.all(cs.imageIds.map((id: any) => ctx.storage.getUrl(id)));
  }
  return { ...cs, imageUrls };
}

export const listAll = query({
  handler: async (ctx) => {
    const list = await ctx.db.query("caseStudies").collect();
    return Promise.all(list.map((c) => resolve(ctx, c)));
  },
});

export const listActive = query({
  handler: async (ctx) => {
    const list = await ctx.db
      .query("caseStudies")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    return Promise.all(list.map((c) => resolve(ctx, c)));
  },
});

export const getActiveByCaseId = query({
  args: { caseId: v.string() },
  handler: async (ctx, { caseId }) => {
    const cs = await ctx.db
      .query("caseStudies")
      .withIndex("by_caseId", (q) => q.eq("caseId", caseId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
    if (!cs) return null;
    return resolve(ctx, cs);
  },
});

export const create = mutation({
  args: { ...fields, token: v.optional(v.string()) },
  handler: async (ctx, { token, ...args }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    return ctx.db.insert("caseStudies", args);
  },
});

export const update = mutation({
  args: { id: v.id("caseStudies"), ...fields, token: v.optional(v.string()) },
  handler: async (ctx, { id, token, ...args }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    const existing = await ctx.db.get(id);
    if (existing) {
      const removedIds = existing.imageIds.filter(
        (oldId: any) => !args.imageIds.includes(oldId)
      );
      await Promise.all(removedIds.map((sid: any) => ctx.storage.delete(sid)));
    }
    await ctx.db.patch(id, args);
  },
});

export const toggleActive = mutation({
  args: { id: v.id("caseStudies"), token: v.optional(v.string()) },
  handler: async (ctx, { id, token }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    const cs = await ctx.db.get(id);
    if (!cs) throw new Error("Not found");
    await ctx.db.patch(id, { isActive: !cs.isActive });
  },
});

export const remove = mutation({
  args: { id: v.id("caseStudies"), token: v.optional(v.string()) },
  handler: async (ctx, { id, token }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    const cs = await ctx.db.get(id);
    if (cs?.imageIds?.length) {
      await Promise.all(cs.imageIds.map((sid: any) => ctx.storage.delete(sid)));
    }
    await ctx.db.delete(id);
  },
});
