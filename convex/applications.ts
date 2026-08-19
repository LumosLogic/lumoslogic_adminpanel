import { action, internalAction, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";

const applicationArgs = {
  job_id: v.string(),
  job_title: v.string(),
  candidate_name: v.string(),
  email: v.string(),
  phone: v.string(),
  current_location: v.string(),
  skills: v.string(),
  resume_link: v.string(),
  github_link: v.optional(v.string()),
  portfolio_link: v.optional(v.string()),
  current_company: v.optional(v.string()),
  current_ctc: v.optional(v.string()),
  expected_ctc: v.optional(v.string()),
  notice_period: v.optional(v.string()),
  experience: v.optional(v.string()),
  current_position: v.optional(v.string()),
  cover_letter: v.optional(v.string()),
};

// Public — called by main website on form submit
export const submit = mutation({
  args: applicationArgs,
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("applications")
      .withIndex("by_job", (q) => q.eq("job_id", args.job_id))
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    if (existing) throw new Error("already applied");

    await ctx.db.insert("applications", {
      ...args,
      applied_at: Date.now(),
    });

    // Schedule server-side write to Google Sheets (non-blocking)
    await ctx.scheduler.runAfter(0, internal.applications.syncToSheets, args);
  },
});

// Internal — fires after submit, writes a row to Google Sheets via Apps Script
export const syncToSheets = internalAction({
  args: applicationArgs,
  handler: async (_ctx, args) => {
    const url = process.env.GOOGLE_SHEETS_SCRIPT_URL;
    if (!url) return;
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(args),
      });
    } catch {
      // Sheets write failing should never break application submission
    }
  },
});

// Admin — all applications, optionally filtered by job
export const listAll = query({
  args: { job_id: v.optional(v.string()) },
  handler: async (ctx, { job_id }) => {
    if (job_id) {
      return ctx.db
        .query("applications")
        .withIndex("by_job", (q) => q.eq("job_id", job_id))
        .order("desc")
        .collect();
    }
    return ctx.db.query("applications").order("desc").collect();
  },
});

export const getById = query({
  args: { id: v.id("applications") },
  handler: async (ctx, { id }) => {
    return ctx.db.get(id);
  },
});

export const remove = mutation({
  args: { id: v.id("applications"), token: v.optional(v.string()) },
  handler: async (ctx, { id, token }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    await ctx.db.delete(id);
  },
});

// Admin — bulk sync all existing applications to Google Sheets
export const syncAllToSheets = action({
  args: {},
  handler: async (ctx) => {
    const url = process.env.GOOGLE_SHEETS_SCRIPT_URL;
    if (!url) throw new Error("GOOGLE_SHEETS_SCRIPT_URL is not configured in Convex environment variables.");

    const apps = await ctx.runQuery(api.applications.listAll, {});
    let synced = 0;

    for (const app of apps) {
      try {
        await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify(app),
        });
        synced++;
      } catch {
        // continue with remaining records
      }
    }

    return { synced, total: apps.length };
  },
});
