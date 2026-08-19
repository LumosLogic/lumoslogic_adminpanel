import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const fields = {
  slug: v.string(),
  name: v.string(),
  tagline: v.string(),
  description: v.string(),
  longDescription: v.string(),
  what_it_does: v.optional(v.string()),
  purpose: v.optional(v.string()),
  summary: v.optional(v.string()),
  functionality: v.optional(v.array(v.string())),
  screens: v.optional(v.array(v.object({
    name: v.string(),
    desc: v.string(),
    imageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    cloudinaryPublicId: v.optional(v.string()),
    cloudinarySecureUrl: v.optional(v.string()),
  }))),
  heroImageId: v.optional(v.id("_storage")),
  heroImageUrl: v.optional(v.string()),
  cloudinaryPublicId: v.optional(v.string()),
  cloudinarySecureUrl: v.optional(v.string()),
  siteUrl: v.optional(v.string()),
  features: v.array(v.object({ title: v.string(), description: v.string() })),
  benefits: v.array(v.string()),
  useCases: v.array(v.string()),
  techStack: v.array(v.string()),
  faq: v.array(v.object({ q: v.string(), a: v.string() })),
  isActive: v.boolean(),
  order: v.number(),
};

async function resolve(ctx: any, product: any) {
  let resolvedHeroImageUrl = product.cloudinarySecureUrl ?? product.heroImageUrl ?? null;
  if (!resolvedHeroImageUrl && product.heroImageId) {
    resolvedHeroImageUrl = await ctx.storage.getUrl(product.heroImageId);
  }

  const screens = product.screens
    ? await Promise.all(
        product.screens.map(async (s: any) => ({
          ...s,
          resolvedImageUrl: s.cloudinarySecureUrl ?? (s.imageId
            ? await ctx.storage.getUrl(s.imageId)
            : (s.imageUrl ?? null)),
        }))
      )
    : undefined;

  return { ...product, resolvedHeroImageUrl, screens };
}

export const listAll = query({
  handler: async (ctx) => {
    const list = await ctx.db.query("products").collect();
    return Promise.all(list.map((p) => resolve(ctx, p)));
  },
});

export const listActive = query({
  handler: async (ctx) => {
    const list = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    return Promise.all(list.map((p) => resolve(ctx, p)));
  },
});

export const getActiveBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const product = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
    if (!product) return null;
    return resolve(ctx, product);
  },
});

export const create = mutation({
  args: { ...fields, token: v.optional(v.string()) },
  handler: async (ctx, { token, ...args }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    return ctx.db.insert("products", args);
  },
});

export const update = mutation({
  args: { id: v.id("products"), ...fields, token: v.optional(v.string()) },
  handler: async (ctx, { id, token, ...args }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    const existing = await ctx.db.get(id);
    if (existing?.heroImageId && args.heroImageId !== existing.heroImageId) {
      await ctx.storage.delete(existing.heroImageId);
    }
    await ctx.db.patch(id, args);
  },
});

export const toggleActive = mutation({
  args: { id: v.id("products"), token: v.optional(v.string()) },
  handler: async (ctx, { id, token }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    const product = await ctx.db.get(id);
    if (!product) throw new Error("Not found");
    await ctx.db.patch(id, { isActive: !product.isActive });
  },
});

export const remove = mutation({
  args: { id: v.id("products"), token: v.optional(v.string()) },
  handler: async (ctx, { id, token }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    const product = await ctx.db.get(id);
    if (product?.heroImageId) {
      await ctx.storage.delete(product.heroImageId);
    }
    await ctx.db.delete(id);
  },
});
