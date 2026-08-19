import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const fields = {
  name: v.string(),
  role: v.string(),
  email: v.string(),
  headline: v.string(),
  employmentType: v.union(
    v.literal("Full-time"),
    v.literal("Part-time"),
    v.literal("Intern"),
    v.literal("Contract")
  ),
  profileImageId: v.optional(v.id("_storage")),
  cloudinaryPublicId: v.optional(v.string()),
  cloudinarySecureUrl: v.optional(v.string()),
  linkedinUrl: v.optional(v.string()),
  githubUrl: v.optional(v.string()),
  portfolioUrl: v.optional(v.string()),
  experience: v.string(),
  skills: v.array(v.string()),
  industries: v.array(v.string()),
  bio: v.string(),
  projects: v.array(
    v.object({
      name: v.string(),
      description: v.string(),
      technologies: v.array(v.string()),
    })
  ),
  hobbies: v.array(v.string()),
  quote: v.string(),
  funFact: v.string(),
  preferredContact: v.array(v.string()),
  serviceIds: v.array(v.string()),
  isActive: v.boolean(),
  order: v.number(),
};

async function resolve(ctx: any, emp: any) {
  let profileImageUrl = emp.cloudinarySecureUrl ?? null;
  if (!profileImageUrl && emp.profileImageId) {
    profileImageUrl = await ctx.storage.getUrl(emp.profileImageId);
  }
  return { ...emp, profileImageUrl };
}

export const listAll = query({
  handler: async (ctx) => {
    const list = await ctx.db.query("employees").collect();
    list.sort((a, b) => a.order - b.order);
    return Promise.all(list.map((e) => resolve(ctx, e)));
  },
});

export const listActive = query({
  handler: async (ctx) => {
    const list = await ctx.db
      .query("employees")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    list.sort((a, b) => a.order - b.order);
    return Promise.all(list.map((e) => resolve(ctx, e)));
  },
});

export const create = mutation({
  args: { ...fields, token: v.optional(v.string()) },
  handler: async (ctx, { token, ...args }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    return ctx.db.insert("employees", args);
  },
});

export const update = mutation({
  args: { id: v.id("employees"), ...fields, token: v.optional(v.string()) },
  handler: async (ctx, { id, token, ...args }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    const existing = await ctx.db.get(id);
    if (
      existing?.profileImageId &&
      args.profileImageId !== existing.profileImageId
    ) {
      await ctx.storage.delete(existing.profileImageId);
    }
    await ctx.db.patch(id, args);
  },
});

export const toggleActive = mutation({
  args: { id: v.id("employees"), token: v.optional(v.string()) },
  handler: async (ctx, { id, token }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    const emp = await ctx.db.get(id);
    if (!emp) throw new Error("Not found");
    await ctx.db.patch(id, { isActive: !emp.isActive });
  },
});

export const remove = mutation({
  args: { id: v.id("employees"), token: v.optional(v.string()) },
  handler: async (ctx, { id, token }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    const emp = await ctx.db.get(id);
    if (emp?.profileImageId) {
      await ctx.storage.delete(emp.profileImageId);
    }
    await ctx.db.delete(id);
  },
});
