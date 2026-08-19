import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Public — used by the main website to fetch open jobs
export const listOpen = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("jobs")
      .filter((q) => q.eq(q.field("status"), "Open"))
      .collect();
  },
});

// Admin — all jobs regardless of status
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("jobs").order("desc").collect();
  },
});

export const getById = query({
  args: { id: v.id("jobs") },
  handler: async (ctx, { id }) => {
    return ctx.db.get(id);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    department: v.string(),
    location: v.string(),
    experience: v.string(),
    description: v.string(),
    type: v.string(),
    skills: v.string(),
    status: v.union(v.literal("Open"), v.literal("Closed")),
    token: v.optional(v.string()),
  },
  handler: async (ctx, { token, ...args }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    return ctx.db.insert("jobs", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("jobs"),
    title: v.string(),
    department: v.string(),
    location: v.string(),
    experience: v.string(),
    description: v.string(),
    type: v.string(),
    skills: v.string(),
    status: v.union(v.literal("Open"), v.literal("Closed")),
    token: v.optional(v.string()),
  },
  handler: async (ctx, { id, token, ...fields }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    await ctx.db.patch(id, fields);
  },
});

export const toggleStatus = mutation({
  args: { id: v.id("jobs"), token: v.optional(v.string()) },
  handler: async (ctx, { id, token }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    const job = await ctx.db.get(id);
    if (!job) throw new Error("Job not found");
    await ctx.db.patch(id, { status: job.status === "Open" ? "Closed" : "Open" });
  },
});

export const remove = mutation({
  args: { id: v.id("jobs"), token: v.optional(v.string()) },
  handler: async (ctx, { id, token }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    await ctx.db.delete(id);
  },
});
