import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const infoShape = {
  name: v.string(),
  email: v.string(),
  phone: v.string(),
  address: v.object({
    street: v.string(),
    landmark: v.string(),
    city: v.string(),
    state: v.string(),
    pincode: v.string(),
    country: v.string(),
  }),
  social: v.object({
    instagram: v.string(),
    linkedin: v.string(),
    youtube: v.string(),
  }),
  stats: v.object({
    projectsCompleted: v.string(),
    clientSatisfaction: v.string(),
    yearsExperience: v.string(),
    teamMembers: v.string(),
    supportAvailability: v.string(),
  }),
};

export const get = query({
  handler: async (ctx) => {
    return ctx.db.query("companyInfo").first();
  },
});

export const upsert = mutation({
  args: { ...infoShape, token: v.optional(v.string()) },
  handler: async (ctx, { token, ...args }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    const existing = await ctx.db.query("companyInfo").first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("companyInfo", args);
    }
  },
});
