import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const requireAdmin = internalQuery({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, { token }) => {
    if (!token) throw new Error("Unauthorized: missing token");
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
    if (!session || session.expires_at < Date.now()) throw new Error("Unauthorized: invalid session");
    return session;
  },
});

export const getAdminByUsername = internalQuery({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    return ctx.db
      .query("admins")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();
  },
});

export const validateSession = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
    if (!session || session.expires_at < Date.now()) return null;
    return session;
  },
});

export const createSession = internalMutation({
  args: { admin_id: v.id("admins"), token: v.string(), expires_at: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.insert("sessions", args);
  },
});

export const logout = internalMutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
    if (session) await ctx.db.delete(session._id);
  },
});

export const insertAdmin = internalMutation({
  args: { username: v.string(), password_hash: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("admins", args);
  },
});
