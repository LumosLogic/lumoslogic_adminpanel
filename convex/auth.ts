"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { createHash, randomBytes } from "crypto";

const hashPassword = (password: string) =>
  createHash("sha256").update(password).digest("hex");

export const login = action({
  args: { username: v.string(), password: v.string() },
  handler: async (ctx, { username, password }) => {
    const admin = await ctx.runQuery(internal.authHelpers.getAdminByUsername, { username });
    if (!admin) throw new Error("Invalid credentials");
    if (admin.password_hash !== hashPassword(password)) throw new Error("Invalid credentials");

    const token = randomBytes(32).toString("hex");
    const expires_at = Date.now() + 7 * 24 * 60 * 60 * 1000;
    await ctx.runMutation(internal.authHelpers.createSession, {
      admin_id: admin._id,
      token,
      expires_at,
    });
    return { token };
  },
});

// One-time seed — run from Convex dashboard to create first admin
export const seedAdmin = action({
  args: { username: v.string(), password: v.string() },
  handler: async (ctx, { username, password }) => {
    const existing = await ctx.runQuery(internal.authHelpers.getAdminByUsername, { username });
    if (existing) throw new Error("Admin already exists");
    await ctx.runMutation(internal.authHelpers.insertAdmin, {
      username,
      password_hash: hashPassword(password),
    });
    return { success: true };
  },
});
