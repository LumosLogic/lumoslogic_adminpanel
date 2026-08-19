import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const fields = {
  slug: v.string(),
  title: v.string(),
  excerpt: v.string(),
  content: v.string(),
  author: v.string(),
  authorRole: v.string(),
  date: v.string(),
  readTime: v.string(),
  category: v.string(),
  tags: v.array(v.string()),
  imageId: v.optional(v.id("_storage")),
  imageUrl: v.optional(v.string()),
  cloudinaryPublicId: v.optional(v.string()),
  cloudinarySecureUrl: v.optional(v.string()),
  featured: v.boolean(),
  isActive: v.boolean(),
};

async function resolve(ctx: any, post: any) {
  let resolvedImageUrl = post.cloudinarySecureUrl ?? post.imageUrl ?? null;
  if (!resolvedImageUrl && post.imageId) {
    resolvedImageUrl = await ctx.storage.getUrl(post.imageId);
  }
  return { ...post, resolvedImageUrl };
}

export const listAll = query({
  handler: async (ctx) => {
    const list = await ctx.db.query("blogPosts").collect();
    return Promise.all(list.map((p) => resolve(ctx, p)));
  },
});

export const listActive = query({
  handler: async (ctx) => {
    const list = await ctx.db
      .query("blogPosts")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    return Promise.all(list.map((p) => resolve(ctx, p)));
  },
});

export const getActiveBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const post = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
    if (!post) return null;
    return resolve(ctx, post);
  },
});

export const create = mutation({
  args: { ...fields, token: v.optional(v.string()) },
  handler: async (ctx, { token, ...args }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    return ctx.db.insert("blogPosts", args);
  },
});

export const update = mutation({
  args: { id: v.id("blogPosts"), ...fields, token: v.optional(v.string()) },
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
  args: { id: v.id("blogPosts"), token: v.optional(v.string()) },
  handler: async (ctx, { id, token }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    const post = await ctx.db.get(id);
    if (!post) throw new Error("Not found");
    await ctx.db.patch(id, { isActive: !post.isActive });
  },
});

export const remove = mutation({
  args: { id: v.id("blogPosts"), token: v.optional(v.string()) },
  handler: async (ctx, { id, token }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    const post = await ctx.db.get(id);
    if (post?.imageId) {
      await ctx.storage.delete(post.imageId);
    }
    await ctx.db.delete(id);
  },
});
